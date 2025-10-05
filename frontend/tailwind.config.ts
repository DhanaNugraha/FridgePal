import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Base colors
        border: 'hsl(var(--border)',
        input: 'hsl(var(--input)',
        ring: 'hsl(var(--ring)',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        
        // Primary color - Warm orange-red
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          50: 'hsl(10, 90%, 98%)',
          100: 'hsl(10, 90%, 95%)',
          200: 'hsl(10, 90%, 90%)',
          300: 'hsl(10, 90%, 80%)',
          400: 'hsl(10, 90%, 70%)',
          500: 'hsl(10, 90%, 60%)',
          600: 'hsl(10, 90%, 50%)',
          700: 'hsl(10, 90%, 40%)',
          800: 'hsl(10, 90%, 30%)',
          900: 'hsl(10, 90%, 20%)',
          950: 'hsl(10, 90%, 10%)',
        },
        
        // Secondary color - Warm yellow
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
          50: 'hsl(40, 90%, 98%)',
          100: 'hsl(40, 90%, 95%)',
          200: 'hsl(40, 90%, 90%)',
          300: 'hsl(40, 90%, 80%)',
          400: 'hsl(40, 90%, 70%)',
          500: 'hsl(40, 90%, 60%)',
          600: 'hsl(40, 90%, 50%)',
          700: 'hsl(40, 90%, 40%)',
          800: 'hsl(40, 90%, 30%)',
          900: 'hsl(40, 90%, 20%)',
          950: 'hsl(40, 90%, 10%)',
        },
        
        // Accent color - Warm green
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
          50: 'hsl(80, 60%, 98%)',
          100: 'hsl(80, 60%, 95%)',
          200: 'hsl(80, 60%, 90%)',
          300: 'hsl(80, 60%, 80%)',
          400: 'hsl(80, 60%, 70%)',
          500: 'hsl(80, 60%, 60%)',
          600: 'hsl(80, 60%, 50%)',
          700: 'hsl(80, 60%, 40%)',
          800: 'hsl(80, 60%, 30%)',
          900: 'hsl(80, 60%, 20%)',
          950: 'hsl(80, 60%, 10%)',
        },
        
        // Destructive color - Warm red
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        
        // Muted colors
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        
        // Card colors
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        
        // Popover colors
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
      },
      
      // Font families
      fontFamily: {
        sans: ['var(--font-inter)'],
        serif: ['var(--font-playfair-display)', 'Georgia', 'serif'],
        heading: ['var(--font-playfair-display)', 'Georgia', 'serif'],
      },
      
      // Border radius
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'fade-out': 'fadeOut 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'slide-in-from-top': 'slideInFromTop 0.2s ease-out',
        'slide-in-from-bottom': 'slideInFromBottom 0.2s ease-out',
        'slide-in-from-left': 'slideInFromLeft 0.2s ease-out',
        'slide-in-from-right': 'slideInFromRight 0.2s ease-out',
        'zoom-in': 'zoomIn 0.2s ease-out',
        'zoom-out': 'zoomOut 0.2s ease-out',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        fadeOut: { '0%': { opacity: '1' }, '100%': { opacity: '0' } },
        slideUp: { '0%': { transform: 'translateY(20px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        slideDown: { '0%': { transform: 'translateY(-20px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        slideInFromTop: { '0%': { transform: 'translateY(-10px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        slideInFromBottom: { '0%': { transform: 'translateY(10px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        slideInFromLeft: { '0%': { transform: 'translateX(-10px)', opacity: '0' }, '100%': { transform: 'translateX(0)', opacity: '1' } },
        slideInFromRight: { '0%': { transform: 'translateX(10px)', opacity: '0' }, '100%': { transform: 'translateX(0)', opacity: '1' } },
        zoomIn: { '0%': { transform: 'scale(0.95)', opacity: '0' }, '100%': { transform: 'scale(1)', opacity: '1' } },
        zoomOut: { '0%': { transform: 'scale(1)', opacity: '1' }, '100%': { transform: 'scale(0.95)', opacity: '0' } },
      }
    },
  },
  // Dark mode configuration
  darkMode: ['class'],
  
  // Container configuration
  container: {
    center: true,
    padding: '2rem',
    screens: {
      '2xl': '1400px',
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms')
  ],
};

export default config;
