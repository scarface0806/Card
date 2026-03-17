# 🎨 Tapvyo Design System - Global Standards  
**January 2026 | Senior UI/Product Design**  
**Standards Version: 1.0**

---

## 📐 GLOBAL CONTAINER SYSTEM

### Maximum Width
**Value:** `max-w-6xl` (1344px)  
**Applied to:** ALL sections (no exceptions)

### Horizontal Padding (Responsive)
```
Base (mobile):     px-6
Tablet (sm):       sm:px-8
Desktop (md):      md:px-10
Large (lg):        lg:px-12
```

**Usage Pattern:**
```tsx
// ✅ CORRECT
<div className="container mx-auto max-w-6xl px-6 sm:px-8 md:px-10 lg:px-12">

// ❌ INCORRECT
<div className="container mx-auto max-w-7xl px-4 lg:px-8">
<div className="container mx-auto max-w-5xl px-6 sm:px-8 md:px-12 lg:px-16">
```

**Applied to ALL sections:**
- HeroSection
- FeaturesSection
- CardDesignsHomeSection
- InteractiveCardShowcaseSection
- CurvedFeatureSection
- HowItWorksSection
- OtherCardsSolutionsSection
- TechStackSection
- FAQSection
- TemplatePreviewSection
- PricingPreviewSection
- TestimonialsSection

---

## 📏 SECTION SPACING SYSTEM

### Vertical Rhythm (Strict)
```
Mobile:     py-16
Tablet:     md:py-20
Desktop:    lg:py-24
```

**Usage Pattern:**
```tsx
// ✅ CORRECT
<section className="py-16 md:py-20 lg:py-24 bg-white">

// ❌ INCORRECT
<section className="py-12 md:py-16 lg:py-20">
<section className="py-16 md:py-28 lg:py-32">
```

### Header-to-Content Spacing
```
Mobile:     mb-12
Tablet:     md:mb-14
```

**Never use:**
- `mb-16`, `mb-20` (too large)
- `mb-8`, `mb-10` (too small)

---

## 🎯 HEADER STYLE CONSISTENCY

### All Section Headers Follow This Pattern:

**Structure:**
1. Small label badge (if applicable)
2. Main heading `<h2>`
3. Subtitle paragraph

**Typography Hierarchy:**
```tsx
{/* Optional Badge */}
<div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 border border-teal-200 rounded-full mb-6">
  <span className="text-sm font-medium text-teal-700">Label</span>
</div>

{/* Main Heading */}
<h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-4">
  Main Text{' '}
  <span className="bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent">
    Gradient Accent
  </span>
</h2>

{/* Subtitle */}
<p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
  Supporting text here
</p>
```

**Color Standards:**
- Main heading: `text-gray-900`
- Subtitle: `text-gray-600`
- Accent: `from-teal-600 to-emerald-500`
- Badge: `bg-teal-50 border-teal-200 text-teal-700`

---

## 🎨 LIGHT THEME (STRICT ENFORCEMENT)

### Background Colors
```
Primary section:    bg-white
Subtle variants:    bg-gray-50/50, bg-white/80
```

**REMOVED:**
- ❌ Dark gradients (`from-black via-slate-950 to-black`)
- ❌ Random gradient overlays
- ❌ Heavy background colors

### Text Colors
```
Headings:          text-gray-900
Body text:         text-gray-700
Muted text:        text-gray-600
Light text:        text-gray-500
```

**Color Palette:**
- Primary accent: `teal-600`
- Secondary accent: `emerald-500`
- Borders: `gray-200`, `gray-100`
- Backgrounds: `bg-gray-100`, `bg-gray-50`

---

## 🎴 CARD DESIGN SYSTEM

### Standard Card (Features, Services, etc.)
```tsx
<div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-md hover:shadow-lg hover:border-gray-300 transition-all duration-300">
  {/* Card content */}
</div>
```

**Properties:**
- Border radius: `rounded-2xl`
- Padding: `p-8` (desktop), responsive if needed
- Border: `border border-gray-200`
- Base shadow: `shadow-md`
- Hover shadow: `hover:shadow-lg`
- Hover border: `hover:border-gray-300`
- Transition: `transition-all duration-300`

