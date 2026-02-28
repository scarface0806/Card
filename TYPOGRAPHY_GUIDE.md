/**
 * TYPOGRAPHY SYSTEM DOCUMENTATION
 * =================================
 * 
 * Premium SaaS Typography Setup
 * Built with Space Grotesk (Headings) + Inter (Body)
 */

/**
 * FONT IMPORTS
 */

// In app/layout.tsx:
// import { Inter, Space_Grotesk } from 'next/font/google';
//
// const inter = Inter({
//   variable: '--font-inter',
//   subsets: ['latin'],
//   display: 'swap',
// });
//
// const spaceGrotesk = Space_Grotesk({
//   variable: '--font-space-grotesk',
//   subsets: ['latin'],
//   weight: ['400', '500', '600', '700'],
//   display: 'swap',
// });
//
// In body className: `${inter.variable} ${spaceGrotesk.variable}`

/**
 * DESKTOP SCALE
 */

// H1: Headline / Hero
// - Font: Space Grotesk
// - Weight: 700
// - Size: 56px
// - Line height: 1.1
// - Letter spacing: -0.5px
// - Usage: Main page headline, hero section title
// - Example: "Your Digital Business Card, Instantly Available"

// H2: Section Heading
// - Font: Space Grotesk
// - Weight: 600
// - Size: 40px  
// - Line height: 1.2
// - Letter spacing: -0.25px
// - Usage: Section headers, major content blocks
// - Example: "Why Choose Tapvyo?"

// H3: Subsection Heading
// - Font: Space Grotesk
// - Weight: 600
// - Size: 28px
// - Line height: 1.3
// - Usage: Feature headers, card titles
// - Example: "Lightning-fast Setup"

// Body Large
// - Font: Inter
// - Weight: 400
// - Size: 18px
// - Line height: 1.6
// - Usage: Intro paragraphs, feature descriptions, highlighted content
// - Example: Welcome text, lead paragraphs

// Body Regular
// - Font: Inter
// - Weight: 400
// - Size: 16px
// - Line height: 1.6
// - Usage: Main body copy, most UI text
// - Example: Navigation, form fields, descriptions

// Body Small
// - Font: Inter
// - Weight: 400
// - Size: 14px
// - Line height: 1.5
// - Usage: Labels, captions, helper text

// Button
// - Font: Inter
// - Weight: 500
// - Size: 16px
// - Uppercase: Yes
// - Letter spacing: 0.5px
// - Usage: All button text

/**
 * MOBILE SCALE (Responsive)
 */

// H1: 36px (Desktop: 56px)
// H2: 28px (Desktop: 40px)
// H3: 22px (Desktop: 28px)
// Body: 16px (same as desktop)

/**
 * COMPONENT USAGE
 */

// Heading Component:
// <Heading as="h1">Main Title</Heading>
// <Heading as="h2">Section Title</Heading>
// <Heading as="h3">Subsection Title</Heading>

// Text Component:
// <Text variant="body-lg">Large body text</Text>
// <Text variant="body">Regular body text</Text>
// <Text variant="body-sm">Small text</Text>

/**
 * TAILWIND CSS UTILITIES
 */

// Available text size utilities:
// Text-h1 / text-h2 / text-h3
// text-body-lg / text-body / text-body-sm
// text-button

// Available font utilities:
// font-sans (Inter)
// font-space-grotesk (Space Grotesk)

// Example usage:
// <h1 className="text-h1 font-space-grotesk font-bold">Heading</h1>
// <p className="text-body font-sans">Body text</p>

/**
 * VERTICAL RHYTHM
 */

// Spacing utilities for maintaining rhythm:
// rhythm-1: 0.5rem (8px)
// rhythm-2: 1rem (16px)
// rhythm-3: 1.5rem (24px)
// rhythm-4: 2rem (32px)
// rhythm-6: 3rem (48px)
// rhythm-8: 4rem (64px)
// rhythm-12: 6rem (96px)

// Example:
// <div className="mb-rhythm-4">Content</div>

/**
 * DESIGN PRINCIPLES
 */

// 1. Strong Hierarchy
//    - H1: Most important (56px)
//    - H2: Section level (40px)
//    - H3: Subsection (28px)
//    - Body: Content (16px)

// 2. Modern Tech Startup Feel
//    - Space Grotesk: Bold, geometric, contemporary
//    - Inter: Clean, minimal, highly readable

// 3. Responsive Design
//    - Automatically scales on mobile devices
//    - Maintains readability at all sizes

// 4. Dark Mode Ready
//    - All text colors optimized for dark backgrounds
//    - High contrast for accessibility

// 5. Performance
//    - Using font-display: swap for fast loading
//    - Optimized font weights

/**
 * COLOR GUIDANCE
 */

// Heading colors:
// - text-white (primary)
// - bg-gradient-to-r from-blue-400 to-cyan-400 (gradient text for hero)

// Body colors:
// - text-slate-300 (primary body text)
// - text-slate-400 (secondary text)

// Button text:
// - text-white (on colored backgrounds)
// - text-button (uppercase style)

/**
 * ACCESSIBILITY
 */

// - All fonts use system stack as fallback
// - Line heights optimized for readability
// - Letter spacing prevents text bunching
// - Sufficient contrast ratios

/**
 * NEXT.JS + TAILWIND SETUP
 */

// 1. Font imports in layout.tsx
// 2. CSS variables in globals.css
// 3. Tailwind config extends fontFamily and fontSize
// 4. Use @apply rules for consistency
// 5. Reusable components (Heading, Text)
