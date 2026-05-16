# Car Rental Client — Graphic Charter

> Single source of truth for all visual decisions.
> Apply every token via CSS custom properties in `globals.css` — never hardcode values in components.

---

## 1. Brand Identity

| Attribute | Value |
|---|---|
| Product name | Car Rental |
| Industry | Vehicle rental & fleet management |
| Tone | Professional · Trustworthy · Dynamic |
| Visual style | Modern flat UI, clean lines, generous whitespace |

---

## 2. Color Palette

### Primary — Deep Navy

Conveys trust, reliability, and authority. Used for primary actions, active states, and the sidebar.

| Token | Hex | Usage |
|---|---|---|
| `primary` | `#1E3A5F` | Buttons, links, active nav items |
| `primary-light` | `#2D5F9E` | Hover states |
| `primary-dark` | `#152D49` | Pressed/active states |
| `primary-foreground` | `#FFFFFF` | Text on primary backgrounds |

### Accent — Vivid Orange

Conveys energy and urgency. Used only for high-priority CTAs, badges, and highlights.

| Token | Hex | Usage |
|---|---|---|
| `accent` | `#E8601C` | Primary CTA buttons, key badges |
| `accent-foreground` | `#FFFFFF` | Text on accent backgrounds |
| `accent-light` | `#F59452` | Hover on accent |

### Neutrals — Cool Gray Scale

| Token | Hex | Usage |
|---|---|---|
| `background` | `#F8FAFC` | Page background |
| `foreground` | `#0F172A` | Body text, headings |
| `card` | `#FFFFFF` | Card surfaces |
| `muted` | `#F1F5F9` | Subtle backgrounds, table zebra rows |
| `muted-foreground` | `#64748B` | Captions, secondary text, placeholders |
| `border` | `#E2E8F0` | Card borders, dividers, input borders |
| `input` | `#E2E8F0` | Form input borders |
| `ring` | `#93C5FD` | Focus rings (light blue, accessible) |

### Semantic Colors

| Token | Hex | Usage |
|---|---|---|
| `success` | `#16A34A` | Available vehicle, confirmed booking |
| `warning` | `#D97706` | Pending, maintenance due |
| `destructive` | `#DC2626` | Unavailable, cancellations, errors |
| `info` | `#2D5F9E` | Informational banners |

### Sidebar

| Token | Hex | Usage |
|---|---|---|
| `sidebar` | `#1E3A5F` | Sidebar background |
| `sidebar-hover` | `#2D5F9E` | Item hover |
| `sidebar-active` | `#2D5F9E` | Active item background |
| `sidebar-accent-border` | `#E8601C` | Active item left indicator |
| `sidebar-text` | `#E2E8F0` | Default nav text |
| `sidebar-border` | `#152D49` | Sidebar inner borders |

### Dark Mode Adjustments

In dark mode the navy palette inverts: the background becomes very dark navy,
cards become mid-dark navy, and the primary becomes a lighter accessible blue.
The orange accent stays unchanged (high contrast on dark).

| Token (dark) | Hex | 
|---|---|
| `background` | `#0F1929` |
| `card` | `#1A2942` |
| `popover` | `#1F3250` |
| `primary` | `#60A5FA` |
| `primary-foreground` | `#0F1929` |
| `muted` | `#243B5E` |
| `muted-foreground` | `#94A3B8` |
| `border` | `rgba(255,255,255,0.10)` |

---

## 3. Typography

### Font Stack

```
Primary: Inter, system-ui, sans-serif
Mono: "Geist Mono", "JetBrains Mono", monospace (code blocks, IDs, plate numbers)
```

### Scale & Weight

| Role | Size | Weight | Line height | Letter spacing |
|---|---|---|---|---|
| Display / Page title | 2rem (32px) | 700 | 1.2 | -0.03em |
| Section heading (H2) | 1.5rem (24px) | 600 | 1.25 | -0.02em |
| Sub-heading (H3) | 1.25rem (20px) | 600 | 1.3 | -0.01em |
| Card title | 1rem (16px) | 600 | 1.4 | 0 |
| Body default | 0.875rem (14px) | 400 | 1.6 | 0 |
| Label / Caption | 0.75rem (12px) | 500 | 1.5 | 0.02em |
| Table cell | 0.875rem (14px) | 400 | 1.4 | 0 |
| Button | 0.875rem (14px) | 500 | 1 | 0.01em |

