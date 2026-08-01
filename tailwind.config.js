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
      },
      colors: {
        aura: {
          cyan: '#2FF3E0',
          purple: '#B14EFF',
          amber: '#FFB020',
          danger: '#FF3D68',
          green: '#22C55E',
        },
      },
    },
  },
  plugins: [],
};
