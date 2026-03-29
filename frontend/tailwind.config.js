/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      backgroundImage: {
        "app-gradient":
          "radial-gradient(circle at 8% 10%, rgba(251,191,36,0.2), transparent 35%), radial-gradient(circle at 95% 0%, rgba(34,211,238,0.25), transparent 30%), linear-gradient(180deg, #fffaf2 0%, #fff 45%, #f7f7fb 100%)",
        "app-gradient-dark":
          "radial-gradient(circle at 8% 10%, rgba(249,115,22,0.16), transparent 35%), radial-gradient(circle at 95% 0%, rgba(6,182,212,0.2), transparent 30%), linear-gradient(180deg, #0f172a 0%, #111827 45%, #020617 100%)",
      },
    },
  },
  plugins: [],
}

