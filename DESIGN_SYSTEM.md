## 1. Core Philosophy
The DeepBound design system is built on **"Invisible Performance."** We prioritize **Simplicity over Everything.** The UI is not a destination; it is a clear lens through which the user views their data. 

### The Ultimate Goal: Magic
Everything must feel natural, intuitive, and "magical." If an interaction requires a manual, a tooltip to explain the UI itself (not the data), or more than one second of thought to find—**it is a failure.**

### Design Principles
- **The Law of Invisibility**: The best UI is the one you don't notice. Strip away every border, background, and element that isn't pulling its weight.
- **Natural Placement**: Every button, metric, and insight must be exactly where the user's eye expects it to be. 
- **Anticipatory Design**: The tool should feel like it's one step ahead of the user's next question. 
- **Snappy Precision**: Latency destroys magic. Interactions must be instantaneous and mechanical.
- **Simplicity at All Costs**: If there is any way to make a feature simpler or easier to operate, **DO IT.** Do not let "pro features" compromise the ease of use.

---

## 2. Color System
Optimized for high-contrast legibility in a dark environment.

### Base Palette
| Token | Value (HEX/OKLCH) | UI Role |
| :--- | :--- | :--- |
| `background` | `#0A0A0A` | Deep charcoal. Reduces eye strain during long analysis sessions. |
| `foreground` | `#F5F5F5` | Clean white. High legibility for primary data. |
| `card` | `#141414` | Solid surface. Clear boundaries between data modules. |
| `primary` | `#6366F1` | **Direct Indigo**. High-visibility primary action color. |
| `muted-foreground` | `#9CA3AF` | Secondary metadata. Subdued but still high-contrast for readability. |
| `border` | `white / 10%` | Crisp, visible boundaries. |
| `input` | `white / 15%` | Defined interactive zones. |

---

## 3. Radii & Spacing
"Modern Precision" — avoiding the "bubbly" look of consumer apps while maintaining a modern, professional softened edge.

| Level | Radius | Use Case |
| :--- | :--- | :--- |
| **Small** | `0.375rem` (6px) | Small buttons, tags, internal card markers. |
| **Standard** | `0.5rem` (8px) | Default for buttons, inputs, components. |
| **Large** | `1rem` (16px) | Primary cards, sections, modal containers. |
| **Pill** | `9999px` | Badges, status indicators. |

### Spacing & Density
- **Standard Padding**: `p-4` (1rem) for most internal components.
- **Section Margins**: `py-12` to `py-16` for main layout divisions. Avoid `py-24+` unless starting a new major flow.
- **Alignment**: Strict adherence to an 8px grid for mechanical alignment.

---

## 4. Typography
Utilizing **Geist Sans** (or system-default sans) for technical clarity.

### Font Hierarchy
- **Headers (H1/H2)**: 
  - Weight: `Medium` (500).
  - Letter Casing: **Sentence-case**. 
  - Tracking: `-0.01em`.
- **Primary Metrics**:
  - Weight: `Semibold` (600).
  - Numbers should always be legible and prominent.
- **Body Text**:
  - Weight: `Regular` (400).
  - Line Height: `1.5` for balanced reading.
- **Data Labels**:
  - Weight: `Bold` (700).
  - Letter Casing: **Uppercase**.
  - Tracking: `0.1em`.
  - Size: `11px`.

---

## 5. Interactive Components

### Buttons
- **`primary`**: High-contrast fills. Interaction should be a simple opacity or color shift. No scaling.
- **`outline`**: `border-white/10` base. `bg-white/5` on hover. Snappy `150ms` transition.
- **`ghost`**: Clean, text-based actions.

### Data Inputs
- **Idle**: `bg-white/[0.03]` with a `border-white/10` stroke. 
- **Focus**: Snappy `border-primary` or `border-white/20`.
- **Utility**: All inputs must have clear, high-contrast focus rings for accessibility.

---

## 6. Layout Patterns
- **High-Density Grids**: Use 2, 3, or 4-column layouts to maximize data visibility.
- **Surface Layering**: 
  - Level 0: Background
  - Level 1: Cards (`border-white/10`)
  - Level 2: Modals (`border-white/15`, `shadow-2xl`)
- **Trace Maps**: Analysis elements should be clearly boxed, not floating.

---

## 7. Motion & Micro-interactions
Motion is for **confirmation**, not decoration.

- **Duration**: `150ms` for hovers, `300ms` for layout shifts/modals.
- **Easing**: `cubic-bezier(0.16, 1, 0.3, 1)` (Out-Expo) for snappiness.
- **Rules**: Zero scaling on hover. Zero "bouncy" spring animations. Elements should snap into place with precision.

---

## 8. Specific UI Standards
- **Icons**: Use `stroke-width={1.5}` or `2`. Avoid ultra-thin lines that sacrifice legibility.
- **Scrollbars**: Minimal, narrow, and high-contrast. Only visible when hovering over a scrollable region.
- **Modal Close Buttons**: Standardized to `absolute top-6 right-6`. `rounded-lg` (not circle).
