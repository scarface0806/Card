import prisma from "@/lib/prisma";

/** How many trailing digits of the phone number make up a profile slug. */
export const SLUG_DIGIT_COUNT = 5;

/**
 * The memorable half of a profile URL: the last five digits of the customer's
 * own phone number, so `/card/61025` rather than `/card/tapvyonfc-889cff`.
 *
 * A customer can recite their profile address from memory, because the only
 * thing they have to remember is the tail of a number they already know.
 *
 * Returns "" when the phone holds fewer than five digits — the caller decides
 * what to fall back to rather than this silently inventing a short slug that
 * would collide with everything.
 */
export function buildCustomerSlug(phone: string | null | undefined): string {
  const digits = String(phone ?? "").replace(/\D+/g, "");
  return digits.length >= SLUG_DIGIT_COUNT ? digits.slice(-SLUG_DIGIT_COUNT) : "";
}

/** The old id-derived form, kept for customers whose phone has too few digits. */
export function fallbackCustomerSlug(customerId: string): string {
  return `tapvyonfc-${customerId.slice(-6).toLowerCase()}`;
}

/**
 * A free slug for a new customer.
 *
 * Two people can share the last five digits of their number, so a taken slug
 * gains a counter: `61025`, then `61025-1`, then `61025-2`. The first customer
 * on a number keeps the clean URL.
 *
 * `isTaken` is injected so the Prisma path and the raw-driver fallback path can
 * share one implementation instead of keeping two copies of this rule in step.
 */
export async function resolveCustomerSlug(
  phone: string | null | undefined,
  customerId: string,
  isTaken: (slug: string) => Promise<boolean>
): Promise<string> {
  const base = buildCustomerSlug(phone) || fallbackCustomerSlug(customerId);

  if (!(await isTaken(base))) return base;

  for (let suffix = 1; suffix < 1000; suffix += 1) {
    const candidate = `${base}-${suffix}`;
    if (!(await isTaken(candidate))) return candidate;
  }

  // 999 customers sharing five digits is not a real scenario; this only exists
  // so the function can never loop forever or return a duplicate.
  return `${base}-${customerId.slice(-6).toLowerCase()}`;
}

/** Prisma-backed slug resolution, used by the normal creation path. */
export async function generateUniqueCustomerSlug(
  phone: string | null | undefined,
  customerId: string
): Promise<string> {
  return resolveCustomerSlug(phone, customerId, async (slug) => {
    const existing = await prisma.customer.findUnique({
      where: { slug },
      select: { id: true },
    });
    // A customer never collides with itself — this matters when the helper is
    // re-run for an existing record.
    return Boolean(existing) && existing?.id !== customerId;
  });
}
