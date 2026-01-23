/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // --- TUS COLORES ORIGINALES (Variables CSS) ---
        'gasp-maker-gold': 'var(--gasp-maker-gold)',
        'gasp-maker-dark-gray': 'var(--gasp-maker-dark-gray)',
        'gasp-maker-light-beige': 'var(--gasp-maker-light-beige)',
        'gasp-maker-white': 'var(--gasp-maker-white)',
        'gasp-maker-black': 'var(--gasp-maker-black)',
        'gasp-maker-very-light-gray': 'var(--gasp-maker-very-light-gray)',

        // --- 👇 COLORES AÑADIDOS PARA EL HEADER/DASHBOARD (Hexadecimales) 👇 ---
        // Esto soluciona que el botón de perfil no sea dorado (#F4DBA7)
        'gmc-dorado-principal': '#F4DBA7', // Color solicitado
        'gmc-gris-oscuro': '#2D3748',    // Color del texto y fondo del header
        'gmc-beige-claro': '#F7F4F0',    // Color de fondo del perfil
      },
    },
  },
  plugins: [],
}
