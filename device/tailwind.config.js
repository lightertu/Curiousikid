/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'spin-slow': 'rotation 20s infinite linear',
      },
      keyframes: {
        rotation: {
          'from': { transform: 'rotate(0deg)' },
          'to': { transform: 'rotate(359deg)' },
        },
      },
      colors: {
        'lightblue': '#add8e6',
        'pink': '#ffc0cb',
      },
      theme: {
        extend: {
          colors: {
            khaki: '#F0E68C', // Add this line
          },
        },
      },
    },
  },
  plugins: [],
} 