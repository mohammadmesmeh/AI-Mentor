---
name: Adaptive Intelligence
colors:
  surface: '#f9f9ff'
  surface-dim: '#d0daf2'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e8eeff'
  surface-container-high: '#dfe8ff'
  surface-container-highest: '#d9e3fb'
  on-surface: '#111c2d'
  on-surface-variant: '#43474d'
  inverse-surface: '#273143'
  inverse-on-surface: '#ecf0ff'
  outline: '#73777e'
  outline-variant: '#c3c6ce'
  surface-tint: '#45617f'
  primary: '#001c33'
  on-primary: '#ffffff'
  primary-container: '#12314d'
  on-primary-container: '#7d99ba'
  inverse-primary: '#adc9ec'
  secondary: '#325f9b'
  on-secondary: '#ffffff'
  secondary-container: '#93bdff'
  on-secondary-container: '#194b86'
  tertiary: '#240057'
  on-tertiary: '#ffffff'
  tertiary-container: '#3d008b'
  on-tertiary-container: '#a97fff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d0e4ff'
  primary-fixed-dim: '#adc9ec'
  on-primary-fixed: '#001d35'
  on-primary-fixed-variant: '#2c4966'
  secondary-fixed: '#d5e3ff'
  secondary-fixed-dim: '#a7c8ff'
  on-secondary-fixed: '#001c3b'
  on-secondary-fixed-variant: '#124782'
  tertiary-fixed: '#eaddff'
  tertiary-fixed-dim: '#d2bbff'
  on-tertiary-fixed: '#25005a'
  on-tertiary-fixed-variant: '#5a00c6'
  background: '#f9f9ff'
  on-background: '#111c2d'
  surface-variant: '#d9e3fb'
typography:
  display:
    fontFamily: Nunito Sans
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  body-md:
    fontFamily: Space Grotesk
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  margin-mobile: 1rem
  margin-tablet: 2rem
  margin-desktop: 3rem
---

## Brand & Style

This design system establishes an intelligent, reassuring, and forward-looking aesthetic for an adaptive learning SaaS platform in **light mode**. The visual tone bridges institutional trust with modern computational precision. It counterbalances high-density educational workflows with tranquil atmospheric glassmorphism, luminous surface layering, and precise typography.

The interface emphasizes focus, structural clarity, and subtle dynamism:
- **Style Archetype:** Precision Glassmorphism with deep navy structural anchoring. Layered translucency evokes dimensional intelligence rather than mere decoration.
- **Atmosphere:** Clean, light, authoritative, and frictionless. Crisp white and soft slate foundations are paired with luminous typography for peak light-mode contrast and comfort.
- **Emotional Intent:** Reduces cognitive friction and instills intellectual momentum, clarity of achievement, and academic composure.

## Colors

The system uses a deliberate light-mode palette structured around deep academic navies and luminous crystalline backplates.

### Core Role Assignments
- **Primary Navy (`#12314D`):** Applied to dominant interactive states, primary action buttons, structural headings, and navigation boundaries.
- **Deep Midnight Navy (`#0A1930`):** Reserved for primary headline anchors, hero titles, high-emphasis text, and high-contrast data metrics.
- **Secondary / Blue Text (`#1D4E89`):** Interactive utility links, secondary button text, subheadings, and contextual informative states.
- **Accent Purple (`#7C3AED`):** High-priority focus trigger strictly reserved for active tasks, current live milestones, and real-time AI progression badges.
- **Main Canvas (`#F8FAFC`):** Light ground plane enabling light diffusion beneath frosted glass panels.
- **Alternating Section Background (`#F1F5F9`):** Soft tonal break used to demarcate learning modules, horizontal groupings, and dashboard feeds.
- **Text Muted (`#667085`):** Secondary meta information, helper text, and secondary icon fills.
- **Success Green (`#10B981` with light surface):** Progress completion, skill mastery counters, and verification states.
- **Live Dot Indicator (`#EF4444`):** Real-time adaptive evaluation states, live proctoring, and streaming session status indicators.

## Typography

The typographic tension pairs the humanist warmth of **Nunito Sans** for headlines, metrics, and card titles with the computational, technical cadence of **Space Grotesk** across UI elements, prompts, inputs, labels, and paragraph bodies.

