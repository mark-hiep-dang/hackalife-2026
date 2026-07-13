/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          main: '#fafafa',
          card: '#ffffff',
          subtle: '#f4f4f5'
        },
        border: {
          DEFAULT: '#e4e4e7',
          hover: '#d4d4d8'
        },
        primary: {
          DEFAULT: '#ef4444',
          dark: '#dc2626',
          subtle: 'rgba(239, 68, 68, 0.08)'
        },
        success: {
          DEFAULT: '#22c55e',
          dark: '#16a34a',
          subtle: 'rgba(34, 197, 94, 0.08)'
        },
        info: {
          DEFAULT: '#3b82f6',
          dark: '#2563eb',
          subtle: 'rgba(59, 130, 246, 0.08)'
        },
        warning: {
          DEFAULT: '#f59e0b',
          dark: '#d97706',
          subtle: 'rgba(245, 158, 11, 0.08)'
        },
        danger: {
          DEFAULT: '#ef4444',
          dark: '#dc2626'
        }
      }
    },
  },
  plugins: [],
}
