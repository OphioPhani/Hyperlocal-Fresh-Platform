/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        soil: "#4F3B2A",
        leaf: "#2E7D32",
        mango: "#F4A300",
        sky: "#CFE8FF"
      },
      borderRadius: {
        soft: "1.25rem"
      },
      boxShadow: {
        panel: "0 12px 25px rgba(0, 0, 0, 0.08)"
      }
    }
  },
  plugins: []
};
