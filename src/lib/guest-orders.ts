/**
 * GUEST ORDER BACKFILL.
 *
 * SERVER-ONLY. Shared by the two paths that can create an account:
 * app/api/auth/register (email + password) and
 * app/api/auth/google-complete (Google sign-in). Both must behave identically
 * here, which is why this is one module rather than a copy in each.
 *
 * A customer very commonly checks out as a guest and signs up afterwards, and
 * without this their /my-orders page would be empty even though they have
 * bought a card.
 *
 * MATCHED ON EMAIL, AND ONLY EMAIL. `recipientEmail` and `guestEmail` are the
 * addresses typed into the checkout form. Phone is deliberately NOT a match
 * key: people share a phone number far more often than an email address, and a
 * wrong match here would hand one customer another customer's order details -
 * including their delivery address.
 *
 * `userId: null` is part of the filter, so an order already claimed by another
 * account is never reassigned.
 */

import { ObjectId } from "mongodb";

import prisma from "@/lib/prisma";
import { getMongoDb } from "@/lib/mongodb";
import { isReplicaSetRequiredError } from "@/lib/replica-set";

/**
 * Attach unclaimed guest orders matching `email` to `userId`.
 *
 * Never throws: a failed backfill must not fail the signup that triggered it.
 * The account exists either way and support can attach orders by hand.
 * Returns how many orders were attached.
 */
export async function attachGuestOrders(
  userId: string,
  email: string
): Promise<number> {
  let count = 0;

  try {
    const result = await prisma.order.updateMany({
      where: {
        userId: null,
        OR: [
          { recipientEmail: { equals: email, mode: "insensitive" } },
          { guestEmail: { equals: email, mode: "insensitive" } },
        ],
      },
      data: { userId },
    });
    count = result.count;
  } catch (error) {
    if (!isReplicaSetRequiredError(error)) {
      console.error(
        "[GuestOrders] Failed to attach guest orders:",
        error instanceof Error ? error.message : String(error)
      );
      return 0;
    }

    // Single-node MongoDB: Order has relations, so Prisma wraps even an
    // updateMany in a transaction. Fall back to the raw driver.
    try {
      const db = await getMongoDb();

      // The email goes into a regex, so every regex metacharacter has to be
      // escaped first. A perfectly ordinary address like "a.b+tag@x.com"
      // contains `.` and `+`, which would otherwise match far more than the
      // one address intended - `+` alone would make this a syntax error or a
      // silent mismatch.
      const escaped = email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const caseInsensitive = { $regex: `^${escaped}$`, $options: "i" };

      const result = await db.collection("orders").updateMany(
        {
          $and: [
            { $or: [{ userId: null }, { userId: { $exists: false } }] },
            {
              $or: [
                { recipientEmail: caseInsensitive },
                { guestEmail: caseInsensitive },
              ],
            },
          ],
        },
        { $set: { userId: new ObjectId(userId), updatedAt: new Date() } }
      );

      count = result.modifiedCount;
    } catch (fallbackError) {
      console.error(
        "[GuestOrders] Failed to attach guest orders (raw driver):",
        fallbackError instanceof Error
          ? fallbackError.message
          : String(fallbackError)
      );
      return 0;
    }
  }

  if (count > 0) {
    console.info(
      `[GuestOrders] Attached ${count} guest order(s) to account ${email}`
    );
  }

  return count;
}
