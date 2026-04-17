/**
 * BRAND CONFIG — Single source of truth for brand identity.
 * Used across all pages: public, customer-facing, and admin.
 * Never reference logo paths directly — always import from here.
 */
export const BRAND = {
  name: 'Tapvyo',
  /** Primary logo — for light / white backgrounds */
  logo: '/logo-small.png',
  /** Light logo — for dark backgrounds (footer, admin sidebar/login) */
  logoLight: '/logo-footer.png',
} as const;
