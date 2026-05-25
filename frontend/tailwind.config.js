/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        grimorio: {
          bg: '#110e0c',
          panel: '#1a1512',
          parchment: {
            light: '#f2e6cf',
            DEFAULT: '#e5d4b3',
            dark: '#2d241e'
          },
          gold: {
            light: '#e9d785',
            DEFAULT: '#d4af37',
            dark: '#8c6d31'
          },
          blood: '#9e2a2b',
          blessing: '#2d6a4f'
        }
      },
      fontFamily: {
        cinzelDeco: ['"Cinzel Decorative"', 'serif'],
        cinzel: ['"Cinzel"', 'serif'],
        medieval: ['"MedievalSharp"', 'cursive'],
        garamond: ['"EB Garamond"', 'serif'],
        metamorphic: ['"Metamorphous"', 'serif']
      },
      boxShadow: {
        'rune-glow': '0 0 15px rgba(212, 175, 55, 0.4)',
        'blood-glow': '0 0 15px rgba(158, 42, 43, 0.6)'
      }
    },
  },
  plugins: [],
}
