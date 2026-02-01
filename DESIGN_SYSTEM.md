# DeepBound Design System v2.4

## 1. Core Philosophy
The DeepBound design system is built on the concept of **"Behavioral Fidelity."** It rejects the traditional high-speed, aggressive "tech startup" aesthetic in favor of a thoughtful, scientific, and studio-led experience.

### Design Principles
- **Thoughtfulness over Speed**: Every interaction should feel intentional and calm. No aggressive scaling, sharp transitions, or high-contrast "shouting."
- **Scientific Rigor**: The UI should feel like a high-fidelity research tool—precise, clean, and objective.
- **Narrative Depth**: Use whitespace and typography to suggest that there is deep context (the "Deep Binding") beneath every data point.
- **Museum/Studio Aesthetic**: Use a "dark room" palette with focus lighting to guide the user's eye to high-value insights.

---

## 2. Color System
We use the **OKLCH** color space for sophisticated, perceptually uniform color transitions.

### Base Palette (Dark Theme)
| Token | OKLCH Value | UI Role |
| :--- | :--- | :--- |
| `background` | `0.08 0 0` | The "base" deep black. Grounded and calm. |
| `foreground` | `0.92 0.01 264` | Primary text. Crisp but not piercing. |
| `card` | `0.12 0.01 264 / 0.4` | Glass surfaces. Provides depth. |
| `primary` | `0.65 0.1 264` | **Midnight Indigo**. Used for focus and brand markers. |
| `muted-foreground` | `0.72 0.01 264` | Secondary metadata. High legibility but quiet. |
| `border` | `1 0 0 / 12%` | Subtle boundaries. Defined but atmospheric. |
| `input` | `1 0 0 / 18%` | Interactive zone borders. |

---

## 3. Typography
We utilize **Geist Sans** for its clean, technical, yet humanistic letterforms.

### Font Hierarchy
- **Headers (H1/H2)**: 
  - Weight: `Medium` (500) or `Light` (300).
  - Letter Casing: **Sentence-case** (Avoid all-caps for large headings).
  - Tracking: `-0.02em` for tight, premium feel.
- **Body Text**:
  - Weight: `Light` (300) or `Regular` (400).
  - Line Height: `1.6` to `1.8` for "airy" legibility.
- **Metadata/Labels**:
  - Weight: `Bold` (700).
  - Letter Casing: **Uppercase**.
  - Tracking: `0.2em` to `0.3em` (Wide tracking suggests scientific labels).
  - Size: `10px` to `12px`.

---

## 4. Radii & Spacing
A "Balanced Curve" system that avoids being too bubbly or too industrial.

| Level | Radius | Use Case |
| :--- | :--- | :--- |
| **Small** | `0.5rem` (8px) | Small buttons, context tags. |
| **Standard** | `0.75rem` (12px) | Default radius for buttons, inputs, small cards. |
| **Large** | `1.5rem` (24px) | Dialogue boxes, section containers. |
| **Full** | `9999px` | Primary CTAs, pill badges. |

### Spacing Philosophy
- **Generous Whitespace**: Double the standard margins. Sections move from `py-24` to `py-48`.
- **Gutter Balance**: Cards use a minimum of `p-8` up to `p-16` on larger viewports.

---

## 5. Interactive Components

### Buttons
- **`premium`**: Solid `foreground` background with `background` text. Minimal hover (slight opacity drop).
- **`ghost`**: No background idle. `rounded-full` always.
- **`outline`**: `border-border/20` idle. Transitions to `bg-white/5` on hover.

### Inputs & Textareas
- **Idle State**: `bg-white/[0.02]` with a `border-white/10` stroke. Slightly recessed feel with `shadow-inner`.
- **Focus State**: Smooth `duration-500` transition to `border-white/20`. Avoid sharp blue rings.
- **Typography**: Large font sizes (`text-xl`) with `font-light` for main behavioral inputs to suggest importance.

#### Behavioral Input Pattern (Label + Input)
To maintain "Behavioral Fidelity" and scientific clarity, primary data-entry zones must follow this strict hierarchy:
- **Container Spacing**: Use `space-y-6` for the vertical relationship between the label and the interactive field.
- **Labels**: 
  - Style: `text-sm font-medium text-muted-foreground ml-1`.
  - Content: Sentence-case only for primary behavioral labels.
- **Inputs/Textareas**:
  - Spacing: Always add a `mt-4` top margin to the input itself to create "breathing room" beneath the label.
  - Sizing: Large scale inputs (`h-16` or `min-h-[240px]`) with `p-8` internal padding.
  - Radii: Always use `rounded-2xl` for primary behavioral fields.

---

## 6. Layout Patterns

### The "Command Center" Grid
- **Tabs**: Desktop-first horizontal navigation with underline indicators. Underscores use a `scale-x` transition.
- **Metric Blocks**: Metrics are presented as a grid of 4. Large font size (`text-5xl`) with `font-light` weights.
- **Trace Maps (Cards)**: High-altitude cards (`rounded-[2.5rem]`) with internal divisions marked by `border-t border-border/5`.

---

## 7. Motion & Micro-interactions
Motion should be "felt, not seen."

- **Transitions**: Global `duration-300` or `duration-500`.
- **Easing**: `cubic-bezier(0.4, 0, 0.2, 1)` (Standard ease-in-out).
- **Behavior**: Elements should gently "breathe" into focus. Avoid heavy "spring" animations or rapid scaling.

---

## 8. Brand Elements
- **Logo Container**: `size-10` rounded-xl. Uses `bg-primary/20` and `border-primary/20` for a glowing, "charged" effect.
- **System Indicators**: Small dots (`size-1.5`) with `animate-pulse` and `bg-emerald-500` to show live system state.
- **Glassmorphism**: Always use `backdrop-blur-xl` or `2xl` for headers and overlays to maintain spatial awareness.
