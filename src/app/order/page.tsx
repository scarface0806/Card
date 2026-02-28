'use client';

import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Navbar from '@/layouts/Navbar';
import Footer from '@/layouts/Footer';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Stepper from '@/components/Stepper';
import PersonalDetailsForm from '@/forms/PersonalDetailsForm';
import BusinessDetailsForm from '@/forms/BusinessDetailsForm';
import SocialLinksForm from '@/forms/SocialLinksForm';
import UploadForm from '@/forms/UploadForm';
import PaymentForm from '@/forms/PaymentForm';
import { motion } from 'framer-motion';
import { createOrder } from '@/services/api';
import { FORM_STEPS, ROUTES } from '@/utils/constants';

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
  const router = useRouter();
  const methods = useForm<FormData>({
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  const { handleSubmit } = methods;

  const onSubmit = async (data: FormData) => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
      return;
    }

    // Final submission
    setIsSubmitting(true);
    try {
      // Convert FileList to File objects
      const uploads = {
        profileImage: data.uploads?.profileImage?.[0],
        logo: data.uploads?.logo?.[0],
        coverImage: data.uploads?.coverImage?.[0],
      };

      const result = await createOrder({
        personalDetails: data.personalDetails,
        businessDetails: data.businessDetails,
        socialLinks: data.socialLinks,
        uploads,
      });

      if (result.success) {
        // Store order ID in session/localStorage
        localStorage.setItem('lastOrderId', result.orderId);
        router.push(`${ROUTES.ORDER_SUCCESS}?orderId=${result.orderId}`);
      }
    } catch (error) {
      console.error('Order creation failed:', error);
      alert('Failed to create order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="pt-32 pb-20 min-h-screen bg-gray-50">
        <div className="container mx-auto max-w-6xl px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-black mb-4">
              Create Your Digital Card
            </h1>
            <p className="text-lg text-gray-600">
              Complete the form below to customize your professional card
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form Section */}
            <div className="lg:col-span-2">
              <Card>
                <div className="p-8">
                  {/* Stepper */}
                  <Stepper steps={FORM_STEPS} currentStep={currentStep} />

                  {/* Form */}
                  <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="mt-12 space-y-8"
                  >
                    <FormProvider {...methods}>
                      {currentStep === 1 && <PersonalDetailsForm />}
                      {currentStep === 2 && <BusinessDetailsForm />}
                      {currentStep === 3 && <SocialLinksForm />}
                      {currentStep === 4 && <UploadForm />}
                      {currentStep === 5 && <PaymentForm />}
                    </FormProvider>

                    {/* Navigation Buttons */}
                    <div className="flex gap-4 pt-8 border-t border-gray-200">
                      {currentStep > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="md"
                          onClick={() => setCurrentStep(currentStep - 1)}
                        >
                          Previous
                        </Button>
                      )}
                      <Button
                        type="submit"
                        variant="secondary"
                        size="md"
                        className="flex-1"
                        loading={isSubmitting}
                      >
                        {currentStep === 5
                          ? 'Place Order'
                          : 'Next'}
                      </Button>
                    </div>
                  </form>
                </div>
              </Card>
            </div>

            {/* Live Preview Section (Desktop Only) */}
            <div className="hidden lg:block">
              <Card>
                <div className="p-8 sticky top-32">
                  <h3 className="text-xl font-bold text-black mb-6">Preview</h3>
                  <div className="bg-gradient-to-br from-gray-300 to-gray-400 rounded-lg pt-[150%] flex items-center justify-center text-gray-600">
                    <span className="text-center">Your card preview</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-4 text-center">
                    Updates in real-time as you fill the form
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
