/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#1877F2',
          hover: '#166FE5',
        },
        canvas: '#F0F2F5',
        surface: '#FFFFFF',
        border: '#DADDE1',
        divider: '#E4E6EB',
        text: {
          primary: '#1C1E21',
          secondary: '#65676B',
          muted: '#8A8D91',
        },
        success: '#4CAF50',
        warning: '#FFC107',
        danger: '#E41E3F',
        info: '#2196F3',
      },
      spacing: {
        'sp-2': '8px',
        'sp-3': '12px',
        'sp-4': '16px',
        'sp-5': '20px',
        'sp-6': '24px',
      },
      borderRadius: {
        'card': '12px',
        'md': '8px',
        'pill': '9999px',
      },
      boxShadow: {
        'sh-1': '0 2px 4px rgba(0,0,0,0.1)',
        'sh-2': '0 4px 12px rgba(0,0,0,0.12)',
      },
      fontSize: {
        '11': '11px',
        '12': '12px',
        '14': '14px',
        '16': '16px',
        '20': '20px',
        '24': '24px',
        '28': '28px',
      },
    },
  },
  plugins: [],
}

