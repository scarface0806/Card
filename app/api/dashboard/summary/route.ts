import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticate } from "@/lib/auth-middleware";
import { errorResponse } from "@/lib/responses";
import { Role } from "@prisma/client";
import {
  DASHBOARD_SUMMARY_TTL_MS,
  dashboardSummaryKey,
  readCache,
  writeCache,
} from "@/lib/dashboard-cache";
import {
  istStartOfToday,
  istStartOfMonth,
} from "@/lib/ist-date-windows";

/**
 * GET /api/dashboard/summary
 *
 * Single source for every number the admin dashboard renders. Replaces the pair
 * of endpoints the dashboard used to call (/api/admin/dashboard, 21 queries, and
 * /api/dashboard, 7 queries) with one response backed by 4 aggregations.
 *
 * All aggregates are computed by the database ($group / $sum / $count inside a
 * $facet). Nothing is counted in JavaScript, and no collection is loaded into
 * memory. The only documents that cross the wire are the 5 recent orders.
 *
 * Date windows
 * ------------
 * "Today" and "this month" are computed in Asia/Kolkata (IST, UTC+05:30), not
 * in the server's local timezone. The server runs in UTC on Vercel, so a naive
 * `new Date().setHours(0,0,0,0)` would put the day boundary at 05:30 IST and
 * silently drop every order placed between 00:00 and 05:30 IST. Windows are
 * derived from `Intl.DateTimeFormat` (see src/lib/ist-date-windows.ts) so the
 * offset is read from the runtime and not hard-coded.
 *
 * Revenue predicate
 * -----------------
 * Total / month / today all filter on `paymentStatus: "PAID"`. The previous
 * implementation used a hand-maintained list of "completed" order-status
 * strings for the today facet, which meant a freshly-paid order that the
 * admin had not yet moved to DELIVERED was counted in total and month but not
 * in today. That inconsistency is removed: the same predicate is used for all
 * three revenue cards.
 */

// `_id` is the grouped value: a status string for orders, a boolean for the
// customers isActive split.
type CountRow = { _id: string | boolean | null; n: number };
type SumRow = { _id: null; t: number | null };

type OrderFacets = {
  byStatus?: CountRow[];
  byPayment?: CountRow[];
  totalCount?: { n: number }[];
  monthCount?: { n: number }[];
  revenueTotal?: SumRow[];
  revenueMonth?: SumRow[];
  revenueToday?: SumRow[];
};

type RecentOrderRaw = {
  _id: unknown;
  orderNumber?: string;
  total?: number;
  status?: string;
  paymentStatus?: string;
  createdAt?: unknown;
  customer?: string | null;
};

/** aggregateRaw returns extended JSON: ObjectId as {$oid}, Date as {$date}. */
function asId(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "$oid" in (value as Record<string, unknown>)) {
    return String((value as Record<string, unknown>).$oid);
  }
  return String(value ?? "");
}

function asIsoDate(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "$date" in (value as Record<string, unknown>)) {
    const raw = (value as Record<string, unknown>).$date;
    if (typeof raw === "string") return raw;
    if (typeof raw === "number") return new Date(raw).toISOString();
    if (raw && typeof raw === "object" && "$numberLong" in (raw as Record<string, unknown>)) {
      return new Date(Number((raw as Record<string, unknown>).$numberLong)).toISOString();
    }
  }
  return new Date().toISOString();
}

function toCountMap(rows: CountRow[] | undefined): Record<string, number> {
  const map: Record<string, number> = {};
  for (const row of rows || []) {
    if (row?._id != null) map[String(row._id)] = Number(row.n) || 0;
  }
  return map;
}

