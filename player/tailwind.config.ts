import type { Config } from "tailwindcss";

const config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@livekit/components-react/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {},
  plugins: [
    require('tailwindcss-animate'),
    require('tailwindcss-react-aria-components'),
  ],
};
export default config;