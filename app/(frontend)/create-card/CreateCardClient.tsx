'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm, FormProvider, type FieldErrors } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Navbar from '@/layouts/Navbar';
import Footer from '@/layouts/Footer';
import Stepper from '@/components/Stepper';
import { logFetchError } from '@/lib/fetch-utils';
import PersonalDetailsForm from '@/forms/PersonalDetailsForm';
import BusinessDetailsForm from '@/forms/BusinessDetailsForm';
import SocialLinksForm from '@/forms/SocialLinksForm';
import UploadForm from '@/forms/UploadForm';
import PaymentForm from '@/forms/PaymentForm';
import { motion } from 'framer-motion';
import { createOrder } from '@/services/api';
import { FORM_STEPS, ROUTES } from '@/utils/constants';
import type { SelectedProduct } from '@/lib/products/selection';
import { useRazorpayPayment } from '@/hooks/useRazorpayPayment';
import dynamic from 'next/dynamic';
import { ArrowLeft, ArrowRight, AlertTriangle } from 'lucide-react';
import {
  createCardFormSchema,
  getStepFieldNames,
  type CreateCardFormValues,
} from '@/lib/validations/createCardFormSchema';
import { descriptionLines } from '@/lib/products/presentation';

const CardLivePreview = dynamic(() => import('@/components/CardLivePreview'), {
  loading: () => (
    <div className="w-full rounded-xl pt-[63%] bg-[rgba(241,243,241,0.05)] animate-pulse" />
  ),
});

type FormData = CreateCardFormValues;

/** Which step renders each schema section, in step order. */
const SECTION_STEPS: ReadonlyArray<[keyof FormData, number]> = [
  ['personalDetails', 1],
  ['businessDetails', 2],
  ['socialLinks', 3],
  ['uploads', 4],
  ['payment', 5],
];

