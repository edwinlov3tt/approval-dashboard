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
          DEFAULT: 'var(--brand)',
          hover: 'var(--brand-hover)',
        },
        canvas: 'var(--bg-canvas)',
        surface: {
          DEFAULT: 'var(--bg-surface)',
          100: '#F5F6F7',
          200: '#E4E6EB',
          300: '#DADDE1',
          400: '#BCC0C4',
          50: '#F9FAFB',
        },
        border: 'var(--border)',
        divider: 'var(--divider)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        primary: {
          DEFAULT: 'var(--brand)',
          500: 'var(--brand)',
          600: 'var(--brand)',
          700: 'var(--brand-hover)',
        },
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger: 'var(--danger)',
        link: 'var(--link)',
      },
      spacing: {
        'sp-2': 'var(--sp-2)',
        'sp-3': 'var(--sp-3)',
        'sp-4': 'var(--sp-4)',
        'sp-5': 'var(--sp-5)',
        'sp-6': 'var(--sp-6)',
      },
      borderRadius: {
        'card': 'var(--r-card)',
        'md': 'var(--r-md)',
        'pill': 'var(--r-pill)',
      },
      boxShadow: {
        'sh-1': 'var(--sh-1)',
        'sh-2': 'var(--sh-2)',
      },
      fontSize: {
        '11': 'var(--fs-11)',
        '12': 'var(--fs-12)',
        '14': 'var(--fs-14)',
        '16': 'var(--fs-16)',
        '20': 'var(--fs-20)',
        '24': '24px',
        '28': '28px',
      },
      lineHeight: {
        '14': 'var(--lh-14)',
        '18': 'var(--lh-18)',
        '20': 'var(--lh-20)',
        '22': 'var(--lh-22)',
        '28': 'var(--lh-28)',
      },
    },
  },
  plugins: [],
}

