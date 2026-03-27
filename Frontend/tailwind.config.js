/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: "#3D5A3E",
        caramel: "#B89670",
        ink: "#2C2418",
        sand: "#E8D4C8",
        warm: "#F6F0E6",
        brown: "#6B4E3D",
        blush: "#E9B8A6",
        "accent-caramel": "#C6A27B",
        muted: "#8B7D6B",
      },
      keyframes: {
        float: {
          '0%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px) ' },
          '100%': { transform: 'translateY(0)' },
        }
      },
      animation: {
        float: 'float 4s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
