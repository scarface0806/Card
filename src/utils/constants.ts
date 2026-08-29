// App branding & metadata.
// Contact details live in ONE place only - see src/lib/site-config.ts.
// These re-exports keep older imports working; do not add new contact values
// here, add them to site-config.
export {
  SITE_NAME as APP_NAME,
  SITE_DESCRIPTION as APP_DESCRIPTION,
  SITE_URL as APP_URL,
  SUPPORT_EMAIL,
  PHONE_E164 as SUPPORT_PHONE,
  PHONE_DISPLAY as SUPPORT_PHONE_DISPLAY,
  WHATSAPP_NUMBER,
  whatsappLink,
} from '@/lib/site-config';

// Color palette
export const COLORS = {
  primary: '#4ade80',
  secondary: '#34d399',
  accent: '#4ade80',
  lightGray: '#1f2937',
  darkGray: '#9ca3af',
  border: 'rgba(255, 255, 255, 0.1)',
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  brandGradient: 'linear-gradient(to right, #4ade80, #34d399)',
};

// Navigation routes
export const ROUTES = {
  HOME: '/',
  // Features is a section on the homepage, not a route of its own.
  FEATURES: '/#features',
  CARDS: '/cards',
  CREATE_CARD: '/create-card',
  ABOUT: '/about-us',
  HOW_TO_USE: '/how-to-use',
  PRODUCTS: '/products',
  SERVICES: '/services',
  // /order is a permanent redirect to /create-card (see next.config.ts).
  // CTAs point at the canonical route directly so there is no extra hop.
  ORDER: '/create-card',
  ORDER_SUCCESS: '/order-success',
  CONTACT: '/contact-us',
  PRIVACY: '/privacy-policy',
  TERMS: '/terms-conditions',
  LOGIN: '/login',
  SIGNUP: '/signup',
};

// Step labels for order form
export const FORM_STEPS = [
  { id: 1, label: 'Personal Details' },
  { id: 2, label: 'Business Details' },
  { id: 3, label: 'Social Links' },
  { id: 4, label: 'Uploads' },
  { id: 5, label: 'Payment' },
];

// Social links - profile URLs come from site-config so there is one source of
// truth and unconfirmed profiles are omitted rather than shipped as dead links.
export { ACTIVE_SOCIAL_PROFILES as SOCIAL_LINKS } from '@/lib/site-config';

// Animation config
export const ANIMATION_CONFIG = {
  duration: 0.5,
  staggerDelay: 0.1,
  ease: 'easeInOut',
};
