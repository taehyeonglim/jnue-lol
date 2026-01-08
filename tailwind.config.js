/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // LOL 테마 컬러
        'lol-gold': '#C89B3C',
        'lol-blue': '#0AC8B9',
        'lol-dark': '#010A13',
        'lol-darker': '#0A1428',
        'lol-light': '#F0E6D3',
        // 티어 컬러
        'tier-bronze': '#CD7F32',
        'tier-silver': '#C0C0C0',
        'tier-gold': '#FFD700',
        'tier-platinum': '#00CED1',
        'tier-diamond': '#B9F2FF',
        'tier-master': '#9D4DFF',
        'tier-challenger': '#F4C874',
      },
      fontFamily: {
        'gaming': ['Noto Sans KR', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-pattern': 'linear-gradient(135deg, #0A1428 0%, #010A13 100%)',
      }
    },
  },
  plugins: [],
}