- **Display & Headings (H1–H4):** Set in Nunito Sans with tight negative tracking to maintain punchy, accessible authority without geometric sterility.
- **Body & Data:** Space Grotesk grounds student dashboards, mentor diagnostics, and operational code or math blocks in a high-clarity technical environment.
- **Metrics:** Displayed via bold weights of Nunito Sans to celebrate milestone progress with friendly visual weight.

## Layout & Spacing

The interface relies on an 8pt architectural rhythm using a 12-column fluid grid system with structural containment at an absolute maximum canvas width of 1440px.

- **Desktop (1024px+):** 12-column grid with 24px gutters and 48px lateral margins. Two-column and three-column modular splits are optimized for parallel workspace layouts.
- **Tablet (768px – 1023px):** 8-column layout with 20px gutters and 32px margins. Secondary diagnostic panels tuck beneath active learning views.
- **Mobile (&lt;768px):** 4-column layout with 16px gutters and 16px screen-edge margins. Vertical card stacking is strictly enforced; floating navigations collapse to a thumb-accessible glass dock at the bottom edge.

## Elevation & Depth

Dimensionality in light mode is achieved through optical refraction and physical blur layers rather than heavy drop shadows.

### Glassmorphism Protocols
- **Floating Global Navigation:** Constructed using light translucent background fill with an intense backdrop blur of `20px` and an ultra-fine border. Floats decoupled from viewport edges with an ambient soft glow.
- **Learning & Diagnostic Cards:** Built with light translucent fill, `12px` backdrop blur, and crisp borders. Shadows are suppressed to maintain crisp crystalline floating effects over the alternating canvas bands.
- **Real-Time Informational Ticker:** Surface framed strictly on the horizontal axis via subtle borders. No lateral boundaries.
- **Shadow Philosophy:** Minimalist ambient soft shadows used only when elevated floating cards overlap one another.

## Shapes

The design system maintains strict geometric rules aligned to physical component classes:

- **Full Pills (`border-radius: 999px`):** Exclusively applied to state tags, active milestone chips, status pills, filter pills, and live indicator enclosures.
- **Panels & Cards (`border-radius: 16px`):** Applied to learning modules, lesson cards, curriculum blocks, and modal overlays.
- **Icon Boxes (`border-radius: 12px`):** Dedicated to icon wrappers, curriculum asset badges, and avatar frames.
- **Inputs & Standard Action Buttons (`border-radius: 8px`):** Applied to form fields, interactive search bars, select triggers, and transactional action buttons for precise touch and optical density.

## Components

### Buttons
- **Primary:** Solid `#12314D` fill with `#FFFFFF` Space Grotesk text, height 40px/48px, radius 8px, padding 0 20px. Hover state shifts with subtle upward lift.
- **Secondary:** Transparent base, border, text in secondary theme color. On hover: surface tints appropriately.
- **Tertiary / Ghost:** Text links with soft pill background on hover.

### Form Inputs & Search Fields
- **Container:** Solid light surface fill, radius 8px, border.
- **Text & Placeholder:** Input text and placeholder optimized for light mode contrast using Space Grotesk 15px.
- **Focus State:** Ring and border highlight matching primary interactive tokens.

### Badges & Status Chips
- Badges use solid light-mode friendly fills:
  - **Active Milestone / Current Task:** Solid `#7C3AED` fill with high-contrast `#FFFFFF` text. Fully rounded pill (`999px`).
  - **Success / Completed:** Light-mode success surface with matching text.
  - **Live Indicator Badge:** Minimal light pill housing an `#EF4444` pulsing dot alongside bold Space Grotesk text.

### Cards & Learning Containers
- Translucent light backdrop with `12px` backdrop filter blur and crisp borders. Card titles utilize Nunito Sans. Internal gutters adhere to 24px padding.

### Checkboxes & Radios
- Size 18px x 18px. Default light state with crisp borders. Selected state uses primary light theme fill with white check/dot icon.

### Real-Time Learning Ticker
- Translucent light rail anchored to viewport or header containing horizontally cycling micro-data using Space Grotesk 13px.