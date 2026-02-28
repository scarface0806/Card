'use client';

import { useState, useEffect, Suspense } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/layouts/Navbar';
import Footer from '@/layouts/Footer';
import Stepper from '@/components/Stepper';
import PersonalDetailsForm from '@/forms/PersonalDetailsForm';
import BusinessDetailsForm from '@/forms/BusinessDetailsForm';
import SocialLinksForm from '@/forms/SocialLinksForm';
import UploadForm from '@/forms/UploadForm';
import PaymentForm from '@/forms/PaymentForm';
import { motion } from 'framer-motion';
import { createOrder } from '@/services/api';
import { FORM_STEPS, ROUTES } from '@/utils/constants';
import { getTemplateBySlug, getDefaultTemplate, CardTemplate } from '@/utils/cardTemplates';
import CardLivePreview from '@/components/CardLivePreview';
import { ArrowLeft, ArrowRight, CreditCard, Sparkles, Check } from 'lucide-react';

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

function CreateCardContent() {
  const searchParams = useSearchParams();
  const templateSlug = searchParams.get('template');
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<CardTemplate>(getDefaultTemplate());
  const router = useRouter();
  
  const methods = useForm<FormData>({
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  const { handleSubmit, watch } = methods;
  
  // Watch specific fields for live preview - real-time updates
  const fullName = watch('personalDetails.name', '');
  const designation = watch('personalDetails.designation', '');
  const company = watch('personalDetails.company', '');

  // Load template from URL on mount
  useEffect(() => {
    if (templateSlug) {
      const template = getTemplateBySlug(templateSlug);
      if (template) {
        setSelectedTemplate(template);
      }
    }
  }, [templateSlug]);

  const onSubmit = async (data: FormData) => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
      return;
    }

    setIsSubmitting(true);
    try {
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
        template: selectedTemplate.slug,
      });

      if (result.success) {
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
      <main className="pt-32 pb-20 min-h-screen bg-gradient-to-br from-[#f4f7f6] via-[#e8f2ef] to-[#ffffff]">
        <div className="site-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 border border-teal-200 rounded-full mb-6">
              <CreditCard className="w-4 h-4 text-teal-600" />
              <span className="text-sm font-medium text-teal-700">Easy Checkout</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-[#0f2e25] font-space-grotesk mb-4">
              Create Your{' '}
              <span className="bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent">
                Digital Card
              </span>
            </h1>
            <p className="text-lg text-[#4b635d]">
              Complete the form below to customize your <span className="font-semibold text-teal-700">{selectedTemplate.name}</span> card
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-teal-100 shadow-md p-8">
                <Stepper steps={FORM_STEPS} currentStep={currentStep} />

                <form onSubmit={handleSubmit(onSubmit)} className="mt-12 space-y-8">
                  <FormProvider {...methods}>
                    {currentStep === 1 && <PersonalDetailsForm />}
                    {currentStep === 2 && <BusinessDetailsForm />}
                    {currentStep === 3 && <SocialLinksForm />}
                    {currentStep === 4 && <UploadForm />}
                    {currentStep === 5 && <PaymentForm template={selectedTemplate} />}
                  </FormProvider>

                  <div className="flex gap-4 pt-8 border-t border-teal-100">
                    {currentStep > 1 && (
                      <motion.button
                        type="button"
                        whileHover={{ y: -2 }}
                        whileTap={{ y: 1 }}
                        transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
                        onClick={() => setCurrentStep(currentStep - 1)}
                        className="flex items-center gap-2 px-6 py-3 text-[#4b635d] bg-white border border-teal-200 hover:bg-teal-50 rounded-xl font-semibold transition-all duration-220"
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
                      disabled={isSubmitting}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 text-white hover:bg-teal-700 rounded-xl font-semibold transition-all duration-220 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
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
              <div className="bg-white rounded-2xl border border-teal-100 shadow-md p-8 sticky top-32">
                <div className="flex items-center gap-2 mb-6">
                  <Sparkles className="w-5 h-5 text-teal-600" />
                  <h3 className="text-xl font-bold text-[#0f2e25] font-space-grotesk">Card Preview</h3>
                </div>
                
                {/* Selected Template Badge */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-[#6b7f78]">Selected Template</span>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    selectedTemplate.type === 'premium' 
                      ? 'bg-amber-100 text-amber-700' 
                      : 'bg-teal-100 text-teal-700'
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
                  <p className="text-2xl font-bold text-teal-600 mt-1">{selectedTemplate.price}</p>
                </div>

                {/* Features */}
                <div className="mt-6 pt-6 border-t border-teal-100 space-y-3">
                  {['Free hosting forever', 'NFC card included', 'QR code access', 'Mobile responsive'].map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-teal-600" />
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

export default function CreateCardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f4f7f6] via-[#e8f2ef] to-[#ffffff]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
      </div>
    }>
      <CreateCardContent />
    </Suspense>
  );
}
