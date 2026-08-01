# AURA AI — Design System
### Tokens · CSS · Motion Presets — companion to `AURA-AI-Landing-Page-Architecture.md`

Drop the `:root` block into `globals.css`, wire the color tokens into `tailwind.config` under `theme.extend.colors`, and use the utility classes directly or as a reference for Tailwind `@layer components`.

---

## 1. Color Tokens

```css
:root {
  /* Base surfaces — obsidian slate scale, darkest to lightest */
  --aura-bg-void: #05070A;
  --aura-bg-base: #0A0E14;
  --aura-bg-elevated: #10151C;
  --aura-bg-panel: #161C25;

  /* Glass */
  --aura-glass-fill: rgba(148, 163, 184, 0.04);
  --aura-glass-fill-hover: rgba(148, 163, 184, 0.08);
  --aura-glass-border: rgba(148, 163, 184, 0.14);
  --aura-glass-blur: 20px;

  /* Accents */
  --aura-cyan: #2FF3E0;
  --aura-cyan-dim: #17A8A0;
  --aura-purple: #B14EFF;
  --aura-purple-deep: #6B21D8;
  --aura-amber: #FFB020;   /* gamification / streak accent */
  --aura-danger: #FF3D68;  /* comparison-table pain points only */

  /* Text */
  --aura-text-primary: #E9EEF5;
  --aura-text-secondary: #A6B0BF;
  --aura-text-muted: #626C7A;

  /* Gradients */
  --aura-gradient-hero: linear-gradient(135deg, #6B21D8 0%, #2FF3E0 100%);
  --aura-gradient-cta: linear-gradient(90deg, #2FF3E0 0%, #B14EFF 100%);
  --aura-gradient-amber: linear-gradient(135deg, #FFB020 0%, #B14EFF 100%);

  /* Radii */
  --aura-radius-sm: 8px;
  --aura-radius-md: 16px;
  --aura-radius-lg: 24px;
  --aura-radius-pill: 999px;

  /* Glow shadows */
  --aura-glow-cyan: 0 0 24px rgba(47, 243, 224, 0.35);
  --aura-glow-purple: 0 0 24px rgba(177, 78, 255, 0.35);
  --aura-glow-amber: 0 0 24px rgba(255, 176, 32, 0.30);
  --aura-glow-danger: 0 0 18px rgba(255, 61, 104, 0.25);
}
```

---

## 2. Typography Tokens

```css
/* Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

/* Clash Display — via Fontshare (free, no account needed) */
@import url('https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&display=swap');

:root {
  --font-display: 'Clash Display', 'Inter', sans-serif;
  --font-body: 'Inter', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}

body {
  font-family: var(--font-body);
  background: var(--aura-bg-base);
  color: var(--aura-text-primary);
}
```

**Type scale (Tailwind reference):**

| Role | Font | Size (desktop / mobile) | Weight |
|---|---|---|---|
| H1 (hero) | `--font-display` | 96px / 44px | 600 |
| H2 (section) | `--font-display` | 48px / 32px | 600 |
| H3 (card title) | `--font-display` | 24px / 20px | 600 |
| Body | `--font-body` | 16px / 15px | 400 |
| Eyebrow / label | `--font-mono` | 13px, letter-spacing 0.08em, uppercase | 500 |
| Feature label (bullets) | `--font-mono` | 13px | 500 |

---

## 3. Glassmorphism Utility Classes

```css
.glass-panel {
  background: var(--aura-glass-fill);
  border: 1px solid var(--aura-glass-border);
  backdrop-filter: blur(var(--aura-glass-blur)) saturate(140%);
  -webkit-backdrop-filter: blur(var(--aura-glass-blur)) saturate(140%);
  border-radius: var(--aura-radius-lg);
  transition: background 0.25s ease, transform 0.25s ease, box-shadow 0.25s ease;
}

.glass-panel:hover {
  background: var(--aura-glass-fill-hover);
}

.glass-card {
  composes: glass-panel; /* or replicate properties directly if not using CSS modules */
  padding: 32px;
  position: relative;
  overflow: hidden;
}

/* the "landed shard" top-edge glow on Ecosystem cards */
.glass-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--aura-gradient-cta);
  opacity: 0.9;
}
```

---

## 4. Glow & Border Utilities

```css
.glow-border-cyan {
  box-shadow: var(--aura-glow-cyan), inset 0 0 0 1px rgba(47, 243, 224, 0.35);
}

.glow-border-purple {
  box-shadow: var(--aura-glow-purple), inset 0 0 0 1px rgba(177, 78, 255, 0.35);
}

.glow-border-amber {
  box-shadow: var(--aura-glow-amber), inset 0 0 0 1px rgba(255, 176, 32, 0.30);
}

.glow-text-cyan {
  color: var(--aura-cyan);
  text-shadow: 0 0 18px rgba(47, 243, 224, 0.45);
}
```

