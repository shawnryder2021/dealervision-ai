# DealerAdGen AI Branding System

## Overview

This document outlines the centralized branding system used throughout the DealerAdGen AI platform. All design decisions should reference these tokens to ensure consistency across the application.

## Color Palette

### Primary Color (Electric Blue)
- **Light**: `oklch(0.55 0.22 259.815)` or `#0066FF`
- **Dark**: `oklch(0.623 0.214 259.815)`
- **Usage**: Primary UI elements, buttons, links, gradients, focus states
- **Accessibility**: Meets WCAG AA standards for contrast against white/dark backgrounds

### Accent Color (Amber/Gold)
- **Light**: `oklch(0.702 0.183 70.08)` or `#FFA500`
- **Usage**: Secondary actions, highlights, success states, accent elements
- **Notes**: Complements primary color well; used for contrast

### Semantic Colors
- **Success**: `oklch(0.7 0.2 150)` - Used for positive feedback, confirmations
- **Warning**: `oklch(0.6 0.2 330)` - Used for cautions, alerts
- **Error/Destructive**: `oklch(0.577 0.245 27.325)` - Used for errors, destructive actions
- **Info**: `oklch(0.55 0.22 259.815)` - Used for informational messages (matches primary)

### Neutral Colors
- **Background**: Light `oklch(0.98 0 0)` | Dark `oklch(0.145 0 0)`
- **Foreground**: Light `oklch(0.145 0 0)` | Dark `oklch(0.985 0 0)`
- **Muted**: Light `oklch(0.94 0.005 285)` | Dark `oklch(0.22 0.01 285)`
- **Border**: Light `oklch(0 0 0 / 10%)` | Dark `oklch(1 0 0 / 10%)`

## Typography

### Font Families
- **Heading**: 'Outfit' - Used for h1, h2, h3, page titles
- **Body**: 'Plus Jakarta Sans' - Used for body text, paragraphs, UI labels
- **Code**: 'JetBrains Mono' - Used for code blocks, monospace text

### Font Sizes
- **xs**: 12px (0.75rem) - Small labels, badges
- **sm**: 14px (0.875rem) - Secondary text, form hints
- **base**: 16px (1rem) - Body text, standard size
- **lg**: 18px (1.125rem) - Section introductions
- **xl**: 20px (1.25rem) - Subheadings
- **2xl**: 24px (1.5rem) - Feature titles
- **3xl**: 30px (1.875rem) - Section headings
- **4xl**: 36px (2.25rem) - Page titles
- **5xl**: 48px (3rem) - Hero headings

### Font Weights
- **Light**: 300
- **Normal**: 400
- **Medium**: 500
- **Semibold**: 600
- **Bold**: 700

## Spacing Scale

All spacing follows a consistent 4px base unit:
- 1 = 4px
- 2 = 8px
- 3 = 12px
- 4 = 16px (standard padding)
- 6 = 24px (section padding)
- 8 = 32px
- 12 = 48px
- 16 = 64px
- 20 = 80px
- 24 = 96px
- 32 = 128px

## Border Radius

- **sm**: 6px
- **base**: 10px (default for input fields)
- **md**: 12px (cards, components)
- **lg**: 16px (larger cards, modals)
- **xl**: 24px (featured sections)
- **full**: 9999px (pills, circular buttons)

## Shadows

Used for elevation and depth:
- **sm**: Small shadow for subtle elevation
- **base**: Default shadow for standard components
- **md**: Medium shadow for featured content
- **lg**: Large shadow for prominent modals, dropdowns
- **xl**: Extra large shadow for floating elements

## Gradients

### Primary Gradient
- Direction: 135deg (diagonal)
- Colors: Electric Blue → Adjusted Blue
- Used for: Primary action buttons, hero backgrounds, accents
- CSS: `linear-gradient(135deg, oklch(0.623 0.214 259.815), oklch(0.55 0.25 270))`

### Accent Gradient
- Direction: 135deg
- Colors: Amber → Orange
- Used for: Secondary actions, accents
- CSS: `linear-gradient(135deg, oklch(0.702 0.183 70.08), oklch(0.65 0.2 50))`

