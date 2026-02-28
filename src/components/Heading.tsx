import React from 'react';

interface HeadingProps {
  as?: 'h1' | 'h2' | 'h3';
  children: React.ReactNode;
  className?: string;
  id?: string;
}

/**
 * Premium typography component for headings
 * Uses Space Grotesk font for modern SaaS aesthetic
 * 
 * @param as - HTML tag (h1, h2, h3)
 * @param children - Heading content
 * @param className - Additional Tailwind classes
 */
export default function Heading({
  as: Component = 'h1',
  children,
  className = '',
  id,
}: HeadingProps) {
  const baseClasses = {
    h1: 'text-h1 font-space-grotesk font-bold text-white',
    h2: 'text-h2 font-space-grotesk font-semibold text-white',
    h3: 'text-h3 font-space-grotesk font-semibold text-white',
  };

  return (
    <Component 
      className={`${baseClasses[Component]} ${className}`}
      id={id}
    >
      {children}
    </Component>
  );
}
