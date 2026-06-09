import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        green: {
          DEFAULT: "#1e3d2f",
          dark: "#152d22",
          light: "#2d5a42",
          muted: "#4a7c5f",
        },
        cream: {
          DEFAULT: "#f5f0e8",
          dark: "#ede7d9",
          light: "#faf7f2",
        },
        gold: {
          DEFAULT: "#c4a35a",
          light: "#d4b87a",
          dark: "#a8883e",
        },
      },
      fontFamily: {
        serif: ["Georgia", "Times New Roman", "serif"],
        sans: ["Georgia", "Times New Roman", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
