import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bb: {
          green: '#689f38',
          greenLight: '#84c225',
          greenDark: '#4b7127',
          greenBg: '#f1f8e9',
          red: '#e53935',
          redDark: '#c62828',
          redLight: '#ffebee',
          dark: '#212121',
          grayBg: '#f7f7f7',
          border: '#e5e7eb',
        },
        campus: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        }
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 2px 8px 0 rgba(0,0,0,0.06)',
        'card-hover': '0 6px 16px 0 rgba(0,0,0,0.12)',
        'subtle': '0 1px 3px 0 rgba(0,0,0,0.05)',
      }
    },
  },
  plugins: [],
};

export default config;
