'use client';

import { TextareaHTMLAttributes, forwardRef, useId } from 'react';

interface TextAreaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'required'> {
  label?: string;
  error?: string;
  /** Visual marker + aria only - see the note in Input.tsx. */
  required?: boolean;
  hint?: string;
}

const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, required, hint, className = '', id, ...props }, ref) => {
    // Same fix as Input: the label was never associated with the control.
    const generatedId = useId();
    const textareaId = id ?? `textarea-${generatedId}`;
    const errorId = `${textareaId}-error`;
    const hintId = `${textareaId}-hint`;

    const describedBy = [error ? errorId : null, hint ? hintId : null]
      .filter(Boolean)
      .join(' ');

    return (
      <div className="tv-field !mb-0">
        {label && (
          <label htmlFor={textareaId} className="tv-label">
            {label}
            {required && (
              <span className="tv-label-req" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          aria-invalid={error ? true : undefined}
          aria-required={required || undefined}
          aria-describedby={describedBy || undefined}
          className={`tv-textarea ${error ? '!border-[#FF8A80]' : ''} ${className}`}
          {...props}
        />
        {hint && !error && (
          <p id={hintId} className="tv-small mt-1.5">
            {hint}
          </p>
        )}
        {error && (
          <p id={errorId} role="alert" className="tv-form-error mt-1.5">
            {error}
          </p>
        )}
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';

export default TextArea;
