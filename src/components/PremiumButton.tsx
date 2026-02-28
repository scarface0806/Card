import React from 'react';
import Link from 'next/link';

interface PremiumButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  showIcon?: boolean;
}

/**
 * Premium pill button with animated arrow icon
 * Variants: primary (purple), secondary (cyan), outline
 */
export default function PremiumButton({
  children,
  variant = 'primary',
  size = 'md',
  href,
  onClick,
  className = '',
  disabled = false,
  type = 'button',
  showIcon = true,
}: PremiumButtonProps) {
  const baseClasses = [
    'inline-flex',
    'items-center',
    'font-sans',
    'rounded-full',
    'transition-all',
    'duration-300',
    'ease-out',
    'font-semibold',
    'gap-3',
    'whitespace-nowrap',
    'overflow-hidden',
    'group',
    disabled && 'opacity-50 cursor-not-allowed',
  ]
    .filter(Boolean)
    .join(' ');

  const variantClasses = {
    primary: 'bg-[#7808d0] text-white hover:bg-black',
    secondary: 'bg-[#0891b2] text-white hover:bg-black',
    outline: 'border-2 border-[#7808d0] text-[#7808d0] hover:bg-[#7808d0] hover:text-white bg-transparent',
  };

  const iconColors = {
    primary: 'text-[#7808d0] group-hover:text-black',
    secondary: 'text-[#0891b2] group-hover:text-black',
    outline: 'text-[#7808d0] group-hover:text-white',
  };

  const iconBgColors = {
    primary: 'bg-white',
    secondary: 'bg-white',
    outline: 'bg-[#7808d0] group-hover:bg-white',
  };

  const sizeClasses = {
    sm: 'pl-4 pr-3 py-2 text-sm',
    md: 'pl-5 pr-4 py-3 text-base',
    lg: 'pl-6 pr-5 py-4 text-lg',
  };

  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-7 h-7',
  };

  const IconWrapper = () => (
    showIcon && (
      <span className={`flex-shrink-0 ${iconSizes[size]} relative ${iconBgColors[variant]} rounded-full grid place-items-center overflow-hidden ${iconColors[variant]} transition-colors duration-300`}>
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
    )
  );

  const classes = [baseClasses, variantClasses[variant], sizeClasses[size], className]
    .filter(Boolean)
    .join(' ');

  if (href) {
    return (
      <Link href={href}>
        <button className={classes} disabled={disabled}>
          {children}
          <IconWrapper />
        </button>
      </Link>
    );
  }

  return (
    <button
      className={classes}
      onClick={onClick}
      disabled={disabled}
      type={type}
    >
      {children}
      <IconWrapper />
    </button>
  );
}
