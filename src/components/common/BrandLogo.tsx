import { BRAND } from '@/lib/brand';

interface BrandLogoProps {
  /** Visual size preset */
  size?: 'small' | 'medium' | 'large';
  /** 'light' uses the white/light version for dark backgrounds */
  variant?: 'default' | 'light';
  className?: string;
}

const heightClass: Record<NonNullable<BrandLogoProps['size']>, string> = {
  small: 'h-8',   // 32px
  medium: 'h-10', // 40px
  large: 'h-16',  // 64px
};

export default function BrandLogo({
  size = 'medium',
  variant = 'default',
  className = '',
}: BrandLogoProps) {
  const src = variant === 'light' ? BRAND.logoLight : BRAND.logo;

  return (
    <img
      src={src}
      alt={BRAND.name}
      className={`${heightClass[size]} w-auto object-contain ${className}`}
    />
  );
}
