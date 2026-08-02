/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Clash Display', 'Inter', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        syne: ['Syne', 'sans-serif'],
      },
      colors: {
        aura: {
          cyan: '#2FF3E0',
          purple: '#B14EFF',
          amber: '#FFB020',
          danger: '#FF3D68',
          green: '#22C55E',
        },
        p: {
          brand: '#7A5AF8',
          'brand-hover': '#6A4AE8',
          dark: '#101323',
          text: '#191919',
          muted: '#808080',
          border: '#EDEEEF',
          card: '#F8FBFB',
          sidebar: '#F6F6F9',
        },
      },
    },
  },
  plugins: [],
};