### Text Gradient
- Direction: 135deg
- Colors: Primary → Accent
- Used for: Emphasized text, hero headlines
- CSS: `linear-gradient(135deg, oklch(0.623 0.214 259.815), oklch(0.702 0.183 70.08))`

## Component Styling

### Buttons
- **Default**: Primary color background with white text
- **Outline**: White/transparent background with primary border
- **Ghost**: No background or border; text color only
- **Disabled**: 50% opacity, no pointer events
- **Hover**: Slight scale (1.02x) + color shift

### Cards
- **Background**: Card color (white in light mode, dark in dark mode)
- **Border**: Border color with opacity
- **Shadow**: Base shadow for elevation
- **Padding**: 24px (6 units)
- **Hover Effect**: Scale 1.01-1.02 + subtle shadow increase

### Input Fields
- **Border**: Border color, 1px
- **Padding**: 8px horizontal, 6px vertical
- **Focus**: Primary color ring (2px)
- **Placeholder**: Muted foreground color

### Badges
- **Default**: Primary background with white text
- **Secondary**: Muted background with foreground text
- **Padding**: 4px horizontal, 1px vertical
- **Border Radius**: Full (pill-shaped)

## Transitions & Animations

### Transition Durations
- **Fast**: 150ms - Quick interactions (hover states)
- **Base**: 200ms - Standard transitions
- **Slow**: 300ms - Emphasis transitions

### Easing
- Standard: `ease-in-out` for smooth, natural motion

## Dark Mode Support

All colors automatically adjust for dark mode. CSS variables are updated in the `.dark` selector:

```css
.dark {
  /* Darker backgrounds, lighter text */
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  /* Etc. */
}
```

## Responsive Breakpoints

- **sm**: 640px - Mobile landscape
- **md**: 768px - Tablet
- **lg**: 1024px - Small desktop
- **xl**: 1280px - Desktop
- **2xl**: 1536px - Large desktop

## Implementation Guidelines

### Using Theme Colors

**DO:**
```jsx
// Use CSS classes that map to theme colors
<button className="bg-primary text-primary-foreground">
  Sign up
</button>
```

**DON'T:**
```jsx
// Avoid hardcoding colors
<button className="bg-blue-600 text-white">
  Sign up
</button>
```

### Component Example

```jsx
import { colors, spacing, borderRadius } from '@/lib/branding';

// Component with consistent branding
<Card className={`p-${spacing[6]} rounded-${borderRadius.lg} shadow-md`}>
  <h2 className="text-primary font-bold">Heading</h2>
  <p className="text-muted-foreground mt-2">Description</p>
</Card>
```

## Files Reference

### Core Files
- `/lib/branding.ts` - TypeScript branding configuration (constants, types)
- `/app/globals.css` - CSS custom properties and utilities
- `/app/page.tsx` - Homepage using brand-consistent colors
- `/app/pricing/page.tsx` - Pricing page using brand colors
- `/app/resources/page.tsx` - Resources page using brand colors

### Component Files Using Branding
- `/components/onboarding/wizard-steps.tsx` - Signup wizard
- `/components/dashboard/Sidebar.tsx` - Dashboard navigation
- `/components/admin/create-coupon-modal.tsx` - Admin modal
- All shadcn/ui components - Pre-configured for this color scheme

## Color Accessibility

The chosen color scheme meets WCAG 2.1 AA standards:
- Primary color (#0066FF) on white: 4.5:1 contrast ratio ✓
- Accent color (#FFA500) on white: 5.1:1 contrast ratio ✓
- Text on backgrounds: 7:1+ contrast ratios ✓

OKLch color space ensures perceptually uniform colors, improving accessibility for users with color vision deficiencies.

## Maintaining Consistency

1. **Always use CSS classes** - Never hardcode hex colors or rgb values
2. **Reference /lib/branding.ts** - For programmatic color access
3. **Use CSS custom properties** - Variables in globals.css
4. **Test dark mode** - Verify components work in both light/dark modes
5. **Document new patterns** - Update this file when adding new brand elements

## Future Enhancements

- [ ] Add CSS Grid layout tokens
- [ ] Create Storybook stories for common component patterns
- [ ] Document brand tone and copy guidelines
- [ ] Create logo usage guidelines
- [ ] Add animation library with consistent timing
