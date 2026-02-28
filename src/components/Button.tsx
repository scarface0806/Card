'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  form?: string;
  showIcon?: boolean;
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  showIcon = true,
  ...props
}: ButtonProps) {
  const baseStyles = 'font-semibold rounded-full transition-all duration-300 inline-flex items-center gap-3 whitespace-nowrap overflow-hidden group';

  const variants = {
    primary: 'bg-[#7808d0] text-white hover:bg-black',
    secondary: 'bg-[#0891b2] text-white hover:bg-black',
    outline: 'border-2 border-[#7808d0] text-[#7808d0] hover:bg-[#7808d0] hover:text-white',
  };

  const iconColors = {
    primary: 'text-[#7808d0] group-hover:text-black',
    secondary: 'text-[#0891b2] group-hover:text-black',
    outline: 'text-[#7808d0] group-hover:text-white',
  };

  const sizes = {
    sm: 'pl-4 pr-3 py-2 text-sm',
    md: 'pl-5 pr-4 py-3 text-base',
    lg: 'pl-6 pr-5 py-4 text-lg',
  };

  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-7 h-7',
  };

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading}
      {...props}
    >
      {loading && (
        <span
          className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
          aria-label="Loading"
        />
      )}
      {children}
      {showIcon && !loading && (
        <span className={`flex-shrink-0 ${iconSizes[size]} relative bg-white rounded-full grid place-items-center overflow-hidden ${iconColors[variant]}`}>
          <svg
            width="10"
            className="transition-transform duration-300 ease-in-out group-hover:translate-x-[150%] group-hover:translate-y-[100%]"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 14 15"
          >
            <path
              fill="currentColor"
              d="M13.376 11.552l-.264-10.44-10.44-.24.024 2.28 6.96-.048L.2 12.56l1.488 1.488 9.432-9.432-.048 6.912 2.304.024z"
            />
          </svg>
          <svg
            className="absolute transition-transform duration-300 ease-in-out delay-100 -translate-x-[150%] -translate-y-[100%] group-hover:translate-x-0 group-hover:translate-y-0"
            xmlns="http://www.w3.org/2000/svg"
            width="10"
            fill="none"
            viewBox="0 0 14 15"
          >
            <path
              fill="currentColor"
              d="M13.376 11.552l-.264-10.44-10.44-.24.024 2.28 6.96-.048L.2 12.56l1.488 1.488 9.432-9.432-.048 6.912 2.304.024z"
            />
          </svg>
        </span>
      )}
    </motion.button>
  );
}
