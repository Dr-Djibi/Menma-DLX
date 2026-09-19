---
name: Obsidian Stream
colors:
  surface: '#111317'
  surface-dim: '#111317'
  surface-bright: '#37393e'
  surface-container-lowest: '#0c0e12'
  surface-container-low: '#1a1c20'
  surface-container: '#1e2024'
  surface-container-high: '#282a2e'
  surface-container-highest: '#333539'
  on-surface: '#e2e2e8'
  on-surface-variant: '#c6c5d5'
  inverse-surface: '#e2e2e8'
  inverse-on-surface: '#2f3035'
  outline: '#908f9e'
  outline-variant: '#454652'
  surface-tint: '#bdc2ff'
  primary: '#bdc2ff'
  on-primary: '#121f8b'
  primary-container: '#5e6ad2'
  on-primary-container: '#fdfaff'
  inverse-primary: '#4854bb'
  secondary: '#7bd0ff'
  on-secondary: '#00354a'
  secondary-container: '#00a6e0'
  on-secondary-container: '#00374d'
  tertiary: '#45dfa4'
  on-tertiary: '#003825'
  tertiary-container: '#00845c'
  on-tertiary-container: '#eefff3'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#dfe0ff'
  primary-fixed-dim: '#bdc2ff'
  on-primary-fixed: '#000965'
  on-primary-fixed-variant: '#2e3aa2'
  secondary-fixed: '#c4e7ff'
  secondary-fixed-dim: '#7bd0ff'
  on-secondary-fixed: '#001e2c'
  on-secondary-fixed-variant: '#004c69'
  tertiary-fixed: '#68fcbf'
  tertiary-fixed-dim: '#45dfa4'
  on-tertiary-fixed: '#002114'
  on-tertiary-fixed-variant: '#005137'
  background: '#111317'
  on-background: '#e2e2e8'
  surface-variant: '#333539'
typography:
  display:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  mono-lg:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: -0.01em
  mono-md:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  mono-sm:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '400'
    lineHeight: 14px
  label-md:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '500'
    lineHeight: 12px
    letterSpacing: 0.04em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 0.75rem
  gutter-tablet: 1rem
  margin: 1rem
  margin-tablet: 1.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
  space-2xl: 2rem
---

## Brand & Style

This design system embodies the precision, speed, and discretion of an advanced media utility. Designed for power users, creators, and digital archivists, the interface strips away distraction to prioritize clarity, telemetry, and execution speed.

The aesthetic merges **Modern Developer Dark Mode** with high-end editorial restraint:
- Deep matte charcoal and obsidian base surfaces prevent optical fatigue and save power on OLED screens.
- Controlled, muted electric indigo and cyan accents signal actionable states and progress without harsh optical glare.
- Crisp, hyper-legible typography paired with structural, low-contrast ghost borders creates a calm, architectural hierarchy.
- Micro-interactions are deliberate and snappy, reinforcing an engineering-first tool that feels lightweight yet indestructible.

## Colors

The color palette is built strictly on deep, neutral dark tiers with low-saturation slate undertones, avoiding the muddy warmth of brown-blacks and the eye strain of pure unmitigated `#000000`.

### Surface & Neutral Architecture
- **Canvas Base (`#0B0D11`)**: Deep obsidian base for the root view.
- **Surface Level 1 (`#13161D`)**: Matte charcoal for cards, list panels, and grouped container blocks.
- **Surface Level 2 (`#1B202B`)**: Elevated sheets, modal sheets, and active filter bars.
- **Surface Level 3 (`#232936`)**: Hover states, micro-chips, and inactive track indicators.
- **Subtle Border/Outline (`rgba(255, 255, 255, 0.08)`)**: Hairline dividers and container perimeters.
- **Text High-Contrast (`#F1F5F9`)**: Primary headers, speeds, and vital metadata.
- **Text Muted (`#94A3B8`)**: Secondary captions, idle states, timestamps.
- **Text Subtle (`#475569`)**: Placeholders, inactive track details, unit labels.

### Functional Accents
- **Primary Indigo (`#5E6AD2`)**: Key interactive triggers, active tab indicators, completed highlights.
- **Secondary Cyan (`#38BDF8`)**: Live download streams, active bandwidth telemetry, network activity.
- **Success Mint (`#34D399`)**: Successful extractions and verified hashes.
- **Critical Alert (`#F87171`)**: Broken stream links, storage warnings, network timeouts.

## Typography

The type system prioritizes computational rigor and density without sacrificing scannability. 