---

## 5. Buttons

```css
.btn-primary {
  font-family: var(--font-body);
  font-weight: 600;
  padding: 14px 28px;
  border-radius: var(--aura-radius-pill);
  background: var(--aura-gradient-cta);
  color: var(--aura-bg-void);
  box-shadow: var(--aura-glow-cyan);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.btn-primary:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 0 32px rgba(47, 243, 224, 0.5);
}
.btn-primary:active {
  transform: translateY(0) scale(0.98);
}

.btn-secondary {
  font-family: var(--font-body);
  font-weight: 500;
  padding: 14px 28px;
  border-radius: var(--aura-radius-pill);
  background: transparent;
  border: 1px solid var(--aura-glass-border);
  color: var(--aura-text-primary);
  backdrop-filter: blur(12px);
}
.btn-secondary:hover {
  border-color: var(--aura-cyan);
  color: var(--aura-cyan);
}

.btn-ghost-link {
  color: var(--aura-cyan);
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: gap 0.2s ease;
}
.btn-ghost-link:hover {
  gap: 10px; /* arrow "shifts right" on hover */
}
```

---

## 6. Keyframe Animations

```css
@keyframes pulse-glow {
  0%, 100% { box-shadow: var(--aura-glow-cyan); }
  50% { box-shadow: 0 0 40px rgba(47, 243, 224, 0.55); }
}

@keyframes gradient-shift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@keyframes particle-drift {
  0% { transform: translateY(0) translateX(0); opacity: 0; }
  10% { opacity: 0.6; }
  90% { opacity: 0.6; }
  100% { transform: translateY(-120px) translateX(12px); opacity: 0; }
}

@keyframes marquee-scroll {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

.animate-pulse-glow { animation: pulse-glow 3.5s ease-in-out infinite; }
.animate-gradient { background-size: 200% 200%; animation: gradient-shift 8s ease infinite; }
.animate-particle { animation: particle-drift 9s linear infinite; }
.animate-marquee { animation: marquee-scroll 40s linear infinite; }
.animate-marquee:hover { animation-play-state: paused; }
```

---

## 7. Framer Motion Spring Presets

Reference constants — import into components rather than inlining transition objects everywhere, so the whole page shares one physics language.

```javascript
// motion-presets.js

export const springs = {
  // hero orb: heavy, slow settle — feels like real glass, not a UI toy
  orb: { type: "spring", stiffness: 120, damping: 14, mass: 1 },

  // card hover lift: snappy, light
  cardHover: { type: "spring", stiffness: 300, damping: 20 },

  // section reveal on scroll
  reveal: { type: "spring", stiffness: 80, damping: 18 },

  // button press feedback
  press: { type: "spring", stiffness: 400, damping: 25 },
};

export const staggerContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

export const fadeUpItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: springs.reveal },
};

// used once for the hero → ecosystem "fracture" handoff
export const fractureShard = {
  hidden: { opacity: 0, scale: 0.6, y: -40 },
  show: { opacity: 1, scale: 1, y: 0, transition: springs.orb },
};
```

---

## 8. Spacing Scale

```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 16px;
  --space-4: 24px;
  --space-5: 32px;
  --space-6: 48px;
  --space-7: 64px;
  --space-8: 96px;
  --space-9: 128px; /* section vertical padding, desktop */
}
```

---

## 9. Responsive Breakpoints (Tailwind defaults — no overrides needed)

| Token | Width | Usage |
|---|---|---|
| `sm` | 640px | Ecosystem cards go 1-col below this |
| `md` | 768px | Nav collapses to hamburger below this |
| `lg` | 1024px | Bento grid becomes 2×2; comparison table becomes sticky |
| `xl` | 1280px | Max content width caps here (`max-w-7xl`) |

---

## 10. Accessibility

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

:focus-visible {
  outline: 2px solid var(--aura-cyan);
  outline-offset: 3px;
  border-radius: var(--aura-radius-sm);
}
```

- Spline canvas must not be the *only* way to convey the hero message — headline/sub-line copy carries full meaning with the 3D layer switched off.
- Minimum body text contrast: `--aura-text-secondary` (#A6B0BF) on `--aura-bg-base` (#0A0E14) → passes WCAG AA for normal text (~7.4:1). Do not go lighter-muted than `--aura-text-muted` for anything but micro-captions.
