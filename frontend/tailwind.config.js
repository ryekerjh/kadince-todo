/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        kadince: {
          pink: '#FFF5F5',
          lime: '#B5D43C',
          charcoal: '#2D2D2D',
          blue: '#0066FF',
          green: '#00B67A',
          gray: {
            50: '#F9F9F9',
            100: '#F5F5F5',
            200: '#EEEEEE',
            300: '#E0E0E0',
            400: '#BDBDBD',
            500: '#999999',
            600: '#666666',
            700: '#444444',
            800: '#2D2D2D',
            900: '#1A1A1A',
          }
        }
      }
    },
  },
  plugins: [],
} 