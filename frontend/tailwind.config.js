/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          background: '#0f1419',
          surface: '#1a2332',
          surfaceElevated: '#243447',
          cyan: '#00d9ff',
          cyanGlow: 'rgba(0, 217, 255, 0.2)'
        },
        text: {
          primary: '#ffffff',
          secondary: '#8b9bb3',
          muted: '#5a6b82'
        },
        status: {
          success: '#00ff88',
          warning: '#ff9500',
          error: '#ff3b5c',
          info: '#9b7dff'
        },
        chart: {
          primary: '#00d9ff',
          secondary: '#4a5f7f',
          background: 'rgba(0, 217, 255, 0.05)'
        },
        border: '#e5e7eb'
      },
      fontFamily: {
        primary: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      fontSize: {
        xs: '11px',
        sm: '13px',
        base: '14px',
        lg: '16px',
        xl: '20px',
        '2xl': '24px',
        '3xl': '32px',
        '4xl': '42px'
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        '2xl': '48px'
      },
      borderRadius: {
        sm: '6px',
        md: '12px',
        lg: '16px',
        full: '9999px'
      },
      boxShadow: {
        sm: '0 2px 8px rgba(0, 0, 0, 0.15)',
        md: '0 4px 16px rgba(0, 0, 0, 0.25)',
        lg: '0 8px 32px rgba(0, 0, 0, 0.35)',
        glow: '0 0 24px rgba(0, 217, 255, 0.4)'
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.4s ease-out',
        'draw-path': 'drawPath 1.2s ease-in-out',
        'fill': 'fill 1s ease-out'
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        drawPath: {
          '0%': { strokeDasharray: '1000', strokeDashoffset: '1000' },
          '100%': { strokeDasharray: '1000', strokeDashoffset: '0' }
        },
        fill: {
          '0%': { width: '0%' },
          '100%': { width: 'var(--width)' }
        }
      }
    },
  },
  plugins: [],
}