### Rules

- Headings are always `foreground` (dark navy on light, off-white on dark).
- Use `muted-foreground` for captions, helper text, and timestamps.
- Do not go below 12px (0.75rem) for any visible text.
- License plate numbers, vehicle IDs → monospace font.

---

## 4. Border Radius

| Token | Value | Usage |
|---|---|---|
| `radius-sm` | `4px` | Badges, tags, small inputs |
| `radius` (default) | `8px` | Buttons, inputs, small cards |
| `radius-md` | `10px` | Dropdowns, popovers |
| `radius-lg` | `12px` | Cards, modals, dialogs |
| `radius-xl` | `16px` | Large panels, hero sections |
| `radius-full` | `9999px` | Avatars, pill badges |

---

## 5. Shadows

| Name | Value | Usage |
|---|---|---|
| `shadow-sm` | `0 1px 3px rgba(15,23,42,0.08)` | Cards at rest, inputs |
| `shadow-md` | `0 4px 12px rgba(15,23,42,0.10)` | Dropdowns, popovers, hover cards |
| `shadow-lg` | `0 8px 24px rgba(15,23,42,0.12)` | Modals, dialogs |
| `shadow-xl` | `0 16px 40px rgba(15,23,42,0.15)` | Full-page overlays |

Shadows use the `foreground` color (dark navy) at low opacity — they look correct in both light and dark modes.

---

## 6. Spacing System

4px base grid. All spacing values are multiples of 4px.

| Size | Value | Usage |
|---|---|---|
| `xs` | 4px | Gap between icon and label |
| `sm` | 8px | Internal padding of small components |
| `md` | 16px | Card padding, form field gap |
| `lg` | 24px | Section gap, modal padding |
| `xl` | 32px | Page section separation |
| `2xl` | 48px | Major layout gaps |

---

## 7. Iconography

- Library: **Tabler Icons** (`@tabler/icons-react`) — primary icon set.
- Size defaults: `16px` inline text, `20px` nav items, `24px` section icons.
- Icons are always `currentColor` — never hardcoded colors.
- Stroke width: `1.5` (Tabler default — do not change).
- Prefer outline icons. Use filled variants only for active/selected states.

---

## 8. Interactive States

| State | Visual treatment |
|---|---|
| Default | Base color per token |
| Hover | 10% darker background or `primary-light` |
| Focus | `ring` border (`#93C5FD`, 2px) — always visible |
| Active/Pressed | 15% darker, slight scale(0.98) |
| Disabled | `opacity: 0.4`, `cursor: not-allowed` |
| Loading | Skeleton pulse or spinner in `muted-foreground` |

---

## 9. Component Conventions

### Buttons

| Variant | Background | Text | Border | Usage |
|---|---|---|---|---|
| `default` (Primary) | `primary` (#1E3A5F) | white | none | Main actions |
| `accent` | `#E8601C` | white | none | Most important CTA only |
| `outline` | transparent | `foreground` | `border` | Secondary actions |
| `ghost` | transparent | `foreground` | none | Icon buttons, subtle actions |
| `destructive` | `#DC2626` | white | none | Delete, cancel |

### Status Badges (vehicle / rental status)

| Status | Color | Background |
|---|---|---|
| Available | `#16A34A` | `#F0FDF4` |
| Rented | `#2D5F9E` | `#EFF6FF` |
| Maintenance | `#D97706` | `#FFFBEB` |
| Unavailable | `#DC2626` | `#FEF2F2` |
| Reserved | `#7C3AED` | `#F5F3FF` |

### Cards

- Background: `card` (white)
- Border: `1px solid border`
- Border radius: `radius-lg` (12px)
- Shadow: `shadow-sm` at rest, `shadow-md` on hover
- Padding: 24px

### Data Tables

- Header background: `muted` (`#F1F5F9`)
- Row hover: `muted` at 60% opacity
- Border: `border` on bottom of each row
- Sticky header: yes, `z-index: 10`

---

## 10. Implementation Reference

The theme is applied via:
- CSS custom properties in `src/app/globals.css` (light + dark tokens)
- Sidebar and layout overrides in `src/app/theme.css` under `.theme-car-rental`
- Active theme set in `src/app/layout.tsx` → `activeThemeValue = 'car-rental'`
- Theme class applied to `<body>` by `src/components/custom/ThemeInitialize.tsx`
