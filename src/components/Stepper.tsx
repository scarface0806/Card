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
    <div className="w-full">
      <div className="flex justify-between items-center mb-8">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all flex-shrink-0 ${
                step.id < currentStep
                  ? 'bg-green-500 text-white'
                  : step.id === currentStep
                    ? 'bg-black text-white ring-4 ring-black/20'
                    : 'bg-gray-300 text-gray-600'
              }`}
            >
              {step.id < currentStep ? <Check className="w-6 h-6" /> : step.id}
            </motion.div>
            <div className="ml-3">
              <p className="text-sm font-semibold text-gray-900">{step.label}</p>
            </div>
            {index < steps.length - 1 && (
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.2 }}
                className={`h-1 flex-1 mx-2 origin-left ${
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
