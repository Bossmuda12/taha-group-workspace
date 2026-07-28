import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: "class",
    content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
    theme: {
          extend: {
                  colors: {
                            glass: {
                                        50: "rgba(255,255,255,0.85)",
                                        100: "rgba(255,255,255,0.65)",
                                        200: "rgba(255,255,255,0.45)",
                                        300: "rgba(255,255,255,0.25)",
                                        400: "rgba(255,255,255,0.14)",
                                        900: "rgba(10,12,20,0.55)",
                            },
                            accent: {
                                        DEFAULT: "#0A84FF",
                                        purple: "#BF5AF2",
                                        pink: "#FF375F",
                                        teal: "#63E6E2",
                                        orange: "#FF9F0A",
                                        green: "#30D158",
                            },
                            ink: {
                                        900: "#05060A",
                                        800: "#0B0D14",
                                        700: "#12141C",
                            },
                  },
                  fontFamily: {
                            sans: ["var(--font-sans)", "system-ui", "sans-serif"],
                  },
                  backdropBlur: { xs: "2px", "3xl": "48px" },
                  boxShadow: {
                            glass: "0 8px 32px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.35), inset 0 0 0 1px rgba(255,255,255,0.08)",
                            "glass-lg": "0 24px 64px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.3)",
                            glow: "0 0 40px rgba(10,132,255,0.35)",
                  },
                  borderRadius: {
                            "4xl": "2rem",
                            "5xl": "2.5rem",
                  },
                  keyframes: {
                            "fade-up": { "0%": { opacity: "0", transform: "translateY(16px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
                            "scale-in": { "0%": { opacity: "0", transform: "scale(0.92)" }, "100%": { opacity: "1", transform: "scale(1)" } },
                            shimmer: { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
                            float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-10px)" } },
                            "gradient-move": { "0%": { backgroundPosition: "0% 50%" }, "50%": { backgroundPosition: "100% 50%" }, "100%": { backgroundPosition: "0% 50%" } },
                  },
                  animation: {
                            "fade-up": "fade-up 0.6s cubic-bezier(0.16,1,0.3,1) both",
                            "scale-in": "scale-in 0.5s cubic-bezier(0.16,1,0.3,1) both",
                            shimmer: "shimmer 2.5s linear infinite",
                            float: "float 6s ease-in-out infinite",
                            "gradient-move": "gradient-move 8s ease infinite",
                  },
          },
    },
    plugins: [],
};
export default config;
