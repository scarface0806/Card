import { PrismaClient } from "@prisma/client";
import { invalidateDashboardCache } from "@/lib/dashboard-cache";

/** Operations that change data the dashboard summary aggregates. */
const WRITE_OPERATIONS = new Set([
  "create",
  "createMany",
  "update",
  "updateMany",
  "upsert",
  "delete",
  "deleteMany",
]);

/**
 * Invalidate the cached dashboard summary whenever a model it aggregates is
 * written. Done here rather than at each call site so a new write path cannot
 * silently leave the dashboard showing stale numbers.
 */
function withDashboardInvalidation(client: PrismaClient) {
  const onWrite = {
    async $allOperations({
      operation,
      args,
      query,
    }: {
      operation: string;
      args: unknown;
      query: (args: unknown) => Promise<unknown>;
    }) {
      const result = await query(args);
      if (WRITE_OPERATIONS.has(operation)) {
        invalidateDashboardCache();
      }
      return result;
    },
  };

  return client.$extends({
    query: {
      order: onWrite,
      customer: onWrite,
      mainWebsiteLead: onWrite,
    },
  });
}

type ExtendedPrismaClient = ReturnType<typeof withDashboardInvalidation>;

const globalForPrisma = global as unknown as { prisma: ExtendedPrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  withDashboardInvalidation(new PrismaClient());

// Cache the Prisma instance in global scope for all environments
// This prevents connection exhaustion on serverless (Vercel)
globalForPrisma.prisma = prisma;

export default prisma;
