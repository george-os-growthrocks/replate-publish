import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          glow: "hsl(var(--primary-glow))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        // 🌐 Platform-specific colors
        linkedin: "hsl(201 100% 45%)",
        twitter: "hsl(203 89% 63%)",
        instagram: "hsl(330 80% 60%)",
        reddit: "hsl(16 100% 60%)",
        medium: "hsl(0 0% 90%)",
        quora: "hsl(357 75% 63%)",
        youtube: "hsl(0 100% 60%)",
        tiktok: "hsl(349 100% 60%)",
      },
      borderRadius: {
        lg: "1rem", // 16px
        md: "0.875rem", // 14px
        sm: "0.75rem", // 12px
      },
      backgroundImage: {
        // Brand gradients (same for both modes)
        'gradient-primary': 'linear-gradient(135deg, hsl(217 91% 60%) 0%, hsl(142 69% 58%) 100%)',
        'gradient-secondary': 'linear-gradient(135deg, hsl(142 76% 36%) 0%, hsl(158 64% 52%) 100%)',
        'gradient-accent': 'linear-gradient(135deg, hsl(217 91% 60%) 0%, hsl(217 91% 70%) 100%)',
        // Light mode gradients
        'gradient-hero-light': 'linear-gradient(180deg, hsl(210 20% 98%) 0%, hsl(217 91% 95%) 100%)',
        'gradient-card-light': 'linear-gradient(135deg, hsl(0 0% 100%) 0%, hsl(210 20% 99%) 100%)',
        // Dark mode gradients
        'gradient-hero-dark': 'linear-gradient(180deg, hsl(222 47% 11%) 0%, hsl(217 91% 18%) 100%)',
        'gradient-card-dark': 'linear-gradient(135deg, hsl(217 19% 15%) 0%, hsl(217 19% 17%) 100%)',
      },
      boxShadow: {
        'soft': 'var(--shadow-soft)',
        'medium': 'var(--shadow-medium)',
        'strong': 'var(--shadow-strong)',
        'glow': 'var(--shadow-glow)',
        'xl': 'var(--shadow-xl)',
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
