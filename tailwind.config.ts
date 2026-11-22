import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        creme: "#FAF7F3",
        areia: "#F3EDE6",
        nude: "#E8DCD0",
        taupe: "#A89886",
        cacau: "#6F5B4B",
        tinta: "#2E2924",
        rose: "#C98B8B",
        roseclaro: "#F4E3E1",
        salvia: "#8FA38A",
        salviaclaro: "#E5ECE2",
        ambar: "#C9A064",
        ambarclaro: "#F6ECD9",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
      },
      borderRadius: { xl2: "1.25rem" },
      boxShadow: {
        suave: "0 1px 2px rgba(46,41,36,0.04), 0 8px 24px rgba(46,41,36,0.05)",
      },
    },
  },
  plugins: [],
};

export default config;
