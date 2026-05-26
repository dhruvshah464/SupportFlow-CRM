# Design System

SupportFlow CRM uses a design system inspired by Linear, Stripe, and Vercel — clean, minimal, and fast-feeling. This document covers the visual language: colors, typography, spacing, component styles, and animation philosophy.

---

## Table of Contents

- [Design Philosophy](#design-philosophy)
- [Color Palette](#color-palette)
- [Typography](#typography)
- [Spacing Scale](#spacing-scale)
- [Component Styles](#component-styles)
  - [Buttons](#buttons)
  - [Cards](#cards)
  - [Form Inputs](#form-inputs)
  - [Badges](#badges)
- [Animation System](#animation-system)
- [Responsive Strategy](#responsive-strategy)
- [Iconography](#iconography)
- [Background Patterns](#background-patterns)
- [Tailwind Configuration](#tailwind-configuration)

---

## Design Philosophy

### Three core principles

**1. Calm over noisy**
The interface should feel quiet. Status information is communicated through subtle color, not blinking lights or bold text. Whitespace is used generously. Typography hierarchy is clear but not dramatic.

**2. Responsive over decorative**
Animations exist to communicate state, not to entertain. A button scales when you hover because it responds to your action. A toast slides in to announce a result. Nothing spins for aesthetics.

**3. Consistency through components**
Shared visual patterns are extracted into CSS component classes in `index.css`. A button looks the same whether it's on the login page or the dashboard — no per-page style overrides.

### Inspiration

| Product | What we borrowed |
|---------|-----------------|
| **Linear** | Dense, information-rich tables; keyboard-first thinking; subtle color |
| **Stripe** | Clean white surfaces; confident blue primary; precise typography |
| **Vercel** | Dark-mode terminal aesthetic for code blocks; minimal navigation |
| **Notion** | Sidebar navigation; neutral gray palette; content-first layout |

---

## Color Palette

### Brand Colors

| Name | Hex | Tailwind Class | Usage |
|------|-----|----------------|-------|
| Brand Blue | `#2563EB` | `blue-600` | Primary CTA, active state, links |
| Brand Blue Light | `#3B82F6` | `blue-500` | Hover state for primary buttons |
| Brand Blue Dark | `#1D4ED8` | `blue-700` | Pressed state |

### Neutral Scale

The entire UI uses the `zinc` scale (not gray or slate — zinc has a very slightly warm undertone that feels less clinical).

| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| White | `#FFFFFF` | `white` | Page background, card backgrounds |
| Zinc 50 | `#FAFAFA` | `zinc-50` | Alternate section backgrounds |
| Zinc 100 | `#F4F4F5` | `zinc-100` | Subtle backgrounds |
| Zinc 200 | `#E4E4E7` | `zinc-200` | Borders, dividers |
| Zinc 300 | `#D4D4D8` | `zinc-300` | Input borders on focus |
| Zinc 400 | `#A1A1AA` | `zinc-400` | Placeholder text, muted labels |
| Zinc 500 | `#71717A` | `zinc-500` | Secondary text |
| Zinc 700 | `#3F3F46` | `zinc-700` | Body text |
| Zinc 900 | `#18181B` | `zinc-900` | Headings, primary text |

### Status Colors

Each status and priority has a semantic color with a consistent pattern:
`bg-{color}-50` background + `text-{color}-700` text + `border border-{color}-200` border.

| Status | Color | Example |
|--------|-------|---------|
| Open | Blue | `bg-blue-50 text-blue-700 border-blue-200` |
| In Progress | Amber | `bg-amber-50 text-amber-700 border-amber-200` |
| Resolved | Emerald | `bg-emerald-50 text-emerald-700 border-emerald-200` |
| Closed | Zinc | `bg-zinc-100 text-zinc-500 border-zinc-200` |

| Priority | Color | Example |
|----------|-------|---------|
| Low | Zinc | `bg-zinc-100 text-zinc-500 border-zinc-200` |
| Medium | Blue | `bg-blue-50 text-blue-700 border-blue-200` |
| High | Orange | `bg-orange-50 text-orange-700 border-orange-200` |
| Urgent | Red | `bg-red-50 text-red-700 border-red-200` |

### The Dark Exception

The landing page's final CTA section uses `bg-zinc-900` intentionally — it's the one dark section on an otherwise all-white page. The contrast creates a visual pause and signals "this is where you take action." The blue glow and rotating rings add energy without being garish.

---

## Typography

### Font Stack

```css
font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif;
```

Inter is loaded from Google Fonts (or falls back to system sans-serif). It was chosen for its:
- Exceptional legibility at small sizes
- Wide character set
- Tabular number option (numbers don't shift width between 0-9)

### Type Scale

All sizes use Tailwind's default scale (based on rem):

| Name | Size | Tailwind | Usage |
|------|------|----------|-------|
| xs | 12px | `text-xs` | Badges, timestamps, fine print |
| sm | 14px | `text-sm` | Body text, labels, secondary info |
| base | 16px | `text-base` | Default body text |
| lg | 18px | `text-lg` | Section subtitles |
| xl | 20px | `text-xl` | Card headings |
| 2xl | 24px | `text-2xl` | Page headings |
| 3xl | 30px | `text-3xl` | Section headings |
| 4xl | 36px | `text-4xl` | Landing page headings |
| 5xl | 48px | `text-5xl` | Hero headline (desktop) |
| 6xl | 60px | `text-6xl` | Hero headline (large desktop) |

### Font Weight

| Weight | Tailwind | Usage |
|--------|----------|-------|
| 400 normal | `font-normal` | Body text |
| 500 medium | `font-medium` | Labels, navigation |
| 600 semibold | `font-semibold` | Subheadings, button text |
| 700 bold | `font-bold` | Page titles, hero headings |
| 800 extrabold | `font-extrabold` | Landing hero (rare) |

### Letter Spacing

Section labels use `tracking-widest` (very wide letter spacing) at small size and uppercase to create visual hierarchy without increasing font weight:

```
FEATURES              ← text-xs font-semibold uppercase tracking-widest text-blue-600
```

This pattern (seen on Stripe, Vercel, etc.) signals a section label and provides clear visual separation from body text.

---

## Spacing Scale

All spacing uses Tailwind's default 4px base unit. Common patterns:

| Value | px | Usage |
|-------|----|-------|
| 1 | 4px | Fine-grained internal spacing |
| 2 | 8px | Between icon and text |
| 3 | 12px | Button padding (vertical) |
| 4 | 16px | Default gap, input padding |
| 5 | 20px | Card internal padding |
| 6 | 24px | Between card sections |
| 8 | 32px | Section internal padding |
| 10 | 40px | Between major elements |
| 12 | 48px | Large gaps |
| 16 | 64px | Section padding (small screens) |
| 20 | 80px | Section padding (medium screens) |
| 28 | 112px | Hero section padding (large screens) |

### Content Width

The maximum content width is `max-w-7xl` (1280px) centered with auto margins. Inside this, layouts use 4-5 column grids with responsive breakpoints.

---

## Component Styles

All shared component styles are defined in `frontend/src/index.css` inside `@layer components`. This means they're part of Tailwind's layer and can be overridden with utility classes.

### Buttons

**Primary Button** `.btn-primary`

```css
.btn-primary {
  @apply inline-flex items-center gap-2 px-4 py-2
         bg-blue-600 hover:bg-blue-700 active:bg-blue-800
         text-white font-semibold text-sm
         rounded-xl transition-all duration-150
         shadow-sm hover:shadow-md
         disabled:opacity-50 disabled:cursor-not-allowed;
}
```

Usage: Submit forms, primary actions ("Save ticket", "Create ticket")

**Secondary Button** `.btn-secondary`

```css
.btn-secondary {
  @apply inline-flex items-center gap-2 px-4 py-2
         bg-white hover:bg-zinc-50
         border border-zinc-200 hover:border-zinc-300
         text-zinc-700 font-medium text-sm
         rounded-xl transition-all duration-150;
}
```

Usage: Cancel, secondary actions ("Back", "Clear filters")

**Destructive Button** (inline utility)

```
bg-red-50 hover:bg-red-100 text-red-600 border border-red-200
```

Usage: Delete actions. Not extracted to a component class because it's used rarely and the semantic intent (danger) should be explicit in the source.

### Cards

`.card`

```css
.card {
  @apply bg-white border border-zinc-200 rounded-2xl
         shadow-sm hover:shadow-md
         transition-all duration-200;
}
```

Cards are used everywhere: dashboard stat cards, landing page feature cards, testimonials, the ticket detail panels.

The `rounded-2xl` (16px) radius is more generous than typical UI components (often 8px). This gives a softer, more premium feel — consistent with Linear and Stripe's aesthetic.

### Form Inputs

`.input`

```css
.input {
  @apply w-full px-3 py-2
         bg-white border border-zinc-200
         rounded-xl text-sm text-zinc-900
         placeholder:text-zinc-400
         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
         transition-all duration-150;
}
```

Focus state uses a blue ring (`focus:ring-2 focus:ring-blue-500`) rather than a thicker border. This is cleaner and avoids layout shift (the ring doesn't affect element size).

Select dropdowns use the same `.input` class — consistent styling across all form controls.

### Badges

Status and priority badges share a base `.badge` class:

```css
.badge {
  @apply inline-flex items-center px-2 py-0.5
         text-xs font-medium rounded-full
         border;
}
```

Each value adds its own color classes:

```css
.badge-open        { @apply bg-blue-50 text-blue-700 border-blue-200; }
.badge-in_progress { @apply bg-amber-50 text-amber-700 border-amber-200; }
.badge-resolved    { @apply bg-emerald-50 text-emerald-700 border-emerald-200; }
.badge-closed      { @apply bg-zinc-100 text-zinc-500 border-zinc-200; }

.badge-low         { @apply bg-zinc-100 text-zinc-500 border-zinc-200; }
.badge-medium      { @apply bg-blue-50 text-blue-700 border-blue-200; }
.badge-high        { @apply bg-orange-50 text-orange-700 border-orange-200; }
.badge-urgent      { @apply bg-red-50 text-red-700 border-red-200; }
```

Usage:
```jsx
<span className={`badge badge-${ticket.status}`}>
  {ticket.status.replace("_", " ")}
</span>
```

The three-layer badge style (colored background + colored text + colored border) is Stripe's pattern for semantic labels — it communicates meaning through color without relying on the user knowing what the label says.

---

## Animation System

### Principles

- **Duration:** 150-300ms for UI interactions (hover, press), 500-700ms for enter animations
- **Easing:** `ease-out` for entering elements, `ease-in` for exiting — matches natural physics
- **Distance:** Enter from 16-24px below or above, not dramatic slides

### Framer Motion Patterns

**Page section fade-in (landing page):**
```jsx
<motion.div
  initial={{ opacity: 0, y: 24 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
  transition={{ duration: 0.6, ease: "easeOut" }}
>
```

**Card hover lift:**
```jsx
<motion.div
  whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
  transition={{ duration: 0.15 }}
>
```

**Toast enter/exit:**
```jsx
<AnimatePresence>
  {toasts.map((toast) => (
    <motion.div
      key={toast.id}
      initial={{ opacity: 0, x: 48, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 48, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
```

**Staggered children (feature grid):**
```jsx
{features.map((feature, i) => (
  <motion.div
    key={i}
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay: i * 0.08 }}
  >
```

### CSS Animations (non-Framer)

The landing page's FinalCTA section uses CSS animations for the rotating rings (performance benefit — CSS animations run on the compositor thread):

```css
@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-spin-slow {
  animation: spin-slow 20s linear infinite;
}
```

Defined in `tailwind.config.js`:
```javascript
extend: {
  animation: {
    "spin-slow": "spin 20s linear infinite",
  },
}
```

---

## Responsive Strategy

All layouts use **mobile-first** Tailwind classes. Base styles target mobile; responsive prefixes add desktop styles:

```jsx
// Mobile: full width, stacked
// Tablet: 2 columns
// Desktop: 3 columns
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
```

### Breakpoints

| Prefix | Min Width | Typical Target |
|--------|-----------|----------------|
| (none) | 0px | Mobile (375px+) |
| `sm:` | 640px | Large mobile / small tablet |
| `md:` | 768px | Tablet |
| `lg:` | 1024px | Desktop |
| `xl:` | 1280px | Large desktop |

### Key Responsive Behaviors

**Landing page:**
- Hero headline: `text-4xl sm:text-5xl md:text-6xl` — scales up on larger screens
- Navigation: mobile shows hamburger (or simplified), desktop shows full links
- Feature grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`

**Dashboard:**
- Sidebar hidden on mobile (or becomes a drawer)
- Ticket table: horizontal scroll on small screens (`overflow-x-auto`)
- Stats row: `grid-cols-2 lg:grid-cols-4`

---

## Iconography

All icons come from **Lucide React** (`lucide-react` npm package).

Lucide icons are:
- Consistent 24px grid with 2px stroke
- Tree-shakeable (only imported icons are in the bundle)
- SVG-based (scale perfectly, style with Tailwind color classes)

Common icon usage:

```jsx
import { TicketIcon, PlusIcon, LogOutIcon, TrashIcon } from "lucide-react";

// Inline with text
<PlusIcon className="w-4 h-4" />

// Icon-only button
<TrashIcon className="w-4 h-4 text-red-500 hover:text-red-700" />
```

Standard icon sizes:
- `w-3.5 h-3.5` — inside small badges or tight spaces
- `w-4 h-4` — inline with text, standard button icons
- `w-5 h-5` — standalone actions
- `w-6 h-6` — feature icons (inside colored containers)
- `w-8 h-8` — large illustrative icons (empty states)

---

## Background Patterns

### Dot Grid

Used on the Hero section and some dashboard cards to add texture without overwhelming the content:

```css
.bg-dot-grid {
  background-image: radial-gradient(circle, rgba(0, 0, 0, 0.06) 1px, transparent 1px);
  background-size: 24px 24px;
}
```

The dark dots (`rgba(0,0,0,0.06)`) work on white/light backgrounds. A `bg-dot-grid-dark` variant uses `rgba(255,255,255,0.04)` for dark backgrounds.

### Gradient Glows

Used sparingly for depth:

```css
/* Blue glow behind hero content */
.bg-gradient-radial {
  background: radial-gradient(
    ellipse at center,
    rgba(59, 130, 246, 0.08) 0%,
    transparent 70%
  );
}
```

---

## Tailwind Configuration

The complete `tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      animation: {
        "spin-slow": "spin 20s linear infinite",
      },
      borderRadius: {
        "2xl": "1rem",  // 16px — default in Tailwind but called out explicitly
      },
    },
  },
  plugins: [],
}
```

### Why no custom color tokens?

The design relies entirely on Tailwind's built-in palette rather than defining custom color tokens. This approach:
- Eliminates the need to memorize custom color names
- Ensures colors are predictable and consistent with Tailwind's harmonious palette
- Makes it easy for new contributors to understand the styles at a glance

The brand blue is simply `blue-600` — named and understood by anyone who knows Tailwind.
