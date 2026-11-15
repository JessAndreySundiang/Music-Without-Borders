# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/community-music-band/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Community Music Band
**Direction:** "Golden Hour at the Bandstand"
**Stack:** React 19 + TypeScript + Vite + **Tailwind CSS v4** (utility-first; there is no
hand-written component CSS)
**Approach:** Warm, accessible non-profit site. Adapted from the ui-ux-pro-max `--design-system`
output (which suggested a generic community-purple / Minimalism system) toward the skill's
`Music Instrument Learning` color reasoning and a serif + sans editorial pairing that better
fits a volunteer concert band.

---

## Global Rules

### Theme mechanism

The theme is **token-driven**, not class-driven.

- Every colour lives in `src/index.css` as a CSS custom property on `:root` (Daytime) or
  `[data-theme="dark"]` (Evening).
- `data-theme` is set on `<html>`. An inline script in `index.html` applies it before first paint
  from `localStorage["cmb-theme"]`; the default is **dark (Evening)**.
- **Components never branch on the theme.** They use utilities such as `bg-paper`, `text-muted`,
  `border-line`, and the value flips by itself.
- `@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *))` has **zero
  specificity**. Never rely on a `dark:` utility to override a base utility of the same property —
  add a flipping token instead.

### Colour palette

All values below are the real tokens in `src/index.css`. Body and UI pairings clear WCAG AA
(4.5:1). The only exception is the Daytime display headline gradient, which is large text and
clears the 3:1 large-text threshold.

| Role | Variable | Daytime (light) | Evening (dark) |
|------|----------|-----------------|----------------|
| Page background | `--paper` | `#f6f1e7` | `#070d19` |
| Tinted section | `--paper-2` | `#ece3d3` | `#0d1626` |
| Card surface | `--surface` | `#fffcf6` | `#142035` |
| Headings | `--ink` | `#12203a` | `#f7f9fd` |
| Body text | `--body` | `#26344e` | `#e4eaf4` |
| Muted text | `--muted` | `#59657c` | `#a5b1c6` |
| Hairline / border | `--line` | `rgba(18,32,58,.14)` | `rgba(230,237,249,.14)` |
| Brass accent (text) | `--brass` | `#75510c` | `#e7be67` |
| Brass fill (buttons) | `--brass-bright` | `#d8a63a` | `#e0a92e` |
| Terracotta accent | `--plume` | `#9e3f2f` | `#ff9b85` |
| Hero gradient | `--stage-grad-from/mid/to` | `#fbf5e8 → #f3e8d4 → #e7d3ae` | `#060b15 → #0b1528 → #10233b` |
| On-hero text | `--stage-fg` / `--stage-muted` | navy / 72% navy | white / 72% white |
| Gold gradient headline | `--title-from` / `--title-to` | `#75510c → #946009` | `#fde9b8 → #e8b648` |
| Floating nav | `--nav` / `--nav-line` / `--nav-hover` | white 88% | navy 78% |
| Ambient wash | `--band-a` / `--band-b` | gold / terracotta tint | transparent |

**Contrast notes:**

- Gold text on cream uses `--brass` (Daytime), never `--brass-bright`. The bright value is for
  **fills** (with `text-night-950` on top) and for text on navy. Daytime brass measures **6.35:1**
  on paper and **4.88:1** on the darkest hero stop.
- Muted body copy clears AA in both themes: **5.21:1** Daytime and **8.98:1** Evening against the
  page background. Hero muted copy measures **5.35:1** (Daytime) and **8.75:1** (Evening).
- The Daytime gradient headline ends at **3.64:1** on the darkest hero stop. It is only used for
  large display headings, so it clears the 3:1 large-text requirement.
- **Gold-on-gold rule:** the gold logo must sit on a non-gold ground. Brand badges in the navbar and
  footer use a navy "seal" (`bg-night-950 ring-1 ring-brass/50`), which measures **11.4:1**.
- The hero medallion flips too: ivory disc in Daytime, brass gradient in Evening.
- Daytime deliberately keeps only a light `--band-*` wash so the page is not too bright; Evening
  bands are flat.

