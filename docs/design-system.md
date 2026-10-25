# Ledgce Design System Specification
## Monochromatic Financial Infrastructure | Starlink-Inspired Restraint

---

## 1. Visual Philosophy & Identity

**Ledgce** is a developer-oriented, high-integrity financial ledger engine. Its visual identity translates the restraint, precision, and photographic authority of Starlink's web experience into financial software.

### Core Tenets:
- **Monochromatic Purity**: The palette is strictly black, white, and neutral grays. Semantic state is conveyed via typography, shape, iconography, and position—never by loud decorative colors.
- **Typographic Authority**: Clean DIN-like technical hierarchy (NeoDIN fallback stack) with tabular numerals (`tabular-nums`) for all monetary values, sequence counts, and timestamps.
- **Architectural Transparency**: Telemetry, invariants ($\sum\text{debits} = \sum\text{credits}$), queue lag, and audit traces are surfaced directly.
- **Restrained Motion**: Fast, physics-aligned micro-transitions (120–200ms) with full `prefers-reduced-motion` compliance.

---

## 2. Token Architecture

### 2.1 Color Tokens

```css
:root {
  --color-black: #000000;
  --color-background: #050505;
  --color-surface: #0D0D0D;
  --color-surface-raised: #141414;
  --color-surface-hover: #1B1B1B;

  --color-border: #262626;
  --color-border-strong: #3A3A3A;

  --color-white: #FFFFFF;
  --color-text-primary: #F5F5F5;
  --color-text-secondary: #A3A3A3;
  --color-text-muted: #737373;

  --color-positive: #E5E5E5;
  --color-negative: #B8B8B8;
  --color-warning: #D4D4D4;
  --color-focus: #FFFFFF;
}
```

### 2.2 Typography Stack

```css
:root {
  --font-display: "NeoDIN", "DIN Next", "Barlow Semi Condensed", "Arial", sans-serif;
  --font-body: "NeoDIN", "DIN Next", "Barlow Semi Condensed", "Arial", sans-serif;
  --font-mono: "SFMono-Regular", "Cascadia Code", "Roboto Mono", "JetBrains Mono", monospace;
}
```

### 2.3 Typographic Scale

| Level | Size | Weight | Line Height | Tracking | Application |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display Hero** | 56–72px | 700 | 1.05 | `-0.03em` | Public landing page primary headline |
| **Page Title** | 32–40px | 700 | 1.15 | `-0.02em` | Main view headers |
| **Section Title**| 20–24px | 600 | 1.25 | `-0.01em` | Panel titles, modal headers |
| **Card Header**  | 15–17px | 600 | 1.35 | `0.02em` | Operational card labels |
| **Body Large**   | 15–16px | 400 | 1.50 | `0.00em` | Editorial storytelling descriptions |
| **Body Regular** | 13–14px | 400 | 1.50 | `0.00em` | Table data, form inputs, feedback |
| **Metadata**     | 11–12px | 500 | 1.40 | `0.05em` | Status pills, badge text, tooltips |
| **Technical ID** | 11–13px | 400 | 1.20 | `0.00em` | UUIDs, hashes, sequence numbers (Mono) |

---

## 3. Component Primitives

1. **Button**:
   - `primary`: Solid white `#FFFFFF` text `#000000`, crisp hover state.
   - `secondary`: Subtle `#141414` surface with `#262626` border and `#F5F5F5` text.
   - `outline`: Transparent with hairline white border.
   - `ghost`: Transparent with subtle hover wash.
2. **Card & Surface**:
   - Flat solid `#0D0D0D` with `#262626` 1px border. No heavy drop-shadows or saturated glows.
3. **Badge / Status Pill**:
   - Compact rounded container with text label, icon, and monochromatic tonal fill (`#141414` / `#262626`).
4. **Data Table**:
   - High-density tabular rows, subtle `#1B1B1B` hover state, explicit column alignments (monospaced numeric values right-aligned).

---

## 4. Accessibility & Motion

- **Contrast Ratio**: Primary text `#F5F5F5` against `#050505` achieves 18.2:1 (exceeding WCAG AAA 7:1).
- **Reduced Motion**: Disables all layout translation transitions when `prefers-reduced-motion: reduce` is detected.
- **Focus Rings**: Pure white `2px` outline with `2px` offset on all interactive controls.
