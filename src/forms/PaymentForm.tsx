'use client';

import { useFormContext } from 'react-hook-form';
import { CreditCard, ShieldCheck } from 'lucide-react';
import type { SelectedProduct } from '@/lib/products/selection';
import { formatPrice } from '@/utils/formatPrice';

interface PaymentFormProps {
  /**
   * The product being bought, resolved server-side from its database row.
   *
   * Required, and with no default. This used to be optional with a
   * `template?.priceValue || 599` fallback, which meant a product that failed
   * to resolve silently showed 599 on the review step - and 599 was then the
   * amount sent onward. The page cannot render without a real product now, so
   * there is nothing left to fall back to.
   */
  product: SelectedProduct;
}

export default function PaymentForm({ product }: PaymentFormProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  // Shipping is free, so the total is the product price. Both are formatted
  // through the one shared helper, so the rupee sign and grouping match the
  // catalogue, the order rail and the confirmation email.
  const shippingFee = 0;
  const total = product.price + shippingFee;

  const termsError =
    errors.payment && 'terms' in errors.payment
      ? (errors.payment.terms?.message as string)
      : '';

  return (
    <div className="space-y-8">
      <header>
        <span className="tv-eyebrow">Step 05</span>
        <h2 className="tv-h3 mt-3">Review and pay</h2>
        <p className="tv-small mt-2 tv-measure-body">
          One payment, nothing recurring. Your digital profile stays live for free.
        </p>
      </header>

      <hr className="tv-rule" />

      {/* Order summary — a spec sheet rather than another nested card. */}
      <section aria-labelledby="order-summary-heading">
        <h3 id="order-summary-heading" className="tv-mono mb-3">
          Order summary
        </h3>

        <div className="tv-summary">
          <div className="tv-summary-row">
            <span className="tv-summary-key">{product.name}</span>
            <span className="tv-summary-val">
              {product.priceFormatted}
              {product.listPriceFormatted && (
                <span className="ml-2 line-through opacity-60">
                  {product.listPriceFormatted}
                </span>
              )}
            </span>
          </div>
          <div className="tv-summary-row">
            <span className="tv-summary-key">Card type</span>
            <span
              className={`tv-tag ${
                product.tier === 'premium' ? 'tv-tag-brass' : 'tv-tag-patina'
              }`}
            >
              {product.tierLabel}
            </span>
          </div>
          <div className="tv-summary-row">
            <span className="tv-summary-key">Lifetime digital profile</span>
            <span className="tv-summary-val tv-summary-val-patina">Included</span>
          </div>
          <div className="tv-summary-row">
            <span className="tv-summary-key">Shipping &amp; handling</span>
            <span className="tv-summary-val tv-summary-val-patina">Free</span>
          </div>
        </div>

        <div className="tv-summary-total">
          <span className="tv-summary-total-key">Total payable</span>
          <span className="tv-summary-total-val">{formatPrice(total)}</span>
        </div>

        <p className="tv-small mt-3">One-time payment · No hidden charges · No renewals</p>
      </section>

      {/* Payment method — Razorpay Checkout covers every method natively,
          so there is nothing for the customer to pick here. */}
      <section aria-labelledby="payment-method-heading">
        <h3 id="payment-method-heading" className="tv-mono mb-3">
          Payment method
        </h3>

        <input type="hidden" value="card" {...register('payment.method')} />

        <div className="tv-notice tv-notice-patina">
          <CreditCard className="tv-notice-icon w-4 h-4" aria-hidden="true" />
          <p>
            <span className="tv-notice-title">Secure checkout via Razorpay</span>
            Cards, UPI, Google Pay, wallets and net banking are all available in the
            payment window.
          </p>
        </div>
      </section>

      {/* Terms agreement */}
      <div>
        <label className="tv-check">
          <input
            type="checkbox"
            className="tv-check-box tv-focus"
            aria-invalid={termsError ? true : undefined}
            aria-describedby={termsError ? 'payment-terms-error' : undefined}
            {...register('payment.terms', {
              required: 'You must accept the Terms & Conditions to continue',
            })}
          />
          <span className="tv-small">
            I agree to the{' '}
            <a href="/terms-conditions" className="tv-btn-tertiary !min-h-0 !text-sm">
              Terms &amp; Conditions
            </a>{' '}
            and{' '}
            <a href="/privacy-policy" className="tv-btn-tertiary !min-h-0 !text-sm">
              Privacy Policy
            </a>
          </span>
        </label>
        {termsError && (
          <p id="payment-terms-error" role="alert" className="tv-form-error mt-2">
            {termsError}
          </p>
        )}
      </div>

      <div className="tv-notice">
        <ShieldCheck className="tv-notice-icon w-4 h-4" aria-hidden="true" />
        <p>
          Your card details are entered on Razorpay&apos;s own window and are never sent
          to or stored by Tapvyo.
        </p>
      </div>
    </div>
  );
}