export default function CreateCardClient({
  product,
}: {
  /**
   * Resolved on the server from ?productId= by reading the product row, so the
   * first paint is correct and the price shown is the price in the database.
   *
   * This is display data only. The amount actually charged is recomputed
   * server-side from `product.id` in POST /api/orders - see placeOrder below.
   */
  product: SelectedProduct;
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const router = useRouter();
  const { initiatePayment, isLoading: isPaymentLoading, status: paymentStatus } = useRazorpayPayment();

  const methods = useForm({
    mode: 'onBlur',
    reValidateMode: 'onChange',
    resolver: zodResolver(createCardFormSchema),
    defaultValues: {
      personalDetails: {
        name: '',
        designation: '',
        company: '',
        mobile: '',
        email: '',
      },
      businessDetails: {
        address: '',
        website: '',
        about: '',
        googleLocation: '',
      },
      socialLinks: {
        instagram: '',
        facebook: '',
        linkedin: '',
        youtube: '',
      },
      uploads: {
        profileImage: null,
        logo: null,
      },
      payment: {
        method: 'card',
        terms: false,
      },
    },
  });

  const { handleSubmit } = methods;

  // One flag for every "do not let them click again" state - form submit,
  // order creation, the Checkout modal being open, and verification.
  const isBusy = isSubmitting || isPaymentLoading;
  const busyLabel =
    paymentStatus === 'awaiting_payment'
      ? 'Waiting for payment...'
      : paymentStatus === 'verifying'
        ? 'Confirming payment...'
        : 'Placing order...';

  // The name/designation/company watchers that used to live here fed the
  // typed-details overlay on the card preview. That overlay is gone, so the
  // subscriptions went with it - the checkout page no longer re-renders on
  // every keystroke. The FIELDS THEMSELVES ARE UNCHANGED: still registered,
  // still validated, still submitted.

  /**
   * Advance one step, validating only the fields that step actually renders.
   *
   * Deliberately NOT routed through handleSubmit. handleSubmit runs the whole
   * zod schema, so on step 1 it failed on step 2 and step 5 fields the customer
   * had not been shown yet: onSubmit never fired, Continue did nothing at all,
   * and the errors landed on inputs that were not on screen.
   */
  const goToNextStep = async () => {
    const stepFields = getStepFieldNames(currentStep);
    const isCurrentStepValid = stepFields.length === 0 || (await methods.trigger(stepFields));

    if (!isCurrentStepValid) {
      return;
    }

    setCurrentStep((step) => Math.min(step + 1, 5));
  };

  const placeOrder = async (data: FormData) => {
    setIsSubmitting(true);
    setPaymentError(null);

    try {
      const uploads = {
        profileImage: data.uploads?.profileImage?.[0],
        logo: data.uploads?.logo?.[0],
      };

      // Step 1: Create the order in the database. It lands as PENDING/unpaid -
      // this call is NOT a payment and must never redirect to the success page.
      //
      // Only the product ID is sent. No price and no product name leave the
      // browser: the server reads the product row and computes the total from
      // it, so a tampered request cannot buy a 999 rupee card for 1 rupee.
      const result = await createOrder({
        productId: product.id,
        personalDetails: data.personalDetails,
        businessDetails: data.businessDetails,
        socialLinks: data.socialLinks,
        uploads,
        payment: data.payment,
      });

      if (!result.success || !result.orderId) {
        throw new Error('Failed to create order');
      }

      const orderId = result.orderId;

      // Step 2: Open Razorpay Checkout. This resolves only once the modal has
      // closed - via the handler (paid), ondismiss (cancelled), or payment.failed.
      // No amount is sent: the server reads the price from the order row.
      const paymentResponse = await initiatePayment({
        existingOrderId: orderId,
        userEmail: data.personalDetails.email,
        userName: data.personalDetails.name,
        userPhone: data.personalDetails.mobile,
        paymentMethod: data.payment?.method,
      });

      // Step 3: Navigate only when /api/payment/verify confirmed the signature
      // server-side. A cancelled or failed payment leaves the order PENDING.
      if (paymentResponse.success) {
        localStorage.setItem('lastOrderId', orderId);
        router.push(`${ROUTES.ORDER_SUCCESS}?orderId=${orderId}`);
        return;
      }

      setPaymentError(
        paymentResponse.message || 'Payment could not be completed. Please try again.'
      );
    } catch (error) {
      logFetchError('Order creation failed:', error);
      setPaymentError(
        error instanceof Error ? error.message : 'Failed to create order. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Pressing Enter inside a field submits the form too, so the same dispatch
   * lives here rather than only on the button: steps 1-4 advance, step 5 pays.
   */
  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (currentStep < 5) {
      void goToNextStep();
      return;
    }

    void handleSubmit(placeOrder, onInvalid)();
  };

  /**
   * Safety net for step 5. Every required field is gated on its own step, so
   * this should not fire - but if the full schema ever rejects something from
   * an earlier step, send the customer back to it instead of leaving the Pay
   * button looking broken with the error on a screen they cannot see.
   */
  const onInvalid = (errors: FieldErrors<FormData>) => {
    const firstBadStep = SECTION_STEPS.find(([section]) => section in errors)?.[1];

    if (firstBadStep && firstBadStep !== currentStep) {
      setCurrentStep(firstBadStep);
      setPaymentError(null);
    }
  };

  return (
    <>
      <Navbar />
      <main className="tv-hero min-h-screen pt-32 pb-24">
        <div className="site-container">
          {/* Page head. Editorial, matching /cards and /order-success rather
              than the old centred badge-pill stack. */}
          <motion.header
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, ease: [0.25, 0.1, 0.25, 1] }}
            className="mb-10 md:mb-14"
          >
            <span className="tv-eyebrow">Checkout</span>
            <h1 className="tv-h2 mt-4 tv-measure-display">Create your card</h1>
            <p className="tv-lead mt-4 tv-measure-lead">
              Five short steps. You are ordering the{' '}
              <span className="text-[#F1F3F1] font-semibold">{product.name}</span>{' '}
              card — {product.priceFormatted}, shipping included.
            </p>
          </motion.header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2">
              <div className="tv-panel tv-panel-pad hover:!transform-none hover:!shadow-none hover:!border-[rgba(241,243,241,0.10)]">
                <Stepper steps={FORM_STEPS} currentStep={currentStep} />

                <hr className="tv-rule my-8" />

                <form onSubmit={handleFormSubmit} className="space-y-8">
                  <FormProvider {...methods}>
                    {currentStep === 1 && <PersonalDetailsForm />}
                    {currentStep === 2 && <BusinessDetailsForm />}
                    {currentStep === 3 && <SocialLinksForm />}
                    {currentStep === 4 && <UploadForm />}
                    {currentStep === 5 && <PaymentForm product={product} />}
                  </FormProvider>

                  {paymentError && (
                    <div
                      role="alert"
                      className={`tv-notice ${
                        paymentStatus === 'cancelled' ? 'tv-notice-warn' : 'tv-notice-error'
                      }`}
                    >
                      <AlertTriangle className="tv-notice-icon w-4 h-4" aria-hidden="true" />
                      <div>
                        <span className="tv-notice-title">
                          {paymentStatus === 'cancelled'
                            ? 'Payment cancelled'
                            : paymentStatus === 'verification_failed'
                              ? 'We could not confirm your payment'
                              : 'Payment failed'}
                        </span>
                        <p>{paymentError}</p>
                        {paymentStatus === 'verification_failed' && (
                          <p className="mt-2">
                            Please do not pay again. Email us and we will confirm your
                            order manually.
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col-reverse sm:flex-row gap-3 pt-6 border-t border-[rgba(241,243,241,0.10)]">
                    {currentStep > 1 && (
                      <button
                        type="button"
                        onClick={() => setCurrentStep(currentStep - 1)}
                        className="tv-btn tv-btn-secondary tv-btn-block"
                      >
                        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                        Back
                      </button>
                    )}
                    <button
                      type={currentStep === 5 ? 'submit' : 'button'}
                      onClick={currentStep === 5 ? undefined : () => void goToNextStep()}
                      disabled={isBusy}
                      className="tv-btn tv-btn-primary tv-btn-block sm:flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isBusy ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          {busyLabel}
                        </>
                      ) : (
                        <>
                          {currentStep === 5
                            ? `Pay ${product.priceFormatted} and place order`
                            : 'Continue'}
                          <ArrowRight className="w-4 h-4" aria-hidden="true" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Order rail. Sticky on desktop; on mobile the summary in step 5
                carries the same numbers, so this is not repeated there. */}
            <aside className="hidden lg:block">
              <div className="tv-panel tv-panel-pad sticky top-28 hover:!transform-none hover:!shadow-none hover:!border-[rgba(241,243,241,0.10)]">
                <div className="flex items-baseline justify-between gap-3 mb-4">
                  <h2 className="tv-mono">Your card</h2>
                  <span
                    className={`tv-tag ${
                      product.tier === 'premium' ? 'tv-tag-brass' : 'tv-tag-patina'
                    }`}
                  >
                    {product.tierLabel}
                  </span>
                </div>

                <CardLivePreview product={product} />

                <div className="mt-5 flex items-baseline justify-between gap-3">
                  <p className="tv-h4">{product.name}</p>
                  <p className="tv-summary-total-val !text-2xl">
                    {product.priceFormatted}
                  </p>
                </div>

                {product.listPriceFormatted && (
                  <p className="tv-small mt-1 text-right line-through">
                    {product.listPriceFormatted}
                  </p>
                )}

                {/* A description written as a list of features keeps its
                    newlines in the database, and a single <p> collapsed every
                    one of them into a space - which is why four features
                    arrived as one run-together sentence. Split at the render
                    layer only; the stored value is untouched. A genuine
                    one-sentence description still renders as a paragraph. */}
                {descriptionLines(product.description).length > 1 ? (
                  <ul className="tv-spec mt-3">
                    {descriptionLines(product.description).map((line) => (
                      <li key={line} className="tv-spec-row">
                        {line}
                      </li>
                    ))}
                  </ul>
                ) : product.description ? (
                  <p className="tv-small mt-3">{product.description}</p>
                ) : null}

                <hr className="tv-rule my-5" />

                <ul className="tv-spec">
                  {product.features.map((feature) => (
                    <li key={feature} className="tv-spec-row">
                      {feature}
                    </li>
                  ))}
                </ul>

                <p className="tv-mono mt-5">Preview updates as you type</p>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
