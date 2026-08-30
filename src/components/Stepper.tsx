'use client';

import { Check } from 'lucide-react';

interface Step {
  id: number;
  label: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
}

/**
 * Checkout progress rail.
 *
 * Rendered as an ordered list with `aria-current="step"` rather than a row of
 * divs, so a screen reader announces "step 2 of 5, Business Details" instead of
 * five unlabelled numbers. Below 640px the per-step labels are dropped by CSS
 * and the current one is named in full underneath the rail - five mono labels
 * side by side on a 360px screen truncate to two characters each.
 */
export default function Stepper({ steps, currentStep }: StepperProps) {
  const current = steps.find((s) => s.id === currentStep);

  return (
    <div className="w-full">
      <ol className="tv-stepper" aria-label="Order progress">
        {steps.map((step, index) => {
          const state =
            step.id < currentStep ? 'done' : step.id === currentStep ? 'current' : 'todo';

          return (
            <li
              key={step.id}
              className="tv-stepper-item"
              data-state={state}
              aria-current={state === 'current' ? 'step' : undefined}
            >
              <div className="tv-stepper-head">
                <span className="tv-stepper-marker">
                  {state === 'done' ? (
                    <Check className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    String(step.id).padStart(2, '0')
                  )}
                  <span className="sr-only">
                    {state === 'done' ? 'Completed: ' : ''}
                    {step.label}
                  </span>
                </span>
                {index < steps.length - 1 && (
                  <span className="tv-stepper-line" aria-hidden="true" />
                )}
              </div>
              <span className="tv-stepper-label" aria-hidden="true">
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>

      {/* Mobile-only restatement of where you are. aria-hidden because the list
          above already conveys this to assistive tech. */}
      <p className="tv-mono mt-4 sm:hidden" aria-hidden="true">
        Step {String(currentStep).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}
        {current ? ` — ${current.label}` : ''}
      </p>
    </div>
  );
}
