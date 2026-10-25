# Ledgce Design System Specification

## 1. Product Visual Direction

**Ledgce** unifies two complementary visual languages:
1. **SpaceX / Starlink Compositional Authority** (applied to the public landing page, system story, and technical manifestos):
   - Generous negative space, editorial type contrast, high typographic hierarchy, calm cinematic confidence, and clear architectural diagrams without decorative noise.
2. **High-Density Fintech Precision** (applied to the authenticated operational workspace):
   - Deep navy/charcoal operational surfaces (`#090B12`, `#111522`, `#171C2C`), crisp hairline borders (`rgba(255,255,255,0.09)`), tabular figures for all numeric financial data (`tabular-nums font-mono`), and zero visual fiction.

---

## 2. Color System Tokens

The design system is built upon semantic CSS variables and Tailwind utility tokens:

| Token | Hex / Value | Semantic Role |
| :--- | :--- | :--- |
| `canvas` / `app-bg` | `#090B12` | Root dark application background |
| `surface-primary` | `#111522` | Cards, table containers, topbar |
| `surface-secondary` | `#171C2C` | Sidebar navigation, secondary panels |
| `surface-elevated` | `#20263A` | Modals, floating dropdowns, popovers |
| `surface-muted` | `#1E2538` | Hover states, table row alternating tint |
| `text-primary` | `#F4F6FC` | High-contrast headings, primary balances |
| `text-secondary` | `#9BA5BC` | Metadata, micro-labels, descriptions |
| `text-muted` | `#5D6882` | Disabled controls, table footer captions |
| `border-subtle` | `rgba(255, 255, 255, 0.09)` | Standard container dividers and card outlines |
| `border-strong` | `rgba(255, 255, 255, 0.18)` | Interactive input borders, active tabs |
| `accent-primary` | `#526CFF` | Primary action buttons, active navigation markers |
| `accent-secondary` | `#7588FF` | Secondary hover highlights, link hovers |
| `state-positive` | `#35D6A0` | Invariant balance preservation ($\Sigma=0.00$), credits |
| `state-warning` | `#F2B85C` | Inactive accounts, approaching limits, retries |
| `state-error` | `#FF6B78` | Debits, validation errors, DLQ dead-letters |
| `state-info` | `#526CFF` | Reversal audit tags, system notices |

---

## 3. Typography Scale & Roles

Font families:
- **Primary Body & Display**: `Inter, system-ui, -apple-system, sans-serif`
- **Monospace & Financial Tabular Data**: `JetBrains Mono, ui-monospace, SFMono-Regular, monospace` with `font-variant-numeric: tabular-nums`

| Role | Font Size | Line Height | Weight | Tracking | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Display Hero | 48px (`text-5xl`) | 1.1 | 700 / Bold | `-0.03em` | Landing page main headline |
| H1 Page Title | 24px (`text-2xl`) | 1.25 | 600 / SemiBold | `-0.02em` | Workspace screen titles |
| H2 Section Heading| 18px (`text-lg`) | 1.35 | 600 / SemiBold | `-0.01em` | Card titles, modal headers |
| Body Default | 14px (`text-sm`) | 1.5 | 400 / Normal | Normal | General reading, descriptions |
| Micro-Label | 11px (`text-xs`) | 1.3 | 600 / SemiBold | `0.05em` (Caps) | Starlink-style metric tiles |
| Tabular Numbers | 14px / 20px | 1.2 | 500 / Medium | Normal | Currency balances, amounts |

---

## 4. Spacing Scale, Borders & Radius

- **Base Unit**: 4px grid.
  - Spacing steps: `p-1` (4px), `p-2` (8px), `p-3` (12px), `p-4` (16px), `p-6` (24px), `p-8` (32px).
- **Border Radius**:
  - Small elements (Badges, buttons, inputs): `rounded-md` (6px).
  - Cards & Table containers: `rounded-xl` (12px).
  - Floating Modals: `rounded-2xl` (16px).
- **Elevation / Shadows**:
  - Cards: `shadow-[0_4px_24px_-2px_rgba(0,0,0,0.5)]`
  - Elevated Modals: `shadow-[0_16px_48px_-4px_rgba(0,0,0,0.7)]`

---

## 5. Navigation & Layout Patterns

- **Topbar**:
  - Persistent 56px height bar across the operational application.
  - Left: Active route title and breadcrumb.
  - Center: Live Ledger Invariant Pill (`INVARIANTS PRESERVED Σ=0.00`) with pulsing indicator dot.
  - Right: Environment badge (`LOCAL DEV`) and Quick Audit Trigger.
- **Sidebar**:
  - Persistent 240px desktop width.
  - Route groups: Core Ledger, Integrity & Outbox, Infrastructure & Diagnostics.
  - Active links display a high-contrast background (`rgba(82, 108, 255, 0.15)`) with accent border highlight.
- **Responsive Navigation**:
  - Collapses into a slide-over mobile drawer on screens $< 1024\text{px}$.

---

## 6. Motion & Animation Tokens

- **Hover / Focus**: `150ms ease-out` (color, border, and opacity transitions).
- **Modal / Dropdown Reveal**: `200ms cubic-bezier(0.16, 1, 0.3, 1)` (scale 0.98 to 1.0 with fade).
- **Toast Notifications**: `250ms cubic-bezier(0.16, 1, 0.3, 1)` (slide in from top-right).
- **Reduced Motion Support**:
  - Explicit `@media (prefers-reduced-motion: reduce)` rules disable transform translations and pulse animations, providing instantaneous state transitions.

---

## 7. Component Inventory

1. **`Button`**: High-contrast primary (white-on-dark), secondary, outline, ghost, and danger variants with disabled and loading spinner states.
2. **`Card` & `MetricTile`**: High-contrast container featuring micro-labels, tabular metric figures, and trend indicators.
3. **`Table`**: Dense tabular view with row hover highlights, monospace transaction IDs, and debit/credit alignment.
4. **`Badge`**: Compact tag with semantic colors (positive, warning, error, neutral) and pulsing dot.
5. **`Modal`**: Keyboard-accessible dialog (`ESC` key listener, backdrop blur, focus trapping).
6. **`Tabs`**: Segmented control for filtering across customer/system accounts, debit/credit sides, and outbox statuses.
7. **`Toast`**: Floating non-blocking feedback with auto-dismiss (4000ms).
