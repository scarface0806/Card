/**
 * Prisma MongoDB replica-set detection.
 *
 * Prisma's MongoDB connector wraps a `create`, and an `update`/`updateMany` on
 * a model with relations, in a transaction. Transactions require a replica
 * set. Production runs on Atlas, which is one; a single-node local MongoDB
 * refuses with error code P2031.
 *
 * Every caller that writes through Prisma therefore needs a raw-driver
 * fallback for local development. The predicate lived inline in three files
 * before this one existed, which is one copy per author rather than one shared
 * definition - see also the original in app/api/orders/route.ts.
 */
export function isReplicaSetRequiredError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2031"
  );
}
