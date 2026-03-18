'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface Step {
  id: number;
  label: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
}

export default function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <div className="w-full overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center min-w-0">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className={`w-9 h-9 md:w-12 md:h-12 rounded-full flex items-center justify-center font-bold text-sm md:text-lg transition-all shrink-0 ${
                  step.id < currentStep
                    ? 'bg-green-500 text-white'
                    : step.id === currentStep
                      ? 'bg-black text-white ring-4 ring-black/20'
                      : 'bg-gray-300 text-gray-600'
                }`}
              >
                {step.id < currentStep ? <Check className="w-4 h-4 md:w-6 md:h-6" /> : step.id}
              </motion.div>
              <p className="hidden sm:block text-xs md:text-sm font-semibold text-gray-900 mt-1.5 text-center leading-tight whitespace-nowrap">
                {step.label}
              </p>
            </div>
            {index < steps.length - 1 && (
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.2 }}
                className={`h-0.5 md:h-1 flex-1 mx-1.5 md:mx-3 origin-left shrink self-start mt-[18px] md:mt-6 ${
                  step.id < currentStep ? 'bg-green-500' : 'bg-gray-300'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

