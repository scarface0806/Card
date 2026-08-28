/**
 * Payment amount helpers.
 *
 * Razorpay works exclusively in the smallest currency unit (paise for INR).
 * Every amount that crosses the wire to Razorpay must be a positive integer
 * number of paise — floats and strings are rejected by their API.
 *
 * Kept in its own module (no Prisma / no network) so it can be unit tested.
 */

/** Hard ceiling for a single order, in INR. Anything above this is a bug or an attack. */
export const MAX_ORDER_AMOUNT_INR = 500_000;

/** Floor for a single order, in INR. Razorpay rejects orders below ₹1. */
export const MIN_ORDER_AMOUNT_INR = 1;

export class InvalidAmountError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidAmountError";
  }
}

/**
 * Validate an INR amount and convert it to integer paise.
 *
 * ₹499     -> 49900
 * ₹499.5   -> 49950
 * ₹0.015   -> rejected (below the ₹1 floor)
 *
 * @throws InvalidAmountError when the amount is not a finite, in-range number.
 */
export function toPaise(amountInInr: unknown): number {
  if (typeof amountInInr !== "number" || !Number.isFinite(amountInInr)) {
    throw new InvalidAmountError("Amount must be a finite number");
  }

  if (amountInInr < MIN_ORDER_AMOUNT_INR) {
    throw new InvalidAmountError(
      `Amount must be at least ₹${MIN_ORDER_AMOUNT_INR}`
    );
  }

  if (amountInInr > MAX_ORDER_AMOUNT_INR) {
    throw new InvalidAmountError(
      `Amount exceeds the maximum of ₹${MAX_ORDER_AMOUNT_INR}`
    );
  }

  // Math.round guards against float artefacts (599.99 * 100 === 59998.99999...)
  const paise = Math.round(amountInInr * 100);

  if (!Number.isSafeInteger(paise) || paise <= 0) {
    throw new InvalidAmountError("Amount could not be converted to paise");
  }

  return paise;
}
