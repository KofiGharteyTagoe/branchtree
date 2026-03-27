/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        mendix: {
          blue: '#0595DD',
          dark: '#1A2332',
          gray: '#F5F7FA',
        },
        branch: {
          main: '#0595DD',
          feature: '#2ECC71',
          release: '#F39C12',
          hotfix: '#E74C3C',
          development: '#9B59B6',
          unknown: '#95A5A6',
        },
      },
    },
  },
  plugins: [],
};
