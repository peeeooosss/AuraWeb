// Slide Themes — Metadata + real CSS for the 3 supported visual systems.
// Now includes CSS variables and utility classes for consistent styling

const THEME_CSS = {
  'glass-dark': `
:root[data-theme="glass-dark"] {
  --card-bg: #18181B;
  --card-border: #2E2E32;
  --accent: #00F0FF;
  --text-primary: #FFFFFF;
  --text-secondary: #A1A1AA;
  --table-header-bg: #18181B;
  --table-border: #2E2E32;
  --chart-gradient: linear-gradient(to top, #00F0FF, #8B5CF6);
  --card-shadow: 0 8px 32px rgba(0,0,0,0.3);
}

.center-xy {
  display: flex;
  justify-content: center;
  align-items: center;
}

.text-center { text-align: center }
.mx-auto { margin-left: auto; margin-right: auto }

section[data-theme="glass-dark"] {
  background-color: #09090B;
  background-image: radial-gradient(circle at top left, #1A1A2E, #0F0F1A);
  color: var(--text-secondary);
  font-family: system-ui, -apple-system, sans-serif;
  overflow: hidden;
}

section[data-theme="glass-dark"] h1,
section[data-theme="glass-dark"] h2 {
  color: var(--text-primary);
  font-weight: 800;
  letter-spacing: -0.03em;
  margin: 0;
}

section[data-theme="glass-dark"] h3 {
  color: var(--accent);
  font-weight: 700;
  letter-spacing: -0.02em;
  margin: 0 0 10px 0;
}

section[data-theme="glass-dark"] .glass-card,
section[data-theme="glass-dark"] [class*="card"] {
  background-color: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 24px;
  box-shadow: var(--card-shadow);
  box-sizing: border-box;
}

section[data-theme="glass-dark"] table {
  width: 100%;
  border-collapse: collapse;
}

section[data-theme="glass-dark"] th {
  background-color: var(--table-header-bg);
  color: var(--accent);
  font-weight: 700;
  padding: 12px;
  border-bottom: 2px solid var(--table-border);
}

section[data-theme="glass-dark"] td {
  padding: 12px;
  border-bottom: 1px solid var(--table-border);
}

section[data-theme="glass-dark"] .chart-bar,
section[data-theme="glass-dark"] [class*="chart-bar"] {
  background: var(--chart-gradient);
  border-radius: 8px 8px 0 0;
}
`,

  'minimal-light': `
:root[data-theme="minimal-light"] {
  --card-bg: #FFFFFF;
  --card-border: #E5E7EB;
  --accent: #2563EB;
  --text-primary: #111827;
  --text-secondary: #4B5563;
  --table-header-bg: #F3F4F6;
  --table-border: #E5E7EB;
  --chart-gradient: linear-gradient(to top, #2563EB, #60A5FA);
  --card-shadow: 0 4px 24px rgba(0,0,0,0.08);
}

.center-xy {
  display: flex;
  justify-content: center;
  align-items: center;
}

.text-center { text-align: center }
.mx-auto { margin-left: auto; margin-right: auto }

section[data-theme="minimal-light"] {
  background-color: #FAFAFA;
  color: var(--text-secondary);
  font-family: system-ui, -apple-system, sans-serif;
  overflow: hidden;
}

section[data-theme="minimal-light"] h1,
section[data-theme="minimal-light"] h2 {
  color: var(--text-primary);
  font-weight: 800;
  letter-spacing: -0.03em;
  margin: 0;
}

section[data-theme="minimal-light"] h3 {
  color: var(--accent);
  font-weight: 700;
  letter-spacing: -0.02em;
  margin: 0 0 10px 0;
}

section[data-theme="minimal-light"] .glass-card,
section[data-theme="minimal-light"] [class*="card"] {
  background-color: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 16px;
  box-shadow: var(--card-shadow);
  box-sizing: border-box;
}

section[data-theme="minimal-light"] table {
  width: 100%;
  border-collapse: collapse;
}

section[data-theme="minimal-light"] th {
  background-color: var(--table-header-bg);
  color: var(--text-primary);
  font-weight: 700;
  padding: 12px;
  border-bottom: 2px solid var(--table-border);
}

section[data-theme="minimal-light"] td {
  padding: 12px;
  border-bottom: 1px solid var(--table-border);
}

section[data-theme="minimal-light"] .chart-bar,
section[data-theme="minimal-light"] [class*="chart-bar"] {
  background: var(--chart-gradient);
  border-radius: 6px 6px 0 0;
}
`,

  'neo-brutalism': `
:root[data-theme="neo-brutalism"] {
  --card-bg: #FFFFFF;
  --card-border: #000000;
  --accent: #FF3D57;
  --text-primary: #000000;
  --text-secondary: #1A1A1A;
  --table-header-bg: #FF3D57;
  --table-border: #000000;
  --chart-gradient: #FF3D57;
  --card-shadow: 8px 8px 0 #000000;
}

.center-xy {
  display: flex;
  justify-content: center;
  align-items: center;
}

.text-center { text-align: center }
.mx-auto { margin-left: auto; margin-right: auto }

section[data-theme="neo-brutalism"] {
  background-color: #FFEB3B;
  color: var(--text-primary);
  font-family: system-ui, -apple-system, sans-serif;
  overflow: hidden;
}

section[data-theme="neo-brutalism"] h1,
section[data-theme="neo-brutalism"] h2 {
  color: var(--text-primary);
  font-weight: 800;
  letter-spacing: -0.03em;
  text-transform: uppercase;
  margin: 0;
}

section[data-theme="neo-brutalism"] h3 {
  color: var(--text-primary);
  font-weight: 800;
  letter-spacing: -0.02em;
  text-transform: uppercase;
  margin: 0 0 10px 0;
}

section[data-theme="neo-brutalism"] .glass-card,
section[data-theme="neo-brutalism"] [class*="card"] {
  background-color: var(--card-bg);
  border: 3px solid var(--card-border);
  border-radius: 0;
  box-shadow: var(--card-shadow);
  box-sizing: border-box;
}

section[data-theme="neo-brutalism"] table {
  width: 100%;
  border-collapse: collapse;
}

section[data-theme="neo-brutalism"] th {
  background-color: var(--table-header-bg);
  color: #FFFFFF;
  font-weight: 800;
  padding: 12px;
  border: 2px solid var(--table-border);
}

section[data-theme="neo-brutalism"] td {
  padding: 12px;
  border: 2px solid var(--table-border);
}

section[data-theme="neo-brutalism"] .chart-bar,
section[data-theme="neo-brutalism"] [class*="chart-bar"] {
  background: var(--chart-gradient);
  border: 2px solid var(--table-border);
  border-radius: 0;
}
`
};

const THEMES = [
  {
    id: 'glass-dark',
    name: 'Glass Dark',
    emoji: '🪟',
    desc: 'Deep purple gradient with glassmorphism cards',
    css: THEME_CSS['glass-dark'],
  },
  {
    id: 'minimal-light',
    name: 'Minimal Light',
    emoji: '⚪',
    desc: 'Clean white background, sharp modern typography',
    css: THEME_CSS['minimal-light'],
  },
  {
    id: 'neo-brutalism',
    name: 'Neo Brutalism',
    emoji: '🟨',
    desc: 'Bold yellow background, thick black borders, hard shadows',
    css: THEME_CSS['neo-brutalism'],
  },
];

export function getSlideTheme(id) {
  return THEMES.find(t => t.id === id) || THEMES[0];
}

export function getSlideThemeList() {
  return THEMES;
}

export function getAllSlideThemeCSS() {
  return Object.values(THEME_CSS).join('\n');
}