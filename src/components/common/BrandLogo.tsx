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

  // Both logo assets are 200x60. Stating the intrinsic size lets the browser
  // reserve the box before the image decodes - without it the nav and footer
  // reflowed on every cold load.
  return (
    <img
      src={src}
      alt={BRAND.name}
      width={200}
      height={60}
      className={`${heightClass[size]} w-auto object-contain ${className}`}
    />
  );
}
