import React from 'react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html style={{ backgroundColor: '#222b3c' }}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          document.documentElement.style.background='#222b3c';
          document.documentElement.style.backgroundColor='#222b3c';
        `}} />
      </head>
      <body style={{ backgroundColor: '#222b3c' }}>
        {children}
      </body>
    </html>
  );
}