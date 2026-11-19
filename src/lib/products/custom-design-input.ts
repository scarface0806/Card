/**
 * Parses the "Customised design" fields of the admin product form.
 *
 * Shared by POST /api/products and PUT /api/products/[id], whose own input
 * parsers are separate copies - putting this in one place means the two write
 * paths cannot disagree about what a valid design fee is.
 *
 * A product that is not a custom design stores designFee as null, so a fee
 * typed in and then un-ticked is not left behind on the row. (designFeeFor
 * would ignore it anyway, but a stale number in the database invites someone
 * to trust it later.)
 */
export interface CustomDesignInput {
  isCustomDesign: boolean;
  designFee: number | null;
}

/** Upper bound on the fee - catches a typo like 10000 for 100. */
const MAX_DESIGN_FEE = 5000;

export function parseCustomDesignInput(input: Record<string, unknown>): CustomDesignInput {
  const isCustomDesign = input.isCustomDesign === true || input.isCustomDesign === 'true';

  if (!isCustomDesign) {
    return { isCustomDesign: false, designFee: null };
  }

  const fee = Number(input.designFee);
  if (!Number.isFinite(fee) || fee <= 0) {
    throw new Error('Design fee must be a number greater than 0 for a customised design');
  }
  if (fee > MAX_DESIGN_FEE) {
    throw new Error(`Design fee looks too high (over ₹${MAX_DESIGN_FEE}). Check the amount.`);
  }

  return { isCustomDesign: true, designFee: fee };
}