- **Geist** provides neutral, machined geometry for the visual structure, titles, and descriptive elements. Its neutral grotesque qualities keep headings sharp and clean at varying weights.
- **JetBrains Mono** is employed for telemetry readouts, numeric data (transfer rates, file sizes, format chips like `H.265`, `1080p`, `48kHz`), and clipboard URL previews.
- **Tabular Figures**: Ensure all numbers within mono and data labels utilize tabular alignment to prevent layout shifts during live data updates.

## Layout & Spacing

The layout utilizes a mobile-first fluid single-column framework that gracefully expands to a 2-column segmented workspace on tablet and foldable devices.

### Structural Flow
- **Base Rhythm**: A standard 4px spatial multiplier coordinates all element distances, maintaining tight, purposeful proximity between paired metadata.
- **Mobile Margins (`1rem`)**: Compact gutter-to-edge constraints that maximize screen real estate for wide audio/video asset titles and parallel progress meters.
- **Component Padding**: Dense internal offsets (`space-md` for standard cards, `space-sm` for inline badges and input pills) preserve maximum vertical information density.

## Elevation & Depth

Depth in this system avoids heavy, blurred drop shadows. Instead, it relies on **Tonal Surface Tiers** coupled with **Low-Contrast Hairline Borders**.

- **Level 0 (Backdrop)**: Unadorned `#0B0D11`.
- **Level 1 (Embedded Containers)**: `#13161D` with an inner or outer hairline border of `rgba(255, 255, 255, 0.07)`. No cast shadow.
- **Level 2 (Floating Action Panels & Bottom Drawers)**: `#1B202B` bordered by `rgba(255, 255, 255, 0.12)`, lifted by a soft ambient foundation shadow: `0 8px 24px -4px rgba(0, 0, 0, 0.6)`.
- **Glass / Scrim Overlays**: Subtle backdrop blur (`12px` to `16px`) combined with `rgba(11, 13, 17, 0.82)` for modal backgrounds and persistent bottom navigation bars.

## Shapes

The design uses tight, controlled corner radii (`Soft` - level 1) to convey precision hardware and developer tooling rather than bubbly consumer software.

- **Inputs, Chips, & Badges**: `0.25rem` (4px) to `0.375rem` (6px) rounded corners.
- **Media Cards & Panels**: `0.5rem` (8px) base radius.
- **Modals & Elevated Sheets**: `0.75rem` (12px) maximum radius.
- **Buttons & Segmented Controls**: Maintain strict `0.375rem` bounds; avoid stadium/full-pill buttons to retain a technical, modular identity.

## Components

### URL Detection & Input Field
- **Surface**: `#13161D` with a `1px` border of `rgba(255, 255, 255, 0.10)`.
- **State Changes**: On focus, the border shifts to muted electric indigo (`#5E6AD2`) with no outer glow.
- **Inline Trailing Controls**: Embedded action button for "Paste" or "Fetch" rendered in high-contrast slate text with a mono label format.

### Download Item Card
- **Layout**: Horizontal card with thumbnail or format glyph on the left, multi-line stream title and resolution chips in the center, and speed/state icon on the right.
- **Progress Bar**: Low-profile 2px or 3px height linear bar positioned at the bottom border of the card. Inactive track is `#232936`; active progress uses a solid `#38BDF8` cyan fill (or `#5E6AD2` when parsing/converting).
- **Metadata Layout**: All quantitative readouts (e.g., `42.8 MB / 180.2 MB`, `8.4 MB/s`, `ETA 00:16`) utilize `mono-md` typography.

### Buttons & Trigger Actions
- **Primary**: Solid `#5E6AD2` fill with white `#FFFFFF` text, subtle inner top edge highlight (`1px inset rgba(255, 255, 255, 0.15)`).
- **Secondary / Ghost**: Background transparent, surface border `1px solid rgba(255, 255, 255, 0.12)`, text `#F1F5F9`. Active click state fills with `#1B202B`.
- **Destructive**: Minimal background, border `1px solid rgba(248, 113, 113, 0.25)`, text `#F87171`.

### Format Selection Chips
- **Inactive**: Solid `#1B202B` background, border `1px solid rgba(255, 255, 255, 0.05)`, text `#94A3B8`.
- **Selected**: Background `rgba(94, 106, 210, 0.15)`, border `1px solid #5E6AD2`, text `#F1F5F9`. Font style set strictly to `mono-sm`.

### Sliders & Segmented Switches
- **Segmented Control**: Matte `#0B0D11` container track containing low-elevation `#1B202B` selection blocks with clear contrast text transitions.
- **Range / Stream Sliders**: Thin 2px track with an unsized, crisp square or slightly softened rectangular thumb for scrub points.