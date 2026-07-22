/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
safelist: [
  'bg-blue-900', 'text-blue-300',
  'bg-purple-900', 'text-purple-300',
  'bg-amber-900', 'text-amber-300',
  'bg-yellow-900', 'text-yellow-300',
  'bg-green-900', 'text-green-300',
  'bg-red-900', 'text-red-300',
  'bg-gray-800', 'text-gray-400',
  'bg-gray-700', 'text-gray-300',
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
