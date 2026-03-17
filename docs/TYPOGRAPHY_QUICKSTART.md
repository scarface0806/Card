# Typography System - Quick Start Guide

## 🚀 60-Second Setup

### Import Components
```tsx
import Heading from '@/components/Heading';
import Text from '@/components/Text';
```

### Use in Your Page
```tsx
export default function MyPage() {
  return (
    <div>
      <Heading as="h1">Main Title</Heading>
      <Text variant="body-lg">Introduction paragraph</Text>
      <Heading as="h2">Section</Heading>
      <Text variant="body">Body content</Text>
    </div>
  );
}
```

---

## 📖 Main Headings

```tsx
<Heading as="h1">Hero Headline (56px Desktop)</Heading>
<Heading as="h2">Section Header (40px Desktop)</Heading>
<Heading as="h3">Card Title (28px Desktop)</Heading>
```

---

## 📝 Body Text

```tsx
<Text variant="body-lg">Larger introductory text (18px)</Text>
<Text variant="body">Standard paragraph text (16px)</Text>
<Text variant="body-sm">Small labels or hints (14px)</Text>
```

---

## 🎯 Button Text

```tsx
<button className="font-sans text-button uppercase">
  Click Here
</button>
```

---

## 🌈 Color Combinations

```tsx
{/* White heading on dark background */}
<Heading as="h1">Title</Heading>  {/* auto: text-white */}

{/* Primary body text */}
<Text variant="body">Content</Text>  {/* auto: text-slate-300 */}

{/* Secondary text */}
<Text variant="body-sm">Label</Text>  {/* auto: text-slate-400 */}

{/* With custom color override */}
<Text variant="body" className="text-blue-400">
  Highlighted text
</Text>
```

---

## 🎨 Common Patterns

### Hero Section
```tsx
<section className="pt-32 pb-20">
  <Heading as="h1" className="mb-6">
    Your Product's Value
  </Heading>
  <Text variant="body-lg" className="mb-8 max-w-2xl">
    Compelling description of what you offer
  </Text>
  <button className="text-button">Get Started</button>
</section>
```

### Feature Card
```tsx
<div className="bg-slate-800/50 p-8 rounded-lg">
  <Heading as="h3" className="mb-2">
    Feature Title
  </Heading>
  <Text variant="body">
    Description of feature benefits
  </Text>
</div>
```

### Section Block
```tsx
<section>
  <Heading as="h2" className="mb-8">
    Section Title
  </Heading>
  <Text variant="body-lg" className="mb-4">
    Introduction text
  </Text>
  <Text variant="body">
    Body content with more details
  </Text>
</section>
```

### Form Field
```tsx
<div className="mb-4">
  <label className="text-body-sm font-medium block mb-2">
    Field Label
  </label>
  <input type="text" className="w-full..." />
  <p className="text-body-sm text-slate-400 mt-1">
    Helper text or validation message
  </p>
</div>
```

---

## 📐 Spacing Helpers

```tsx
{/* Use rhythm utilities for consistent spacing */}
<div className="mb-rhythm-4">  {/* 2rem */}
  <Heading as="h2">Next Section</Heading>
</div>

<div className="pt-rhythm-6 pb-rhythm-6">  {/* 3rem padding */}
  <Text variant="body">Vertically centered content</Text>
</div>

<section className="py-rhythm-12">  {/* 6rem padding */}
  Large spacing for hero sections
</section>
```

---

## 🎯 Direct Tailwind (No Components)

If you prefer not using components:

```tsx
<h1 className="text-h1 font-space-grotesk font-bold text-white">
  Heading
</h1>

<p className="text-body font-sans text-slate-300">
  Body text
</p>

<small className="text-body-sm text-slate-400">
  Small text
</small>
```

---

## ✅ Best Practices

✓ Use `<Heading>` component for all titles  
✓ Use `<Text>` component for all body copy  
✓ Maintain white headings on dark backgrounds  
✓ Use slate-300 for primary body text  
✓ Use rhythm utilities for spacing  
✓ Test responsive breakpoints  
✓ Keep line lengths ~50-75 characters  

---

## ❌ Avoid

✗ Using plain `<h1>` tags (use Heading component)  
✗ Styling text manually (use Text component)  
✗ Inconsistent heading sizes  
✗ Poor contrast colors  
✗ Too much line length (>90 characters)  
✗ Mixing font families  

---

## 📚 Complete Reference

- **Full Specs**: `TYPOGRAPHY_GUIDE.md`
- **Implementation**: `IMPLEMENTATION_SUMMARY.md`
- **Progress**: `TYPOGRAPHY_CHECKLIST.md`
- **Component**: `src/components/TypographyGuide.tsx`
- **Tokens**: `src/utils/typographyReference.ts`

---

## 🔍 Troubleshooting

**Fonts not loading?**
- Clear `.next` folder: `rm -rf .next`
- Rebuild: `npm run build`
- Check layout.tsx for font variables

**Sizes look wrong?**
- Verify class is applied (check DevTools)
- Check responsive prefixes: `md:text-h1`
- Ensure tailwind.config.ts is saved

**Colors not applying?**
- Check globals.css has CSS variables
- Verify theme configuration
- Use class directly: `text-white`, `text-slate-300`

---

## 🚀 Next Steps

1. ✅ Read `TYPOGRAPHY_GUIDE.md` for complete specs
2. ✅ Use Heading and Text components
3. ✅ Test responsive breakpoints (mobile, tablet, desktop)
4. ✅ Verify colors on dark backgrounds
5. ✅ Run build to check for errors: `npm run build`

---

**Happy styling! 🎨**

For detailed information, see `TYPOGRAPHY_IMPLEMENTATION_REPORT.md`
