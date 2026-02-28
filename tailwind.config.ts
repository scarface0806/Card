import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', ...defaultTheme.fontFamily.sans],
        'space-grotesk': ['var(--font-space-grotesk)', ...defaultTheme.fontFamily.sans],
      },
      fontSize: {
        // Desktop Typography Scale
        'h1': ['56px', { lineHeight: '1.1', letterSpacing: '-0.5px', fontWeight: '700' }],
        'h2': ['40px', { lineHeight: '1.2', letterSpacing: '-0.25px', fontWeight: '600' }],
        'h3': ['28px', { lineHeight: '1.3', letterSpacing: '0px', fontWeight: '600' }],
        'body-lg': ['18px', { lineHeight: '1.6', letterSpacing: '0px', fontWeight: '400' }],
        'body': ['16px', { lineHeight: '1.6', letterSpacing: '0px', fontWeight: '400' }],
        'body-sm': ['14px', { lineHeight: '1.5', letterSpacing: '0px', fontWeight: '400' }],
        'button': ['16px', { lineHeight: '1.5', letterSpacing: '0.5px', fontWeight: '500' }],
      },
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '2rem',
          lg: '4rem',
          xl: '5rem',
          '2xl': '6rem',
        },
      },
      spacing: {
        'rhythm-1': '0.5rem',
        'rhythm-2': '1rem',
        'rhythm-3': '1.5rem',
        'rhythm-4': '2rem',
        'rhythm-6': '3rem',
        'rhythm-8': '4rem',
        'rhythm-12': '6rem',
      },
      lineHeight: {
        'tight': '1.1',
        'snug': '1.2',
        'normal': '1.5',
        'relaxed': '1.75',
      },
      colors: {
        'dark': {
          'bg': '#0a0a0f',
          'surface': '#11131a',
          'card': 'rgba(255, 255, 255, 0.05)',
          'border': 'rgba(255, 255, 255, 0.1)',
          'text-primary': '#ffffff',
          'text-secondary': '#a1a1aa',
          'text-muted': '#71717a',
        },
        'accent': {
          'primary': '#7c3aed',
          'secondary': '#4f46e5',
          'tertiary': '#06b6d4',
        },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #7c3aed, #4f46e5, #06b6d4)',
        'gradient-dark': 'linear-gradient(135deg, #0a0a0f, #11131a)',
        'radial-glow': 'radial-gradient(circle at center, rgba(124, 58, 237, 0.15), transparent)',
      },
      backdropBlur: {
        glow: '40px',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'glow-sm': '0 0 20px rgba(124, 58, 237, 0.3)',
        'glow-md': '0 0 40px rgba(124, 58, 237, 0.4)',
        'glow-lg': '0 0 60px rgba(124, 58, 237, 0.5)',
      },
    },
  },
  plugins: [],
};
export default config;
