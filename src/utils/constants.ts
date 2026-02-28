// App branding & metadata
export const APP_NAME = 'Tapvyo NFC';
export const APP_DESCRIPTION = 'Modern NFC Digital Business Card Platform';
export const APP_URL = 'https://tapvyo-nfc.com';
export const SUPPORT_EMAIL = 'support@tapvyo-nfc.com';
export const SUPPORT_PHONE = '+91 9999999999';
export const WHATSAPP_NUMBER = '919999999999';

// Color palette
export const COLORS = {
  primary: '#000000', // Black
  secondary: '#ffffff', // White
  accent: '#3b82f6', // Blue
  lightGray: '#f3f4f6',
  darkGray: '#6b7280',
  border: '#e5e7eb',
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
};

// Navigation routes
export const ROUTES = {
  HOME: '/',
  FEATURES: '/features',
  CARDS: '/cards',
  HOW_IT_WORKS: '/how-it-works',
  CREATE_CARD: '/create-card',
  COMPANY: '/company',
  ABOUT: '/about-us',
  HOW_TO_USE: '/how-to-use',
  PRODUCTS: '/products',
  SERVICES: '/services',
  ORDER: '/order',
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

// Social links
export const SOCIAL_LINKS = [
  { name: 'Instagram', url: 'https://instagram.com', icon: 'Instagram' },
  { name: 'Facebook', url: 'https://facebook.com', icon: 'Facebook' },
  { name: 'LinkedIn', url: 'https://linkedin.com', icon: 'Linkedin' },
  { name: 'YouTube', url: 'https://youtube.com', icon: 'Youtube' },
];

// Animation config
export const ANIMATION_CONFIG = {
  duration: 0.5,
  staggerDelay: 0.1,
  ease: 'easeInOut',
};
