'use client';

import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
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
import { CardTemplate } from '@/utils/cardTemplates';
import { useRazorpayPayment } from '@/hooks/useRazorpayPayment';
import dynamic from 'next/dynamic';
import { ArrowLeft, ArrowRight, AlertTriangle } from 'lucide-react';

const CardLivePreview = dynamic(() => import('@/components/CardLivePreview'), {
  loading: () => (
    <div className="w-full rounded-xl pt-[63%] bg-[rgba(241,243,241,0.05)] animate-pulse" />
  ),
});

const CARD_FACTS = [
  'Free digital profile, hosted forever',
  'NFC chip encoded and ready to tap',
  'QR code for phones without NFC',
  'Edit your details any time',
];

interface FormData {
  personalDetails: {
    name: string;
    designation: string;
    company: string;
    mobile: string;
    email: string;
  };
  businessDetails: {
    address: string;
    website: string;
    about: string;
    services: string;
    googleLocation?: string;
  };
  socialLinks: {
    instagram?: string;
    facebook?: string;
    linkedin?: string;
    youtube?: string;
  };
  uploads: {
    profileImage?: FileList;
    logo?: FileList;
  };
  payment: {
    method: string;
    terms: boolean;
  };
}

export default function CreateCardClient({
  template,
}: {
  /** Resolved on the server from ?template= so the first paint is correct. */
  template: CardTemplate;
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  // Server already resolved the template, so this renders correctly on first
  // paint instead of flashing the default and swapping in an effect.
  const selectedTemplate = template;
  const router = useRouter();
  const { initiatePayment, isLoading: isPaymentLoading, status: paymentStatus } = useRazorpayPayment();

  const methods = useForm<FormData>({
    mode: 'onBlur',
    reValidateMode: 'onChange',
    // Razorpay Checkout handles card / UPI / wallet / net banking itself,
    // so there is no method for the customer to choose.
    defaultValues: { payment: { method: 'card' } },
  });

  const { handleSubmit, watch } = methods;

  // One flag for every "do not let them click again" state - form submit,
  // order creation, the Checkout modal being open, and verification.
  const isBusy = isSubmitting || isPaymentLoading;
  const busyLabel =
    paymentStatus === 'awaiting_payment'
      ? 'Waiting for payment...'
      : paymentStatus === 'verifying'
        ? 'Confirming payment...'
        : 'Placing order...';

  // Watch specific fields for live preview - real-time updates
  const fullName = watch('personalDetails.name', '');
  const designation = watch('personalDetails.designation', '');
  const company = watch('personalDetails.company', '');

  const onSubmit = async (data: FormData) => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
      return;
    }

    setIsSubmitting(true);
    setPaymentError(null);

    try {
      const uploads = {
        profileImage: data.uploads?.profileImage?.[0],
        logo: data.uploads?.logo?.[0],
      };

      // Step 1: Create the order in the database. It lands as PENDING/unpaid -
      // this call is NOT a payment and must never redirect to the success page.
      const result = await createOrder({
        personalDetails: data.personalDetails,
        businessDetails: data.businessDetails,
        socialLinks: data.socialLinks,
        uploads,
        template: selectedTemplate.slug,
        templateName: selectedTemplate.name,
        templatePrice: selectedTemplate.priceValue,
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
              <span className="text-[#F1F3F1] font-semibold">{selectedTemplate.name}</span>{' '}
              card — {selectedTemplate.price}, shipping included.
            </p>
          </motion.header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2">
              <div className="tv-panel tv-panel-pad hover:!transform-none hover:!shadow-none hover:!border-[rgba(241,243,241,0.10)]">
                <Stepper steps={FORM_STEPS} currentStep={currentStep} />

                <hr className="tv-rule my-8" />

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                  <FormProvider {...methods}>
                    {currentStep === 1 && <PersonalDetailsForm />}
                    {currentStep === 2 && <BusinessDetailsForm />}
                    {currentStep === 3 && <SocialLinksForm />}
                    {currentStep === 4 && <UploadForm />}
                    {currentStep === 5 && <PaymentForm template={selectedTemplate} />}
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
                      type="submit"
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
                            ? `Pay ${selectedTemplate.price} and place order`
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
                      selectedTemplate.type === 'premium' ? 'tv-tag-brass' : 'tv-tag-patina'
                    }`}
                  >
                    {selectedTemplate.type}
                  </span>
                </div>

                <CardLivePreview
                  fullName={fullName}
                  designation={designation}
                  company={company}
                  template={selectedTemplate}
                />

                <div className="mt-5 flex items-baseline justify-between gap-3">
                  <p className="tv-h4">{selectedTemplate.name}</p>
                  <p className="tv-summary-total-val !text-2xl">{selectedTemplate.price}</p>
                </div>

                <hr className="tv-rule my-5" />

                <ul className="tv-spec">
                  {CARD_FACTS.map((fact) => (
                    <li key={fact} className="tv-spec-row">
                      {fact}
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
