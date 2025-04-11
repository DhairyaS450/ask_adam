/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4E57D4',
          dark: '#3A42B0',
          darker: '#2563EB',
          light: '#7278E5',
        },
        secondary: {
          DEFAULT: '#3B82F6',
          dark: '#2563EB',
          darker: '#1E293B',
          light: '#60A5FA',
        },
        fitness: {
          dark: '#1E293B',
          darker: '#1E293B',
          light: '#F1F5F9',
          accent: '#38BDF8',
          warning: '#FBBF24',
          error: '#EF4444',
        },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)'],
        mono: ['var(--font-geist-mono)'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
