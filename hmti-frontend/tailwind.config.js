/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{vue,js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          // Light mode palette
          cream: '#F9ECCC',
          'cream-dark': '#F2DFA0',
          'cream-light': '#FEF9ED',
          'primary-blue': {
            DEFAULT: '#2E87F6',
            dark: '#1a6fd4',
            light: '#6fb0fa',
          },
          'accent-orange': {
            DEFAULT: '#F35C2B',
            dark: '#d44516',
            light: '#f7896a',
          },
        },
      },
    },
    plugins: [],
  }
