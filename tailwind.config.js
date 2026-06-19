/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        mine: {
          bg: "#0A1628",
          panel: "#1E2A3A",
          panel2: "#141F2E",
          border: "#2A3A50",
          accent: "#FF7A1A",
          danger: "#E53935",
          warning: "#FFB300",
          success: "#43A047",
          info: "#29B6F6",
        },
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', "system-ui", "sans-serif"],
        display: ['Orbitron', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.4)',
        'glow-orange': '0 0 24px rgba(255, 122, 26, 0.5)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};
