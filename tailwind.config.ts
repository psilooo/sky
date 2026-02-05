import type { Config } from 'tailwindcss'

export default {
  content: [],
  theme: {
    extend: {
      colors: {
        dark: '#0a0a0a',
        'dark-lighter': '#141414',
        'dark-card': '#161616',
        accent: '#00e5ff',
        'accent-glow': 'rgba(0, 229, 255, 0.3)',
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'sans-serif'],
        body: ['"Space Grotesk"', 'sans-serif'],
        logo: ['"Anton"', 'sans-serif'],
      },
    },
  },
} satisfies Config
