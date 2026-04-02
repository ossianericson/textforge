import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#07111f',
        surface: '#102238',
        border: '#2d4b69',
        accent: '#14b8a6',
        ink: '#e2ecf5',
        'node-question': '#2f7bf6',
        'node-result': '#14b86f'
      },
      boxShadow: {
        panel: '0 18px 42px rgba(2, 6, 23, 0.35)'
      },
      backgroundImage: {
        'editor-grid': 'radial-gradient(circle at top left, rgba(20,184,166,0.16), transparent 26%), radial-gradient(circle at bottom right, rgba(47,123,246,0.15), transparent 24%)'
      }
    }
  },
  plugins: []
} satisfies Config;