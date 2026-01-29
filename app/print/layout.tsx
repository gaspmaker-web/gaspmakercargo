import React from 'react';

export const metadata = {
  title: 'Imprimir Etiqueta',
};

export default function PrintLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body style={{ margin: 0, padding: 0, backgroundColor: 'white' }}>
        {children}
      </body>
    </html>
  );
}