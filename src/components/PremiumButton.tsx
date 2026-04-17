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

// Arrow icon extracted outside component to avoid "component created during render" lint error
function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg
      width="10"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 14 15"
    >
      <path
        fill="currentColor"
        d="M13.376 11.552l-.264-10.44-10.44-.24.024 2.28 6.96-.048L.2 12.56l1.488 1.488 9.432-9.432-.048 6.912 2.304.024z"
      />
    </svg>
  );
}

/**
 * Premium pill button with animated arrow icon
 * Variants: primary, secondary, outline
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
    primary: 'bg-gradient-to-r from-primary to-secondary text-[#0f2e25] hover:from-[#28A428] hover:to-[#e6e600] active:scale-[0.98] shadow-md hover:shadow-lg',
    secondary: 'bg-white border-2 border-primary text-primary hover:bg-primary/10 active:scale-[0.98]',
    outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-[#0f2e25] bg-transparent active:scale-[0.98]',
  };

  const iconColors = {
    primary: 'text-[#0f2e25]',
    secondary: 'text-[#0f2e25]',
    outline: 'text-primary group-hover:text-[#0f2e25]',
  };

  const iconBgColors = {
    primary: 'bg-white/30',
    secondary: 'bg-white/30',
    outline: 'bg-primary/20 group-hover:bg-white/30',
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

  const iconSpan = showIcon ? (
    <span className={`flex-shrink-0 ${iconSizes[size]} relative ${iconBgColors[variant]} rounded-full grid place-items-center overflow-hidden ${iconColors[variant]} transition-colors duration-300`}>
      <ArrowIcon className="transition-transform duration-300 ease-in-out group-hover:translate-x-[150%] group-hover:translate-y-[100%]" />
      <ArrowIcon className="absolute transition-transform duration-300 ease-in-out delay-100 -translate-x-[150%] -translate-y-[100%] group-hover:translate-x-0 group-hover:translate-y-0" />
    </span>
  ) : null;

  const classes = [baseClasses, variantClasses[variant], sizeClasses[size], className]
    .filter(Boolean)
    .join(' ');

  if (href) {
    return (
      <Link href={href}>
        <button className={classes} disabled={disabled}>
          {children}
          {iconSpan}
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
      {iconSpan}
    </button>
  );
}