function firstSum(rows: SumRow[] | undefined): number {
  const value = rows?.[0]?.t;
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function firstCount(rows: { n: number }[] | undefined): number {
  const value = rows?.[0]?.n;
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

async function buildSummary() {
  const now = new Date();
  // IST (Asia/Kolkata) day and month starts, expressed as real UTC instants
  // so the $match stages in the aggregation pipeline are timezone-correct
  // even though the server itself runs in UTC.
  const todayIst = istStartOfToday(now);
  const monthIst = istStartOfMonth(now);

  const todayStartFilter = { $gte: { $date: todayIst.startUtc.toISOString() } };
  const monthStartFilter = { $gte: { $date: monthIst.startUtc.toISOString() } };

  // 4 independent aggregations, issued concurrently. Each is one round trip.
  const [orderAgg, recentAgg, customerAgg, leadAgg] = await Promise.all([
    // (1) Every order metric in a single pass over the collection. Counting all
    //     orders by status necessarily reads the whole collection once, so one
    //     scan computing everything beats N indexed counts each paying a
    //     round trip.
    prisma.order.aggregateRaw({
      pipeline: [
        {
          $facet: {
            byStatus: [{ $group: { _id: "$status", n: { $sum: 1 } } }],
            byPayment: [{ $group: { _id: "$paymentStatus", n: { $sum: 1 } } }],
            totalCount: [{ $count: "n" }],
            monthCount: [{ $match: { createdAt: monthStartFilter } }, { $count: "n" }],
            revenueTotal: [
              { $match: { paymentStatus: "PAID" } },
              { $group: { _id: null, t: { $sum: "$total" } } },
            ],
            revenueMonth: [
              { $match: { paymentStatus: "PAID", createdAt: monthStartFilter } },
              { $group: { _id: null, t: { $sum: "$total" } } },
            ],
            // Same predicate as total and month so a freshly-paid order
            // counts in all three cards, including today's. The previous
            // implementation filtered on a hand-maintained list of
            // "completed" order-status strings, which excluded any order the
            // admin had not yet moved to DELIVERED.
            revenueToday: [
              {
                $match: {
                  paymentStatus: "PAID",
                  createdAt: todayStartFilter,
                },
              },
              { $group: { _id: null, t: { $sum: "$total" } } },
            ],
          },
        },
      ],
    }),

    // (2) Recent 5 only. $sort + $limit run before $lookup, so exactly 5 user
    //     documents are joined — no N+1 — and the sort is served by the
    //     orders(createdAt desc) index rather than an in-memory sort.
    prisma.order.aggregateRaw({
      pipeline: [
        { $sort: { createdAt: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "_user",
            pipeline: [{ $project: { name: 1, email: 1 } }],
          },
        },
        {
          $project: {
            orderNumber: 1,
            total: 1,
            status: 1,
            paymentStatus: 1,
            createdAt: 1,
            customer: {
              $ifNull: [
                { $arrayElemAt: ["$_user.name", 0] },
                {
                  $ifNull: [
                    "$guestName",
                    {
                      $ifNull: [
                        { $arrayElemAt: ["$_user.email", 0] },
                        { $ifNull: ["$guestEmail", "Guest"] },
                      ],
                    },
                  ],
                },
              ],
            },
          },
        },
      ],
    }),

    // (3) Customer totals: one $group yields total / active / disabled.
    prisma.customer.aggregateRaw({
      pipeline: [{ $group: { _id: "$isActive", n: { $sum: 1 } } }],
    }),

    // (4) Lead totals in one pass.
    prisma.mainWebsiteLead.aggregateRaw({
      pipeline: [
        {
          $facet: {
            totalCount: [{ $count: "n" }],
            monthCount: [{ $match: { createdAt: monthStartFilter } }, { $count: "n" }],
          },
        },
      ],
    }),
  ]);

  const facets = ((orderAgg as unknown as OrderFacets[])?.[0] || {}) as OrderFacets;
  const byStatus = toCountMap(facets.byStatus);
  const byPayment = toCountMap(facets.byPayment);

  const customerRows = (customerAgg as unknown as CountRow[]) || [];
  let customersActive = 0;
  let customersDisabled = 0;
  for (const row of customerRows) {
    // _id is the boolean isActive value; extended JSON keeps booleans as-is.
    if (row?._id === true || String(row?._id) === "true") customersActive += Number(row.n) || 0;
    else customersDisabled += Number(row.n) || 0;
  }

  const leadFacets = ((leadAgg as unknown as OrderFacets[])?.[0] || {}) as OrderFacets;

  const recentOrders = ((recentAgg as unknown as RecentOrderRaw[]) || []).map((order) => ({
    id: asId(order._id),
    orderNumber: order.orderNumber ?? "",
    total: Number(order.total) || 0,
    status: order.status ?? "",
    paymentStatus: order.paymentStatus ?? "",
    createdAt: asIsoDate(order.createdAt),
    customer: order.customer || "Guest",
  }));

  return {
    customers: {
      total: customersActive + customersDisabled,
      active: customersActive,
      disabled: customersDisabled,
    },
    orders: {
      total: firstCount(facets.totalCount),
      pending: byStatus.PENDING || 0,
      completed: byStatus.DELIVERED || 0,
      cancelled: byStatus.CANCELLED || 0,
      thisMonth: firstCount(facets.monthCount),
      byStatus,
      byPayment,
    },
    revenue: {
      total: firstSum(facets.revenueTotal),
      thisMonth: firstSum(facets.revenueMonth),
      today: firstSum(facets.revenueToday),
    },
    // The two revenue windows expressed in IST, so the UI can display
    // "showing IST 2026-09-05" and any timezone regression is visible in
    // the rendered number, not only in a server log.
    windows: {
      timezone: "Asia/Kolkata",
      today: todayIst.startYmd,
      month: monthIst.startYm,
    },
    leads: {
      total: firstCount(leadFacets.totalCount),
      unread: 0,
      thisMonth: firstCount(leadFacets.monthCount),
    },
    recentOrders,
    generatedAt: new Date().toISOString(),
  };
}

export async function GET(request: NextRequest) {
  const startedAt = Date.now();
  const { user, error } = await authenticate(request);

  if (!user || user.role !== Role.ADMIN) {
    return NextResponse.json({ error: error || "Admin access required" }, { status: 403 });
  }

  const cacheKey = dashboardSummaryKey(user.id);
  const cached = readCache<Awaited<ReturnType<typeof buildSummary>>>(cacheKey);

  if (cached?.fresh) {
    const ttlLeft = Math.max(0, Math.round((DASHBOARD_SUMMARY_TTL_MS - cached.ageMs) / 1000));
    console.info(`[dashboard/summary] cache HIT age=${cached.ageMs}ms total=${Date.now() - startedAt}ms`);

    return NextResponse.json(
      { success: true, message: "OK", data: cached.value, ...cached.value },
      {
        status: 200,
        headers: {
          "Cache-Control": `private, max-age=${ttlLeft}, stale-while-revalidate=60`,
          "X-Cache": "HIT",
          "Server-Timing": `cache;dur=0, total;dur=${Date.now() - startedAt}`,
        },
      }
    );
  }

  try {
    const queryStart = Date.now();
    const summary = await buildSummary();
    const queryMs = Date.now() - queryStart;
    const totalMs = Date.now() - startedAt;

    writeCache(cacheKey, summary);
    console.info(
      `[dashboard/summary] cache MISS db=${queryMs}ms total=${totalMs}ms roundTrips=4 ` +
        `tz=${summary.windows.timezone} today=${summary.windows.today} month=${summary.windows.month} ` +
        `revenue.total=${summary.revenue.total} revenue.month=${summary.revenue.thisMonth} revenue.today=${summary.revenue.today}`
    );

    return NextResponse.json(
      { success: true, message: "OK", data: summary, ...summary },
      {
        status: 200,
        headers: {
          "Cache-Control": `private, max-age=${Math.round(DASHBOARD_SUMMARY_TTL_MS / 1000)}, stale-while-revalidate=60`,
          "X-Cache": "MISS",
          "Server-Timing": `db;dur=${queryMs}, total;dur=${totalMs}`,
        },
      }
    );
  } catch (err) {
    console.error("[dashboard/summary] query failed:", err);

    // Serve last-known numbers rather than an error screen when the database
    // is briefly unreachable.
    if (cached) {
      return NextResponse.json(
        { success: true, message: "OK (stale)", data: cached.value, ...cached.value },
        {
          status: 200,
          headers: {
            "Cache-Control": "private, max-age=0, must-revalidate",
            "X-Cache": "STALE",
            "Server-Timing": `total;dur=${Date.now() - startedAt}`,
          },
        }
      );
    }

    return errorResponse("Failed to fetch dashboard metrics", 500);
  }
}
