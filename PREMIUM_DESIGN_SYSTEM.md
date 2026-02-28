# PREMIUM DARK GLASSMORPHISM DESIGN SYSTEM
## Tapvyo NFC SaaS Frontend

---

## 🎨 Design Philosophy

**Inspiration**: Stripe • Linear • Raycast • Modern AI Startups

**Aesthetic**:
- Premium SaaS feel
- High-end tech startup
- Modern 2026 UI trends
- Elegant & clean
- Smooth interactions

**NOT**: Flashy • Neon • Crypto-style • Over-animated

---

## 🌑 Color System

### Background Palette
```css
Primary: #0a0a0f (dark-bg)
Surface: #11131a (dark-surface)
Card: rgba(255, 255, 255, 0.05) (bg-white/5)
Border: rgba(255, 255, 255, 0.1) (border-white/10)
```

### Text Hierarchy
```css
Primary: #ffffff (text-white)
Secondary: #a1a1aa (text-white/70)
Muted: #71717a (text-white/50)
```

### Gradient Accents
```css
Primary Gradient: linear-gradient(135deg, #7c3aed, #4f46e5, #06b6d4)
From: Violet-600
Via: Indigo-500  
To: Cyan-500
```

---

## 🎯 Glassmorphism Style

All cards and surfaces follow this pattern:

### Base Classes
```css
bg-white/5           /* 5% white opacity */
backdrop-blur-xl     /* 40px blur */
border border-white/10
rounded-2xl
shadow-glass
```

### Hover Effects
```css
hover:scale-[1.02]     /* Subtle scale up */
hover:-translate-y-1   /* Lift effect */
transition-all duration-300 ease-out
hover:shadow-glow-md   /* Glow shadow */
hover:border-white/20  /* Border brighten */
```

### Shadow Glows
```css
shadow-glow-sm   /* 0 0 20px rgba(124, 58, 237, 0.3) */
shadow-glow-md   /* 0 0 40px rgba(124, 58, 237, 0.4) */
shadow-glow-lg   /* 0 0 60px rgba(124, 58, 237, 0.5) */
```

---

## 📦 Components

### 1. GlassCard Component
Premium card with glassmorphism styling

**Props**:
- `hover?: boolean` - Add hover animation
- `glow?: boolean` - Add glow effect on hover
- `interactive?: boolean` - Add cursor pointer
- `className?: string` - Additional classes

**Usage**:
```tsx
import GlassCard from '@/components/GlassCard';

<GlassCard hover glow>
  <h3>Feature Title</h3>
  <p>Description</p>
</GlassCard>
```

---

### 2. PremiumButton Component
Gradient button with smooth animations

**Props**:
- `variant?: 'primary' | 'secondary' | 'outline'` - Button style
- `size?: 'sm' | 'md' | 'lg'` - Button size
- `href?: string` - Link href
- `onClick?: () => void` - Click handler
- `disabled?: boolean` - Disabled state

**Variants**:
```tsx
{/* Primary - Gradient background */}
<PremiumButton variant="primary">
  Get Started
</PremiumButton>

{/* Secondary - Glass style */}
<PremiumButton variant="secondary">
  Learn More
</PremiumButton>

{/* Outline - Border only */}
<PremiumButton variant="outline">
  Contact
</PremiumButton>
```

---

### 3. PremiumNavbar Component
Fixed navbar with glassmorphism and mobile menu

**Features**:
- Glassmorphic background with blur
- Mobile-responsive hamburger menu
- Logo gradient
- Navigation links
- CTA button

**Usage**:
```tsx
import PremiumNavbar from '@/components/PremiumNavbar';

export default function Layout() {
  return (
    <>
      <PremiumNavbar />
      {/* Content */}
    </>
  );
}
```

---

### 4. PremiumHeroSection Component
Hero section with animated background and gradient text

**Features**:
- Animated radial glows
- Gradient headline text
- Badge with animation
- Dual CTA buttons
- Preview card frame

