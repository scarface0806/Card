/**
 * IST (Asia/Kolkata, UTC+05:30) date windows for revenue and order-volume
 * aggregates.
 *
 * The dashboard is consumed by an Indian business in IST, but the server runs
 * in UTC (Vercel). Computing "today" with `new Date().setHours(0,0,0,0)` gives
 * a UTC midnight window, which drops every order placed between 00:00 and
 * 05:30 IST from "today" and shifts orders placed between 00:00 and 00:30 IST
 * on the 1st of a month into the previous month.
 *
 * This module computes the IST day/month start as a real UTC instant, so the
 * aggregation pipeline can use it in a `$match` stage without any server-TZ
 * assumptions. The IST offset is derived from `Intl.DateTimeFormat`, which is
 * the authoritative answer for "what is the wall-clock time in this zone" and
 * is correct on every Node version we run on. No fixed +5:30 arithmetic and
 * no external date library.
 *
 * Asia/Kolkata is a fixed +05:30 offset with no DST. We still derive the
 * offset from the runtime (rather than hard-coding it) so a future TZ change
 * cannot silently shift the dashboard by an hour.
 */

export const IST_TIME_ZONE = "Asia/Kolkata" as const;

export interface IstWindow {
  /** UTC instant of the start of the window. Use this in `$match` stages. */
  startUtc: Date;
  /** YYYY-MM-DD (IST) — for logging. */
  startYmd: string;
  /** YYYY-MM (IST) — for logging. */
  startYm: string;
}

/** Format `date` as a `YYYY-MM-DD` string in IST. */
function ymdInIst(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: IST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const y = parts.find((p) => p.type === "year")?.value ?? "0000";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  const d = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${y}-${m}-${d}`;
}

/** Format `date` as a `YYYY-MM` string in IST. */
function ymInIst(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: IST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(date);

  const y = parts.find((p) => p.type === "year")?.value ?? "0000";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  return `${y}-${m}`;
}

/**
 * Return the UTC instant at which the Asia/Kolkata wall clock reads the given
 * Y-M-D and H:M:S.
 *
 * We start from the UTC instant corresponding to that wall clock, then add the
 * IST offset that `Intl.DateTimeFormat` reports for that probe instant. This
 * is the canonical "fixed-offset" derivation: it does not depend on the
 * server's local TZ and it is robust against any future Asia/Kolkata offset
 * change because the offset is read from the runtime on every call.
 */
function istDateTimeToUtc(ymd: string, hms: string): Date {
  const y = Number(ymd.slice(0, 4));
  const mo = Number(ymd.slice(5, 7));
  const d = Number(ymd.slice(8, 10));
  const h = Number(hms.slice(0, 2));
  const mi = Number(hms.slice(3, 5));
  const s = Number(hms.slice(6, 8));

  // Treat the wall clock as if it were UTC, then ask the runtime what that
  // probe instant actually reads in IST. The difference is the IST offset.
  const probe = new Date(Date.UTC(y, mo - 1, d, h, mi, s));
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: IST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(probe);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const istAsUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour") === 24 ? 0 : get("hour"),
    get("minute"),
    get("second")
  );
  const offsetMs = istAsUtc - probe.getTime();
  return new Date(probe.getTime() - offsetMs);
}

/** Returns 00:00:00 IST of the date `now` falls in, as a real UTC `Date`. */
export function istStartOfToday(now: Date = new Date()): IstWindow {
  const ymd = ymdInIst(now);
  return {
    startUtc: istDateTimeToUtc(ymd, "00:00:00"),
    startYmd: ymd,
    startYm: ymInIst(now),
  };
}

/** Returns 00:00:00 IST on the 1st of the month `now` falls in, as UTC. */
export function istStartOfMonth(now: Date = new Date()): IstWindow {
  const ym = ymInIst(now);
  const ymd = `${ym}-01`;
  return {
    startUtc: istDateTimeToUtc(ymd, "00:00:00"),
    startYmd: ymd,
    startYm: ym,
  };
}

/** Returns 00:00:00 IST on the 1st of the month BEFORE `now` falls in, as UTC. */
export function istStartOfPreviousMonth(now: Date = new Date()): IstWindow {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: IST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(now);
  const y = Number(parts.find((p) => p.type === "year")?.value ?? "0");
  const m = Number(parts.find((p) => p.type === "month")?.value ?? "1");

  const prevY = m === 1 ? y - 1 : y;
  const prevM = m === 1 ? 12 : m - 1;
  const ym = `${prevY}-${String(prevM).padStart(2, "0")}`;
  const ymd = `${ym}-01`;
  return {
    startUtc: istDateTimeToUtc(ymd, "00:00:00"),
    startYmd: ymd,
    startYm: ym,
  };
}
