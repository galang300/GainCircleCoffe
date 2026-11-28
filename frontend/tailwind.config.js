/** Token desain Gain Circle (turunan gaincoffeecircle.com + hasil Figma tim) */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        orange: '#CA5C34', ink: '#171210', cream: '#F2EDDE', neon: '#75F237', blue: '#2649D2',
        yellow: '#FDD923', pink: '#FC2685', card: '#F8F3ED', beige: '#E9DFCE', rust: '#9B3A22',
        line: '#D5CAB4', muted: '#6E655C', danger: '#E01E78',
      },
      fontFamily: {
        display: ['Anton', 'Archivo Narrow', 'Impact', 'sans-serif'],
        body: ['Archivo', 'Helvetica Neue', 'Arial', 'sans-serif'],
        serif: ['Tinos', 'Times New Roman', 'serif'],
      },
      borderRadius: { none: '0', DEFAULT: '0' },
      boxShadow: {
        card: '8px 8px 0 #171210', cardsm: '5px 5px 0 #171210', btn: '4px 4px 0 #171210',
      },
      maxWidth: { page: '1296px' },
      screens: { xs: '420px' },
      keyframes: {
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        pop: { '0%': { transform: 'translateY(8px)', opacity: 0 }, '100%': { transform: 'none', opacity: 1 } },
      },
      animation: { pop: 'pop .18s ease-out' },
    },
  },
  plugins: [],
}
