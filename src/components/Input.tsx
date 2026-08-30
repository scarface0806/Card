'use client';

import { InputHTMLAttributes, forwardRef, useId } from 'react';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'required'> {
  label?: string;
  error?: string;
  /** Draws the brass asterisk and sets aria-required. Deliberately does NOT set
   *  the native `required` attribute: react-hook-form owns validation here, and
   *  the browser's own bubble would fire first and contradict it. */
  required?: boolean;
  /** Optional helper line under the field. */
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, required, hint, className = '', id, ...props }, ref) => {
    // The label used to be a bare <label> with no htmlFor, so clicking it did
    // not focus the field and screen readers announced an unlabelled input.
    const generatedId = useId();
    const inputId = id ?? `input-${generatedId}`;
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;

    const describedBy = [error ? errorId : null, hint ? hintId : null]
      .filter(Boolean)
      .join(' ');

    return (
      <div className="tv-field !mb-0">
        {label && (
          <label htmlFor={inputId} className="tv-label">
            {label}
            {required && (
              <span className="tv-label-req" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-required={required || undefined}
          aria-describedby={describedBy || undefined}
          className={`tv-input ${error ? '!border-[#FF8A80]' : ''} ${className}`}
          {...props}
        />
        {hint && !error && (
          <p id={hintId} className="tv-small mt-1.5">
            {hint}
          </p>
        )}
        {error && (
          // role="alert" so the message is announced when it appears, not only
          // when the field is next focused.
          <p id={errorId} role="alert" className="tv-form-error mt-1.5">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
