/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["JetBrains Mono", "ui-monospace", "monospace"],
        display: ["Space Grotesk", "system-ui", "sans-serif"],
      },
      colors: {
        ic: {
          green: "#00d4aa",
          dark: "#0a0a0f",
          panel: "#12121a",
          border: "#1e1e2e",
        },
      },
    },
  },
  plugins: [],
};