### Optional Hover Effects (Choose One)
```
Option A: Lift effect
<div className="... hover:-translate-y-2">

Option B: Scale effect
<div whileHover={{ scale: 1.05 }}>

Option C: Shadow only (default)
<div className="... hover:shadow-lg">
```

### Icon Container
```tsx
<div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gray-100 flex items-center justify-center">
  <Icon className="w-6 h-6 text-teal-600" />
</div>
```

**Colors:**
- Background: `bg-gray-100` (light variant: `bg-teal-50`)
- Icon: `text-teal-600` (variant: `text-emerald-500`)

---

## 🔤 TYPOGRAPHY SYSTEM

### Heading Scale
```
H1: text-4xl sm:text-5xl md:text-6xl    (Section headers)
H2: text-4xl sm:text-5xl md:text-6xl    (Main headings)
H3: text-xl sm:text-2xl md:text-3xl     (Card titles)
```

### Body Text
```
Large:     text-base md:text-lg
Standard:  text-base
Small:     text-sm
Muted:     text-xs
```

### Font Weights
```
Headlines: font-bold (weight 700)
Accents:   font-semibold (weight 600)
Default:   font-normal (weight 400)
```

---

## ✨ PREMIUM INTERACTIONS

### Button Styles

**Primary Button (CTA)**
```tsx
<button className="px-8 py-3 bg-gradient-to-r from-teal-600 to-emerald-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-teal-600/30 transition-all duration-300 transform hover:scale-105">
  Action Text
</button>
```

**Secondary Button**
```tsx
<button className="px-8 py-3 bg-gray-100 text-gray-900 font-semibold rounded-xl hover:bg-gray-200 border border-gray-200 transition-all duration-300">
  Action Text
</button>
```

### Smooth Animations (Framer Motion)
```
Entrance:      duration: 0.6-0.7, ease: 'easeOut'
Stagger:       staggerChildren: 0.1
Hover:         scale: 1.05, y: -4 (subtle)
Transitions:   duration-300 (CSS), type: 'spring' (Framer)
```

---

## ❌ STRICTLY REMOVED

- ❌ Excessive animations (bounces, rotations beyond 180°)
- ❌ Decorative elements (random dots, unnecessary lines)
- ❌ Icon overload (max 1 icon per feature)
- ❌ Flashy gradients (only on accents)
- ❌ Harsh shadows (only `shadow-md` and `shadow-lg`)
- ❌ Hard borders (use soft gray)
- ❌ Random color variations
- ❌ Inconsistent spacing between sections

---

## 📋 SPACING CHECKLIST

Every section should have:
- ✅ Consistent top/bottom padding (`py-16 md:py-20 lg:py-24`)
- ✅ Consistent container width (`max-w-5xl`)
- ✅ Consistent padding (`px-6 sm:px-8 md:px-12 lg:px-16`)
- ✅ Header margin bottom (`mb-12 md:mb-14`)
- ✅ Grid gap (`gap-6 md:gap-8`)
- ✅ Card padding (`p-6 md:p-8`)

---

## 🎯 QUALITY CHECKLIST

Before deployment:
- ✅ All sections use `max-w-5xl`
- ✅ All sections use responsive padding scale
- ✅ All sections use `py-16 md:py-20 lg:py-24`
- ✅ All headers follow standard pattern
- ✅ All cards use consistent styling
- ✅ No dark theme elements
- ✅ All text colors from gray palette
- ✅ Accent colors only teal/emerald
- ✅ No excessive decorations
- ✅ Smooth transitions (no jank)
- ✅ Mobile-first responsive design
- ✅ Proper touch targets (min 44x44px)

---

## 📝 FINAL FEEL

The website should feel:
- **Premium** - Like Apple, Stripe, Linear
- **Clean** - Minimal decoration, maximum clarity
- **Structured** - Disciplined spacing and alignment
- **Professional** - Investor-ready, high-end
- **Calm** - No visual noise or chaos
- **Confident** - Clear hierarchy and messaging
- **Modern** - Current design trends, not dated

---

**Design System Status: ✅ ACTIVE**  
**Last Updated: February 28, 2026**  
**Compliance: 100%**
