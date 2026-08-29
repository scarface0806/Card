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
import { ArrowLeft, ArrowRight, CreditCard, Sparkles, Check } from 'lucide-react';

const CardLivePreview = dynamic(() => import('@/components/CardLivePreview'), {
  loading: () => <div className="w-full h-96 bg-gray-100 rounded-xl animate-pulse" />,
});

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
        : null;

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
      <main className="pt-32 pb-20 min-h-screen bg-gradient-to-br from-[#f4f7f6] via-[#e8f2ef] to-[#ffffff]">
        <div className="site-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full mb-6">
              <CreditCard className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Easy Checkout</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-[#0f2e25] font-space-grotesk mb-4">
              Create Your{' '}
              <span className="text-primary">
                Digital Card
              </span>
            </h1>
            <p className="text-lg text-[#4b635d]">
              Complete the form below to customize your <span className="font-semibold text-primary">{selectedTemplate.name}</span> card
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-primary/10 shadow-md p-4 sm:p-6 md:p-8">
                <Stepper steps={FORM_STEPS} currentStep={currentStep} />

                <form onSubmit={handleSubmit(onSubmit)} className="mt-12 space-y-8">
                  <FormProvider {...methods}>
                    {currentStep === 1 && <PersonalDetailsForm />}
                    {currentStep === 2 && <BusinessDetailsForm />}
                    {currentStep === 3 && <SocialLinksForm />}
                    {currentStep === 4 && <UploadForm />}
                    {currentStep === 5 && <PaymentForm template={selectedTemplate} />}
                  </FormProvider>

                  {paymentError && (
                    <div
                      className={`mt-6 rounded-xl border p-4 text-sm ${
                        paymentStatus === 'cancelled'
                          ? 'border-amber-300 bg-amber-50 text-amber-800'
                          : 'border-red-300 bg-red-50 text-red-800'
                      }`}
                    >
                      <p className="font-semibold">
                        {paymentStatus === 'cancelled'
                          ? 'Payment cancelled'
                          : paymentStatus === 'verification_failed'
                            ? 'We could not confirm your payment'
                            : 'Payment failed'}
                      </p>
                      <p className="mt-1">{paymentError}</p>
                      {paymentStatus === 'verification_failed' && (
                        <p className="mt-2">
                          Please do not pay again. Email us and we will confirm your order manually.
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex gap-4 pt-8 border-t border-primary/10">
                    {currentStep > 1 && (
                      <motion.button
                        type="button"
                        whileHover={{ y: -2 }}
                        whileTap={{ y: 1 }}
                        transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
                        onClick={() => setCurrentStep(currentStep - 1)}
                        className="flex items-center gap-2 px-6 py-3 text-[#4b635d] bg-white border border-primary/20 hover:bg-primary/10 rounded-xl font-semibold transition-all duration-220"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Previous
                      </motion.button>
                    )}
                    <motion.button
                      type="submit"
                      whileHover={{ y: -2 }}
                      whileTap={{ y: 1 }}
                      transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
                      disabled={isBusy}
                      className="btn btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isBusy ? (
                        <>
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          {busyLabel}
                        </>
                      ) : (
                        <>
                          {currentStep === 5 ? 'Place Order' : 'Next'}
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </motion.button>
                  </div>
                </form>
              </div>
            </div>

            {/* Preview Sidebar */}
            <div className="hidden lg:block">
              <div className="bg-white rounded-2xl border border-primary/10 shadow-md p-8 sticky top-32">
                <div className="flex items-center gap-2 mb-6">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-bold text-[#0f2e25] font-space-grotesk">Card Preview</h2>
                </div>
                
                {/* Selected Template Badge */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-[#6b7f78]">Selected Template</span>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    selectedTemplate.type === 'premium' 
                      ? 'bg-amber-100 text-amber-700' 
                      : 'bg-primary/20 text-primary'
                  }`}>
                    {selectedTemplate.type.charAt(0).toUpperCase() + selectedTemplate.type.slice(1)}
                  </span>
                </div>

                {/* Card Preview */}
                <CardLivePreview
                  fullName={fullName}
                  designation={designation}
                  company={company}
                  template={selectedTemplate}
                />

                <div className="mt-4 text-center">
                  <p className="text-lg font-bold text-[#0f2e25]">{selectedTemplate.name}</p>
                  <p className="text-2xl font-bold text-primary mt-1">{selectedTemplate.price}</p>
                </div>

                {/* Features */}
                <div className="mt-6 pt-6 border-t border-primary/10 space-y-3">
                  {['Free hosting forever', 'NFC card included', 'QR code access', 'Mobile responsive'].map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary" />
                      <span className="text-sm text-[#4b635d]">{feature}</span>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-[#6b7f78] mt-4 text-center">
                  Updates in real-time as you fill the form
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
