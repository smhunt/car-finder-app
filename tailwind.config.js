/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // Tally-inspired color palette
      colors: {
        // Primary brand colors
        tally: {
          blue: '#635bff',
          'blue-dark': '#5046e5',
          pink: '#f5a9c1',
          coral: '#ff6b6b',
          mint: '#6cc4a1',
        },
        // Neutral palette
        fog: '#f8fafc',
        charcoal: '#1a1a2e',
      },

      // Typography
      fontFamily: {
        display: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },

      // Border radius
      borderRadius: {
        'sm': '0.25rem',
        'md': '0.5rem',
        'lg': '0.75rem',
        'xl': '1rem',
        '2xl': '1.5rem',
        'full': '9999px',
      },

      // Custom shadows
      boxShadow: {
        'tally-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'tally-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'tally-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'tally-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'tally-glow': '0 0 40px rgba(99, 91, 255, 0.15)',
        'tally-glow-pink': '0 0 40px rgba(245, 169, 193, 0.2)',
      },

      // Animation
      animation: {
        'fade-up': 'fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(99, 91, 255, 0.2)' },
          '50%': { boxShadow: '0 0 40px rgba(99, 91, 255, 0.4)' },
        },
      },

      // Background gradients
      backgroundImage: {
        'tally-gradient': 'linear-gradient(135deg, #635bff 0%, #f5a9c1 100%)',
        'tally-subtle': 'radial-gradient(ellipse at top, rgba(99, 91, 255, 0.1) 0%, transparent 60%)',
        'tally-mesh': 'radial-gradient(at 40% 20%, rgba(99, 91, 255, 0.2) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(245, 169, 193, 0.2) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(108, 196, 161, 0.1) 0px, transparent 50%)',
      },
    },
  },
  plugins: [],
}
