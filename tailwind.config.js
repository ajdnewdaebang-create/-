export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#172554'
        }
      },
      boxShadow: {
        soft: '0 16px 35px rgba(15, 23, 42, 0.08)'
      }
    }
  },
  plugins: []
};
