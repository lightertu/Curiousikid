/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          blue: '#3B82F6',
          dark: '#1E40AF',
        },
        alert: {
          red: '#EF4444',
          yellow: '#F59E0B',
          green: '#10B981',
        },
        category: {
          friends: '#8B5CF6',
          emotions: '#EC4899',
          characters: '#F59E0B',
          learning: '#3B82F6',
          curiosity: '#10B981',
        },
      },
    },
  },
  plugins: [],
}
