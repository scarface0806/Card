import React from 'react';

interface TextProps {
  variant?: 'body-lg' | 'body' | 'body-sm';
  as?: 'p' | 'span' | 'div';
  children: React.ReactNode;
  className?: string;
  id?: string;
}

/**
 * Premium typography component for body text
 * Uses Inter font for optimal readability
 * 
 * @param variant - Text size variant
 * @param as - HTML tag
 * @param children - Text content
 * @param className - Additional Tailwind classes
 */
export default function Text({
  variant = 'body',
  as: Component = 'p',
  children,
  className = '',
  id,
}: TextProps) {
  const variantClasses = {
    'body-lg': 'text-body-lg font-sans text-slate-300',
    'body': 'text-body font-sans text-slate-300',
    'body-sm': 'text-body-sm font-sans text-slate-400',
  };

  return (
    <Component 
      className={`${variantClasses[variant]} ${className}`}
      id={id}
    >
      {children}
    </Component>
  );
}