**Usage**:
```tsx
import PremiumHeroSection from '@/components/PremiumHeroSection';

export default function Home() {
  return <PremiumHeroSection />;
}
```

---

### 5. PremiumBentoSection Component
Uneven bento grid layout for features

**Features**:
- Bento grid layout (uneven)
- Glass cards with icons
- Large featured card
- Hover animations
- Statistics display

**Card Spans**:
- Large: `md:col-span-2 md:row-span-2`
- Medium: `md:col-span-2`
- Small: `md:col-span-1`

**Usage**:
```tsx
import PremiumBentoSection from '@/components/PremiumBentoSection';

export default function Features() {
  return <PremiumBentoSection />;
}
```

---

### 6. PremiumPricingSection Component
Pricing cards with highlighted plan

**Features**:
- 3-column pricing layout
- Highlighted middle plan
- Feature lists with checkmarks
- Gradient badges
- Featured plan shadow glow

**Usage**:
```tsx
import PremiumPricingSection from '@/components/PremiumPricingSection';

export default function Pricing() {
  return <PremiumPricingSection />;
}
```

---

## 🎎 Tailwind Extensions

### Custom Colors
```css
dark-bg       /* #0a0a0f */
dark-surface  /* #11131a */
dark-card     /* rgba(255, 255, 255, 0.05) */
dark-border   /* rgba(255, 255, 255, 0.1) */
```

### Gradient Utilities
```css
bg-gradient-primary  /* Violet → Indigo → Cyan */
bg-gradient-dark     /* Dark gradient */
bg-radial-glow       /* Radial centered glow */
```

### Shadow Utilities
```css
shadow-glass       /* Glass card shadow */
shadow-glow-sm     /* Small glow */
shadow-glow-md     /* Medium glow */
shadow-glow-lg     /* Large glow */
```

### Backdrop Blur
```css
backdrop-blur-glow /* 40px blur */
```

---

## ✨ Micro Interactions

### Timing
```css
duration-300
ease-out
```

### Scale Animations
```css
hover:scale-[1.02]    /* 2% scale up */
active:scale-95       /* Press down */
```

### Translation
```css
hover:-translate-y-1  /* Lift 4px */
```

### Shadows
```css
hover:shadow-glow-md  /* Add glow on hover */
```

### Borders
```css
hover:border-white/20 /* Brighten border */
```

---

## 📐 Layout System

### Container
```tsx
<div className="container mx-auto max-w-7xl px-4">
  {/* Content */}
</div>
```

### Grid Layouts
```css
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3
gap-6 md:gap-8
```

### Spacing
- Use rhythm utilities: `rhythm-1` through `rhythm-12`
- Maintains vertical rhythm
- Responsive padding system

---

## 🎯 Typography System

### Headings
```tsx
import Heading from '@/components/Heading';

<Heading as="h1">Hero Title</Heading>
<Heading as="h2">Section Title</Heading>
<Heading as="h3">Card Title</Heading>
```

### Body Text
```tsx
import Text from '@/components/Text';

<Text variant="body-lg">Large intro</Text>
<Text variant="body">Regular body</Text>
<Text variant="body-sm">Small text</Text>
```

### Font Families
- **Headings**: Space Grotesk (modern, geometric)
- **Body**: Inter (clean, readable)

---

## 🔄 Animation Pattern

### Stagger Container
```tsx
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};
```

### Item Animation
```tsx
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};
```

### Usage
```tsx
<motion.div
  variants={containerVariants}
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true, margin: '-100px' }}
>
  {/* Animated children */}
</motion.div>
```

---

## 🛠️ Component Pattern

