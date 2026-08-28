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
import { ArrowLeft, ArrowRight, CreditCard, Sparkles } from 'lucide-react';
import { useRazorpayPayment } from '@/hooks/useRazorpayPayment';

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
    coverImage?: FileList;
  };
  payment: {
    method: string;
    terms: boolean;
  };
}

export default function OrderPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const router = useRouter();
  const { initiatePayment, isLoading: isPaymentLoading, status: paymentStatus } = useRazorpayPayment();
  const methods = useForm<FormData>({
    mode: 'onBlur',
    reValidateMode: 'onChange',
    // Razorpay Checkout handles card / UPI / wallet / net banking itself,
    // so there is no method for the customer to choose.
    defaultValues: { payment: { method: 'card' } },
  });

  const { handleSubmit, watch, formState: { errors } } = methods;
  const selectedPaymentMethod = watch('payment.method');
  const agreedToTerms = watch('payment.terms');

  // One flag for every "do not let them click again" state - form submit,
  // order creation, the Checkout modal being open, and verification.
  const isBusy = isSubmitting || isPaymentLoading;
  const busyLabel =
    paymentStatus === 'awaiting_payment'
      ? 'Waiting for payment...'
      : paymentStatus === 'verifying'
        ? 'Confirming payment...'
        : null;

  const onSubmit = async (data: FormData) => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
      return;
    }

    // Step 5: Final submission with Razorpay payment
    setIsSubmitting(true);
    setPaymentError(null);

    try {
      // Validate payment form
      if (!selectedPaymentMethod) {
        setPaymentError('Please select a payment method');
        setIsSubmitting(false);
        return;
      }

      if (!agreedToTerms) {
        setPaymentError('Please accept terms & conditions');
        setIsSubmitting(false);
        return;
      }

      const uploads = {
        profileImage: data.uploads?.profileImage?.[0],
        logo: data.uploads?.logo?.[0],
        coverImage: data.uploads?.coverImage?.[0],
      };

      // Step 1: Create order in database
      console.log('[Order] Creating order in database...');
      const result = await createOrder({
        personalDetails: data.personalDetails,
        businessDetails: data.businessDetails,
        socialLinks: data.socialLinks,
        uploads,
        payment: data.payment,
      });

      if (!result.success || !result.orderId) {
        throw new Error('Failed to create order');
      }

      console.log('[Order] Order created for:', result.orderId);
      const orderId = result.orderId;

      // Step 2: Initiate Razorpay payment. No amount is sent - the server reads
      // the price from the order row, so it cannot be tampered with here.
      const paymentResponse = await initiatePayment({
        existingOrderId: orderId,
        userEmail: data.personalDetails.email,
        userName: data.personalDetails.name,
        userPhone: data.personalDetails.mobile,
        paymentMethod: selectedPaymentMethod,
      });

      // Navigate only when the server confirmed the signature.
      if (paymentResponse.success) {
        localStorage.setItem('lastOrderId', orderId);
        router.push(`${ROUTES.ORDER_SUCCESS}?orderId=${orderId}`);
        return;
      }

      setPaymentError(
        paymentResponse.message || 'Payment could not be completed. Please try again.'
      );
    } catch (error) {
      logFetchError('[Order] Error:', error);
      setPaymentError(
        error instanceof Error ? error.message : 'Failed to process order. Please try again.'
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
              Complete the form below to customize your professional card
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-primary/10 shadow-md p-8">
                <Stepper steps={FORM_STEPS} currentStep={currentStep} />

                <form onSubmit={handleSubmit(onSubmit)} className="mt-12 space-y-8">
                  <FormProvider {...methods}>
                    {currentStep === 1 && <PersonalDetailsForm />}
                    {currentStep === 2 && <BusinessDetailsForm />}
                    {currentStep === 3 && <SocialLinksForm />}
                    {currentStep === 4 && <UploadForm />}
                    {currentStep === 5 && <PaymentForm />}
                  </FormProvider>

                  {paymentError && (
                    <div
                      role="alert"
                      className={`rounded-xl border px-4 py-3 text-sm ${
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
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={isBusy}
                        onClick={() => setCurrentStep(currentStep - 1)}
                        className="flex items-center gap-2 px-6 py-3 text-[#4b635d] bg-white border border-primary/20 hover:bg-primary/10 rounded-xl font-semibold transition-all duration-300"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Previous
                      </motion.button>
                    )}
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={isBusy}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-secondary text-[#0f2e25] hover:from-[#28A428] hover:to-[#e6e600] rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
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

            <div className="hidden lg:block">
              <div className="bg-white rounded-2xl border border-primary/10 shadow-md p-8 sticky top-32">
                <div className="flex items-center gap-2 mb-6">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h3 className="text-xl font-bold text-[#0f2e25] font-space-grotesk">Preview</h3>
                </div>
                <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl pt-[150%] relative flex items-center justify-center border border-primary/10">
                  <span className="absolute inset-0 flex items-center justify-center text-[#6b7f78]">Your card preview</span>
                </div>
                <p className="text-sm text-[#6b7f78] mt-4 text-center">
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

