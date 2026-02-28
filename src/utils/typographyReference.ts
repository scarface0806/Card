const typographyQuickReference = {
  fonts: {
    headings: 'Space Grotesk',
    body: 'Inter',
  },

  headingScales: {
    h1: {
      desktop: '56px',
      mobile: '36px',
      weight: 700,
      lineHeight: 1.1,
      letterSpacing: '-0.5px',
      usage: 'Hero titles, main headlines',
      tailwind: 'text-h1 font-space-grotesk font-bold',
    },
    h2: {
      desktop: '40px',
      mobile: '28px',
      weight: 600,
      lineHeight: 1.2,
      letterSpacing: '-0.25px',
      usage: 'Section headings',
      tailwind: 'text-h2 font-space-grotesk font-semibold',
    },
    h3: {
      desktop: '28px',
      mobile: '22px',
      weight: 600,
      lineHeight: 1.3,
      usage: 'Card titles, subsections',
      tailwind: 'text-h3 font-space-grotesk font-semibold',
    },
  },

  bodyScales: {
    bodyLarge: {
      size: '18px',
      weight: 400,
      lineHeight: 1.6,
      usage: 'Intro paragraphs, feature descriptions',
      tailwind: 'text-body-lg font-sans',
    },
    body: {
      size: '16px',
      weight: 400,
      lineHeight: 1.6,
      usage: 'Standard body copy, most UI text',
      tailwind: 'text-body font-sans',
    },
    bodySmall: {
      size: '14px',
      weight: 400,
      lineHeight: 1.5,
      usage: 'Labels, captions, helper text',
      tailwind: 'text-body-sm font-sans',
    },
  },

  buttonStyle: {
    size: '16px',
    weight: 500,
    style: 'uppercase',
    letterSpacing: '0.5px',
    tailwind: 'font-sans text-button uppercase',
  },

  colors: {
    headings: 'text-white',
    bodyPrimary: 'text-slate-300',
    bodySecondary: 'text-slate-400',
    bodyTertiary: 'text-slate-500',
    accentPrimary: 'text-blue-400 / text-cyan-400',
    accentSecondary: 'text-purple-500 / text-pink-500',
  },

  spacing: {
    rhythm1: '0.5rem',
    rhythm2: '1rem',
    rhythm3: '1.5rem',
    rhythm4: '2rem',
    rhythm6: '3rem',
    rhythm8: '4rem',
    rhythm12: '6rem',
  },

  // React Component Usage
  usageExamples: {
    heading: `
import Heading from '@/components/Heading';

function MyPage() {
  return (
    <>
      <Heading as="h1">Hero Title</Heading>
      <Heading as="h2" className="mt-8">Section Title</Heading>
      <Heading as="h3">Subsection</Heading>
    </>
  );
}
    `,

    text: `
import Text from '@/components/Text';

function MyComponent() {
  return (
    <>
      <Text variant="body-lg">Introduction paragraph</Text>
      <Text variant="body">Regular body text</Text>
      <Text variant="body-sm">Helper text</Text>
    </>
  );
}
    `,

    combined: `
import Heading from '@/components/Heading';
import Text from '@/components/Text';

function Feature() {
  return (
    <div>
      <Heading as="h3">Fast Setup</Heading>
      <Text variant="body">
        Get started in minutes with our simple wizard.
      </Text>
    </div>
  );
}
    `,

    tailwind: `
// Direct Tailwind approach (without components)
<h1 className="text-h1 font-space-grotesk font-bold text-white">Title</h1>
<p className="text-body font-sans text-slate-300">Body text</p>
<button className="font-sans text-button uppercase">Button Text</button>
    `,
  },

  // Files to Reference
  documentation: {
    fullGuide: 'TYPOGRAPHY_GUIDE.md',
    implementation: 'IMPLEMENTATION_SUMMARY.md',
    component: 'src/components/TypographyGuide.tsx',
  },

  // For Design Systems
  designTokens: {
    fontFamily: {
      heading: 'var(--font-space-grotesk)',
      body: 'var(--font-inter)',
    },
    fontSize: {
      h1: '56px',
      h2: '40px',
      h3: '28px',
      bodyLg: '18px',
      body: '16px',
      bodySm: '14px',
    },
    lineHeight: {
      tight: 1.1,
      snug: 1.2,
      normal: 1.3,
      relaxed: 1.5,
      spacious: 1.6,
    },
    fontWeight: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
};

export default typographyQuickReference;
