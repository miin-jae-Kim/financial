/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
      },
      colors: {
        terminal: {
          bg: '#0a0a0f',
          surface: '#12121a',
          border: '#1e1e2e',
          green: '#00ff9f',
          red: '#ff3366',
          yellow: '#ffd93d',
          blue: '#6366f1',
          cyan: '#22d3ee',
          muted: '#6b7280',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0, 255, 159, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(0, 255, 159, 0.4)' },
        }
      }
    },
  },
  plugins: [],
}
