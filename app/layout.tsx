import React from 'react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html style={{ backgroundColor: '#222b3c' }}>
      <body>
        {children}
      </body>
    </html>
  );
}