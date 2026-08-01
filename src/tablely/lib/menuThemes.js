// Customer menu theme definitions — 3 visual themes the owner can pick
// (Ecosystem+ only). Theme tokens live in index.css via CSS custom properties;
// this file maps IDs to metadata + swatch colors for the preview UI.

export const THEMES = [
  {
    id: "classic",
    name: "Classic",
    tagline: "The familiar Tablely paper look — warm, ticket-style cards.",
    swatches: ["#f7f1e2", "#17181c", "#e8a33d"],
  },
  {
    id: "midnight",
    name: "Midnight",
    tagline: "Dark ink surface — moody ambience with amber accents.",
    swatches: ["#141519", "#1e2026", "#e8a33d"],
  },
  {
    id: "modern",
    name: "Modern",
    tagline: "Clean white surfaces — soft shadows, teal accents, rounded cards.",
    swatches: ["#ffffff", "#f4f5f7", "#123a41"],
  },
];

const THEME_MAP = Object.fromEntries(THEMES.map((t) => [t.id, t]));

export function getMenuTheme(id) {
  return THEME_MAP[id] || THEME_MAP.classic;
}
