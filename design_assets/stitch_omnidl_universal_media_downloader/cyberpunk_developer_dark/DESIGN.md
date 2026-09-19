---
name: Cyberpunk Developer Dark
colors:
  surface: '#121318'
  surface-dim: '#121318'
  surface-bright: '#38393f'
  surface-container-lowest: '#0d0e13'
  surface-container-low: '#1a1b21'
  surface-container: '#1e1f25'
  surface-container-high: '#292a2f'
  surface-container-highest: '#34343a'
  on-surface: '#e3e1e9'
  on-surface-variant: '#cbc3d7'
  inverse-surface: '#e3e1e9'
  inverse-on-surface: '#2f3036'
  outline: '#958ea0'
  outline-variant: '#494454'
  surface-tint: '#d0bcff'
  primary: '#d0bcff'
  on-primary: '#3c0091'
  primary-container: '#a078ff'
  on-primary-container: '#340080'
  inverse-primary: '#6d3bd7'
  secondary: '#4cd7f6'
  on-secondary: '#003640'
  secondary-container: '#03b5d3'
  on-secondary-container: '#00424e'
  tertiary: '#adc6ff'
  on-tertiary: '#002e6a'
  tertiary-container: '#4d8eff'
  on-tertiary-container: '#00285d'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e9ddff'
  primary-fixed-dim: '#d0bcff'
  on-primary-fixed: '#23005c'
  on-primary-fixed-variant: '#5516be'
  secondary-fixed: '#acedff'
  secondary-fixed-dim: '#4cd7f6'
  on-secondary-fixed: '#001f26'
  on-secondary-fixed-variant: '#004e5c'
  tertiary-fixed: '#d8e2ff'
  tertiary-fixed-dim: '#adc6ff'
  on-tertiary-fixed: '#001a42'
  on-tertiary-fixed-variant: '#004395'
  background: '#121318'
  on-background: '#e3e1e9'
  surface-variant: '#34343a'
typography:
  headline-xl:
    fontFamily: Outfit
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.03em
  headline-xl-mobile:
    fontFamily: Outfit
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Outfit
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-sm:
    fontFamily: Outfit
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
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
  code-mono:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0.02em
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.08em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1rem
  gutter-tablet: 1.5rem
  margin-tablet: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1.25rem
  space-xl: 2rem
---

## Brand & Style

This design system establishes a high-performance, developer-centric cyberpunk aesthetic tailored for a universal mobile media extraction application. The personality is hyper-focused, precise, and technologically dominant, engineered to project raw capability, speed, and uncompromising reliability. 

The visual style blends dark glassmorphism with high-contrast neon luminescence. Matte obsidian base planes are punctured by sharp electric violet and cyan accents, evoking terminal diagnostics and high-tier command interfaces. Surfaces use micro-borders and subtle luminescence rather than heavy shadows to denote structure. The interface communicates speed, technical precision, and total user control, offering an elite utility experience across mobile ecosystems with bilingual French native labeling.

## Colors

The palette is engineered specifically for OLED displays and low-light environments, maximizing battery efficiency while ensuring electric data contrast.

- **Base Canvas (`#0A0B10`):** Pure obsidian core plane, anchoring bottom-level backgrounds.
- **Surface Elevation (`#12131C`):** Root elevated layer for structural app panels and persistent docks.
- **Container Tiers (`#1A1C29`, `#222538`):** Interacting card surfaces, floating sheets, and nested inspection modules.
- **Primary Accent (`#8B5CF6`):** Electric violet for primary triggers, state transitions, active progress arcs, and high-priority actions.
- **Secondary Accent (`#06B6D4`):** Neon cyan for active extraction threads, protocol badges, network stats, and cursor focus indicators.
- **Tertiary Accent (`#3B82F6`):** Electric hyper-blue for secondary metadata indicators, links, and complementary gradient stops.
- **Diagnostics & Status:**
  - Success/Ready: `#10B981` (Terminal Emerald)
  - Processing/Warning: `#F59E0B` (Amber Protocol)
  - Failure/Error: `#EF4444` (Critical Crimson)
- **Text & Foreground Layers:**
  - High Emphasis: `#F8FAFC` (Pure Titanium, 95% opacity)
  - Medium Emphasis: `#94A3B8` (Slate Silver, 70% opacity)
  - Low Emphasis / Disabled: `#475569` (Dark Steel, 40% opacity)

## Typography

The typographic hierarchy marries the geometric authority of **Outfit** for structural headers with the hyper-legible neutral cadence of **Geist** for body text and descriptive UI flows. Technical telemetry, parsing logs, file extensions, and protocol labels use **JetBrains Mono** to enforce the developer tool aesthetic.

French localization requires strict adherence to vertical rhythm: all button containers and chips accommodate extended word lengths (e.g., *Télécharger*, *Paramètres*, *Extraction du flux en cours*) without label truncation or awkward wrap. All labels use explicit uppercase letter-spacing to enhance readability on high-DPI smartphone displays.