### Typography

- **Heading Font:** Fraunces (opsz serif) — warm, editorial, concert-program feel
- **Body Font:** DM Sans
- Loaded with `<link rel="preconnect">` + a stylesheet link in `index.html` — **not** a CSS
  `@import`, which blocks rendering.
- Google Fonts: `https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&display=swap`

### Spacing & Shape

Tailwind's default scale. Conventions used across the site:

- Container: `mx-auto w-full max-w-6xl px-5`
- Section rhythm: `py-16 md:py-20` (hero `py-16 lg:py-24`)
- Card radii: `rounded-2xl` / `rounded-3xl`; pills are `rounded-full`
- Easing: `duration-200` for colour, `duration-300` for transforms/menus
- Micro-interactions: `hover:-translate-y-0.5` / `hover:-translate-y-1`, arrows slide with
  `group-hover:translate-x-1`

---

## Component Specs

Everything is a typed function component with Tailwind utilities; repeated items come from typed
arrays in `src/data/landing.ts`.

- **Navbar**: sticky floating pill (`bg-nav backdrop-blur-xl`). Desktop links + Donate CTA; the CTA
  is hidden while the visitor is already on `/donate`. The collapsed mobile panel uses `inert` +
  `aria-hidden` so its links leave the tab order, Escape closes it, and focus returns to the toggle.
- **Footer**: four columns (brand + socials, pages, rehearsals, contact) from `src/data/landing.ts`.
- **PageHero**: `stage` gradient band with staff-line overlay, used by every non-home page.
- **Cards** (`MetricCard`, `ProgramCard`, `EventCard`, `TestimonialCard`, `ProfileCard`): `bg-surface`,
  1px `border-line`, `shadow-sm`, hover lift with a brass border. Testimonials are a uniform
  `grid sm:grid-cols-2 lg:grid-cols-3` with `flex h-full flex-col` and `mt-auto` footers, so every
  card's bottom edge lines up.
- **Icons**: single inline-SVG set in `src/components/Icons.tsx` (24px grid, stroke 1.8, currentColor).
  No emoji as structural icons, no icon dependency.
- **CheckoutForm**: Stripe `CardElement` with `hidePostalCode: true` plus our own visible, required
  `ZIP / Postal code` field (the iframe clips Stripe's own postal box). Theme-aware Stripe styling,
  20s request timeout, ref-based double-submit guard, and a per-attempt idempotency key.

---

## Style Guidelines

**Style:** Warm editorial / accessible & ethical. High contrast, 16px+ body, visible focus,
reduced-motion safe, keyboard-friendly.

**Page Pattern:** Hero + Value prop + Key features + Social proof (Voices) + CTA + Footer.

---

## Anti-Patterns (Do NOT Use)

- ❌ Emojis as icons — use the shared SVG set
- ❌ Bright gold (`--brass-bright`) as text on cream — use `--brass`
- ❌ Gold logo on a gold ground
- ❌ Layout-shifting hovers that move surrounding content
- ❌ Text below 4.5:1 contrast
- ❌ Instant state changes — always transition 150–300ms
- ❌ Invisible focus states
- ❌ Reloading a closed mobile panel's links into the tab order (`opacity-0` alone is not enough)
- ❌ Branching components on `data-theme` instead of adding a token

---

## Pre-Delivery Checklist

- [x] No emojis used as icons (inline SVG set)
- [x] Consistent icon family, stroke width, sizing
- [x] Hover states with 150–300ms transitions
- [x] Light + dark mode text contrast ≥ 4.5:1
- [x] Visible focus rings for keyboard nav (skip link included)
- [x] Full site usable with a keyboard alone (including the mobile menu)
- [x] `prefers-reduced-motion` respected
- [x] No horizontal overflow at 320 / 375 / 414 / 640 / 768 / 1024
- [x] No content hidden behind the sticky navbar
- [x] `tsc -b`, `eslint .`, `vitest run` and `vite build` all pass
- [ ] Lighthouse audit re-run after the Tailwind rebuild
