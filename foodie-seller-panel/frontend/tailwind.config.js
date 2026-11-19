/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Foodie red from the app logo
        brand: {
          50: '#fdf0f1',
          100: '#fbe1e3',
          200: '#f7c3c8',
          500: '#e0394a',
          600: '#dc3545',
          700: '#b92a38',
        },
        ink: '#1c1c1c', // splash / dark buttons
        surface: '#f7f8fa', // app background
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,.04), 0 6px 18px rgba(16,24,40,.07)',
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
