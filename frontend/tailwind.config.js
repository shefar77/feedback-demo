module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        accent: '#c8441a',
        'accent-hover': '#a83612',
        'accent-light': '#fdf0ec',
        gold: '#c49a2a',
        'gold-light': '#fdf8ec',
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        display: ['Fraunces', 'serif'],
      },
      scale: { 115: '1.15' },
      boxShadow: {
        card: '0 2px 24px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)',
      },
    },
  },
  plugins: [],
};