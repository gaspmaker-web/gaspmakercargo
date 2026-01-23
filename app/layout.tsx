import React from 'react';

// Este layout es el contenedor técnico raíz que exige Next.js 14+.
// Debe tener <html> y <body> para que la aplicación no de error de compilación.
// El contenido real y los estilos se manejan en app/[locale]/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>
        {children}
      </body>
    </html>
  );
}