## Layout & Spacing

This design system uses a strict 4px/8px incremental base rhythm structured within a 4-column fluid mobile grid, expanding to an 8-column layout on foldable devices and tablets.

- **Margins:** 16px (`1rem`) on handheld mobile screens to maximize raw screen real estate; 32px (`2rem`) on larger screens.
- **Gutters:** 16px fixed between concurrent media download cards and configuration tiles.
- **Safe Area Insets:** Fixed bottom docking buffers (34px iOS indicator clearance, 16px Android gesture bar) ensure no interactive triggers are obscured.
- **Reflow Logic:** Multi-column media inspector panels degrade to a single vertical stack on screens narrower than 600px.

## Elevation & Depth

Visual hierarchy is constructed through stacked luminosity and glassmorphism rather than diffused daylight drop-shadows:

1. **Backdrop & Deep Plane:** Flat `#0A0B10` canvas.
2. **Glass Container Layer:** `#12131C` with `background-color: rgba(18, 19, 28, 0.72)` combined with `backdrop-filter: blur(16px)` and `-webkit-backdrop-filter: blur(16px)`.
3. **Micro-Borders & Glows:** Outer containers are framed with a hairline `1px` border: `rgba(139, 92, 246, 0.15)` for dormant states, transitioning to `rgba(6, 182, 212, 0.45)` when actively downloading or focused.
4. **Luminescent Aura:** Elevated interactive triggers cast a concentrated, low-spread ambient backlight: `box-shadow: 0 0 24px -4px rgba(139, 92, 246, 0.35)`. Focused active items utilize dual-color radiance blending cyan (`#06B6D4`) and violet (`#8B5CF6`).

## Shapes

The interface adopts a high-precision rounded profile (`roundedness: 2` / 8px base radius). This produces balanced corners that maintain structural edge discipline without looking blunt or childish.

- **Primary Cards & Panels:** 16px (`rounded-lg`) corner radii, paired with `1px` high-definition perimeter rings.
- **Buttons, Text Inputs & Interactive Triggers:** 8px to 10px corner radii for an ergonomic, tactile touch target.
- **Tags, System Badges, and Terminal Chips:** 6px radius to uphold compact, dense telemetry displays.

## Components

### Boutons d'Action (Buttons)
- **Primaire (Extraction / Télécharger):** Linear gradient from `#8B5CF6` to `#3B82F6` (135°), text color `#F8FAFC`, font weight 600. Glowing focus ring (`box-shadow: 0 0 16px rgba(6, 182, 212, 0.5)`). Height: 48px to satisfy touch ergonomics.
- **Secondaire / Fantôme (Analyser, Annuler):** Translucent background `rgba(34, 37, 56, 0.6)`, border `1px solid rgba(255, 255, 255, 0.12)`, text `#94A3B8`. Active tap shifts border to `#06B6D4`.

### Cartes Multimédia & Téléchargement (Media & Download Cards)
- Encapsulated in glassmorphic `#1A1C29` with `backdrop-filter: blur(14px)` and `1px` border `rgba(139, 92, 246, 0.2)`.
- Features an embedded linear progress rail (`4px` height) glowing with neon cyan when downloading (`#06B6D4`).
- Includes technical telemetry tags: format indicators (`MP4`, `WEBM`, `FLAC`), bitrate counters, and dynamic network speed (`4.2 Mo/s`).

### Champs de Saisie (URL & Command Inputs)
- Dark terminal well (`#0F1017`) bordered by `1px solid rgba(255, 255, 255, 0.08)`.
- Prefix: JetBrains Mono command prompt symbol (`>`) in glowing cyan (`#06B6D4`).
- Focus state: Border illuminates in pure electric violet (`#8B5CF6`) with zero-bleed outer halo. Clear button ("Effacer") and clipboard auto-detect chip ("Coller l'URL") embedded within the internal gutter.

### Badges & Puces d'État (Chips & Status Indicators)
- Monospace font (`JetBrains Mono`, `10px`), height 24px, uppercase.
- Status variants:
  - *EN COURS* (Downloading): Cyan tint, pulsing dot indicator.
  - *TERMINÉ* (Completed): Green tint border and text.
  - *ÉCHEC* (Failed): Red tint border and text.
  - *EN ATTENTE* (Queued): Muted slate gray.

### Sélecteurs et Commutateurs (Checkboxes & Toggles)
- **Commutateur (Toggle):** Track in `#12131C` with `1px solid rgba(255, 255, 255, 0.15)`. Active track fills with violet-to-cyan gradient; thumb casts crisp neon glow.
- **Case à Cocher (Checkbox):** 18x18px square with 4px border radius. Checked state displays neon cyan checkmark over midnight slate background with violet border.

### Console de Télémétrie / Logs (Terminal Drawer)
- Slide-up bottom sheet with backdrop dimming (`rgba(10, 11, 16, 0.85)`).
- Monospaced stream detailing HTTP response headers, audio-video stream demuxing, and chunk assembly status in real time.