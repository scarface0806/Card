/**
 * Premium Motion System
 * Single source of truth for all animations
 * 
 * Duration Scale:
 * - Fast: 150ms (micro-interactions, quick feedback)
 * - Standard: 220ms (most transitions)
 * - Slow: 320ms (page transitions, complex animations)
 * 
 * Easing:
 * - Premium: cubic-bezier(0.25, 0.1, 0.25, 1) - smooth, no bounce
 * - No spring physics, no overshoot
 */

// Duration values
export const durations = {
  fast: 0.15,
  standard: 0.22,
  slow: 0.32,
} as const;

// Premium easing curve - smooth, controlled, no bounce
export const easing = {
  premium: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
  easeOut: [0.33, 1, 0.68, 1] as [number, number, number, number],
};

// Commonly used transitions
export const transitions = {
  fast: {
    duration: durations.fast,
    ease: easing.premium,
  },
  standard: {
    duration: durations.standard,
    ease: easing.premium,
  },
  slow: {
    duration: durations.slow,
    ease: easing.premium,
  },
} as const;

// Button interactions
export const buttonMotion = {
  hover: { y: -3 },
  tap: { y: 1 },
  transition: transitions.standard,
} as const;

// Card interactions
export const cardMotion = {
  hover: { y: -4 },
  transition: transitions.standard,
} as const;

// Subtle hover for small elements
export const subtleMotion = {
  hover: { y: -2 },
  tap: { y: 0 },
  transition: transitions.fast,
} as const;

// Fade in animation variants
export const fadeInVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
} as const;

// Fade in with subtle lift
export const fadeInUpVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -5 },
} as const;

// Scale in (for modals)
export const scaleInVariants = {
  initial: { opacity: 0, scale: 0.96, y: 8 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.96, y: 8 },
} as const;

// Backdrop animation
export const backdropVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
} as const;

export const backdropTransition = {
  duration: durations.fast,
  ease: 'linear',
} as const;

// Accordion/collapse animation
export const collapseMotion = {
  initial: { height: 0, opacity: 0 },
  animate: { height: 'auto', opacity: 1 },
  exit: { height: 0, opacity: 0 },
  transition: {
    height: { duration: durations.standard, ease: easing.premium },
    opacity: { duration: durations.fast, ease: 'linear' },
  },
} as const;

// Icon rotation (for accordions)
export const rotateMotion = {
  initial: { rotate: 0 },
  animate: (isOpen: boolean) => ({ rotate: isOpen ? 180 : 0 }),
  transition: transitions.standard,
} as const;

// Stagger children for lists
export const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
} as const;

export const staggerItem = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: transitions.standard,
  },
} as const;

// Viewport options for scroll-triggered animations
export const viewportOptions = {
  once: true,
  margin: '-50px',
} as const;

// Framer Motion whileInView defaults
export const whileInViewDefaults = {
  viewport: viewportOptions,
  transition: transitions.slow,
} as const;
