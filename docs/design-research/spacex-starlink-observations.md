# Design research — SpaceX & Starlink (live observation)

> **Provenance.** This is NOT the "frontend analysis report" (Source A). That report could not be located:
> the user-supplied share link (`share.gemini.google/bdxM8paHNsIi`, and the alternate link shown on it) resolves to a generic
> Indonesian checklist titled "Panduan Bedah Sistem Front-End" (what to inspect in a front-end teardown). It contains no
> Revolut, SpaceX or Starlink findings and no color/spacing/motion values.
> This file records what a browser subagent **observed directly** on spacex.com and starlink.com on 2026-10-26
> (Chrome, 1440x900 and 390x844). Values come from computed styles, DOM inspection and screenshots.
> Motion timing was inferred from declared CSS, not from recorded video. Where the observer was unsure, it says so.

## SpaceX (https://www.spacex.com/)

**Typography**
- D-DIN (headings D-DIN-Bold), fallback Arial/Verdana. Condensed DIN-style grotesque. All headings uppercase, weight 400 on the Bold face.
- Hero H2 60px / -1px tracking. First section H2 80px / +1.6px, line-height ~1.0. Other H2 48px / +0.96px.
- Body 16/24px, weight 400, column ~416px. Nav 13px, 700, uppercase, +1.17px. Footer links 12px uppercase.
- Hero date uses a monospace face as deliberate texture contrast.
- Scale roughly 80 / 60 / 48 / 16 / 13 / 12 / 10 with very large jumps and a single body size.

**Color**
- Essentially black (#000) with off-white text rgb(240,240,250) at 0.9–1.0 opacity. No accent/brand colors, no filled buttons.
- Sections are full-bleed photo/video; text sits on imagery with dark gradient scrims.

**Layout**
- ~900px hero then ~941px sections (one viewport each). Text alternates left/right. 60–80% of each section is empty.
- Mobile: 20px side margin, H2 36px.

**Navigation**
- Fixed 74px transparent header with gradient scrim, wide-tracked wordmark, uppercase links, outlined "UPCOMING LAUNCHES" dropdown.
- Mobile: wordmark + hamburger, full-screen opaque panel.

**Scroll / motion**
- Native scroll, no scroll-snap, no scroll hijacking, no JS parallax found. Header fades on scroll (0.3s opacity).
- Motion is almost entirely autoplay muted looping video. Few CSS transitions (header 0.3s ease; dropdown 1s).

**CTAs**
- Ghost button: 50px tall, 4px radius, 1px border rgba(240,240,250,.35), bg rgba(0,0,0,.5), uppercase label + arrow.
- Hover: background-color 0.5s `cubic-bezier(0.19, 1, 0.22, 1)` (ease-out-expo).

## Starlink (https://starlink.com/us)

**Typography**
- NeoDIN (Roboto/Arial fallbacks); friendlier mixed-case DIN-style sans.
- H1 64px/700 (36px mobile). H2 48px/700, -0.5px (24px mobile). Card titles 24px/700. Plan body 14px at 0.7 opacity.
- Price figures 48px/700 with "/mo" 20px/400 at 0.7 opacity.
- Micro-labels 12px/700, +0.4px tracking, uppercase, 0.55 opacity — pattern: small label above a big number with a small muted unit.

**Color**
- #000 with rgb(250,250,250) text; secondary text via opacity 0.7 / 0.55. Cards near-black (#121212-ish); hero card is frosted glass.
- Primary CTA is near-white filled with dark text — the highest contrast element on the page.

**Layout**
- Centered ~1150px container. Hero is a 900px sticky block. Photo bands alternate with black; one split section with 8–12px radius image.
- Mobile cards stack, benefits wrap 2x2.

**Navigation**
- Fixed 101px header; after scroll it becomes a floating 1168px bar, 8px radius, `rgba(70,70,70,.35)` with `backdrop-filter: blur(50px)`.
- Header transform transition 0.32s `cubic-bezier(0.6,0,0.1,1)`. Exact show/hide trigger not isolated.
- Mobile: full-screen dark panel with grouped lists under small uppercase grey labels.

**Scroll / motion**
- Native scroll, no scroll-snap. Hero is `position: sticky`. Transitions mostly Material-UI defaults: 0.25s `cubic-bezier(0.4,0,0.2,1)` on controls;
  0.45s `cubic-bezier(0.5,0,0,1)` for card expansion; opacity fades 0.2–0.7s. No video.

**CTAs**
- White fill, rgba(0,0,0,.87) text, 14px/700, 4px radius, sentence case ("Get Started"). Mobile: 56px tall full width.

## Do NOT copy into a dense financial dashboard
1. All-caps bold tracked headings/nav (hurts scanning of labels and tables).
2. Text over photo/video with scrims (contrast varies; nothing comparable in data UI).
3. One idea per 100vh section (wastes vertical space).
4. Only a few huge type sizes with no small data styles (a dashboard needs ~11–14px with tabular numerals).
5. Near-invisible ghost buttons (1px at 35% opacity fails affordance/contrast).
6. Auto-hiding header (dashboards need persistent nav/context).
7. Always-playing background video (distracting, CPU cost, conflicts with live data).
8. Heavy `backdrop-filter: blur(50px)` (render cost, legibility).
9. Secondary text at 0.55–0.7 opacity at 12–14px on black (borderline contrast).
10. 100px+ margins and 40–48px figures (marketing scale).
11. Alternating left/right text (breaks scan lines).
12. Full-screen mobile menu takeover and 56px marketing buttons for frequent in-app navigation.

## Transfers well
- Near-black canvas with one off-white text color and opacity-stepped secondary text (1 / 0.7 / 0.55) — verify contrast before use.
- Micro-label over big number with muted unit → KPI tiles.
- One high-contrast primary button (white fill, dark text, 4px radius) plus quiet secondary buttons.
- Short eases: 0.25s `cubic-bezier(0.4,0,0.2,1)` for controls; ease-out-expo `cubic-bezier(0.19,1,0.22,1)` for hover fades.
- Restrained radius: 4px controls, 8px containers.
- Sentence-case 14–16px bold for nav/card titles (more readable than all caps).
