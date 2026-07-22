/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    'bg-blue-100', 'text-blue-800',
    'bg-purple-100', 'text-purple-800',
    'bg-amber-100', 'text-amber-800',
    'bg-yellow-100', 'text-yellow-800',
    'bg-green-100', 'text-green-800',
    'bg-red-100', 'text-red-800',
    'bg-gray-100', 'text-gray-800',
  ],
  theme: {
    extend: {
      colors: {
        'gasp-maker-gold': 'var(--gasp-maker-gold)',
        'gasp-maker-dark-gray': 'var(--gasp-maker-dark-gray)',
        'gasp-maker-light-beige': 'var(--gasp-maker-light-beige)',
        'gasp-maker-white': 'var(--gasp-maker-white)',
        'gasp-maker-black': 'var(--gasp-maker-black)',
        'gasp-maker-very-light-gray': 'var(--gasp-maker-very-light-gray)',
        'gmc-dorado-principal': '#F4DBA7',
        'gmc-gris-oscuro': '#2D3748',
        'gmc-beige-claro': '#F7F4F0',
      },
    },
  },
  plugins: [],
}