### Structure
```tsx
'use client';

import { motion } from 'framer-motion';
import GlassCard from '@/components/GlassCard';
import PremiumButton from '@/components/PremiumButton';
import Heading from '@/components/Heading';
import Text from '@/components/Text';

export default function FeatureSection() {
  return (
    <section className="relative py-20 md:py-32 bg-dark-bg overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 -z-10">
        {/* Gradient glows */}
      </div>

      <div className="container mx-auto max-w-7xl px-4">
        {/* Content */}
      </div>
    </section>
  );
}
```

---

## ✅ Best Practices

### DO:
✓ Use dark-bg for all backgrounds
✓ Use white/5 and white/10 for contrast
✓ Apply backdrop-blur-xl to glassmorphic elements
✓ Use gradient primary for CTAs
✓ Add soft glow shadows on hover
✓ Use stagger animations for lists
✓ Keep animations subtle (duration-300)
✓ Test on mobile (mobile-first)

### DON'T:
✗ Use bright neon colors
✗ Animate scale more than 1.02
✗ Use duration > 500ms for micro interactions
✗ Mix animate with motion, use Framer Motion
✗ Forget backdrop-blur for glass effect
✗ Use hard white instead of white/opacity
✗ Animate opacity alone (combine with movement)
✗ Forget viewport detection for scroll animations

---

## 📱 Responsive Breakpoints

```css
Mobile-first: base styles (mobile)
sm: 640px   /* Small devices */
md: 768px   /* Tablets */
lg: 1024px  /* Desktops */
xl: 1280px  /* Large screens */
2xl: 1536px /* Extra large */
```

---

## 🚀 Performance Tips

1. **Lazy Load Animations**:
   ```tsx
   whileInView={{ opacity: 1, y: 0 }}
   viewport={{ once: true }}
   ```

2. **Use `z-10` Carefully**: Only when necessary (navbar, modals)

3. **Optimize Blur**: `backdrop-blur-xl` is expensive, use sparingly

4. **Reduce Motion**: Respect `prefers-reduced-motion` (can add later)

5. **Bundle Size**: All components are tree-shakeable

---

## 🎓 Component Integration Example

```tsx
'use client';

import PremiumNavbar from '@/components/PremiumNavbar';
import PremiumHeroSection from '@/components/PremiumHeroSection';
import PremiumBentoSection from '@/components/PremiumBentoSection';
import PremiumPricingSection from '@/components/PremiumPricingSection';
import Footer from '@/layouts/Footer';

export default function Home() {
  return (
    <>
      <PremiumNavbar />
      <PremiumHeroSection />
      <PremiumBentoSection />
      <PremiumPricingSection />
      <Footer />
    </>
  );
}
```

---

## 📊 Color Combinations

### Primary CTA (Gradient)
```css
from-violet-600 via-indigo-500 to-cyan-500
text-white
hover:shadow-glow-md
```

### Secondary CTA (Glass)
```css
bg-white/10
text-white
hover:bg-white/20
border-white/20
hover:border-white/40
```

### Cards
```css
bg-white/5
border-white/10
hover:border-white/20
text-white/70 (secondary text)
```

### Accents
```css
Violet-500 to Cyan-500 (gradient icons)
Cyan-400 (checkmarks, badges)
White (primary text)
```

---

## 🔍 File Structure

```
src/components/
├── GlassCard.tsx
├── PremiumButton.tsx
├── PremiumNavbar.tsx
├── PremiumHeroSection.tsx
├── PremiumBentoSection.tsx
├── PremiumPricingSection.tsx
├── Heading.tsx
├── Text.tsx
└── Typography Guide.tsx

tailwind.config.ts (extended)
app/globals.css (dark theme)
app/layout.tsx (dark background)
```

---

## 🎬 Ready for Production

All components are:
✅ Fully responsive
✅ Performance optimized
✅ Type-safe (TypeScript)
✅ Accessible
✅ Animated with Framer Motion
✅ Following SaaS best practices
✅ $10M+ funded startup aesthetic

---

**Implementation Date**: February 25, 2026  
**Status**: ✅ Production Ready  
**Team**: Tapvyo Frontend Team
