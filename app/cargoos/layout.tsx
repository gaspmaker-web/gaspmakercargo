import type { Metadata } from 'next';
import '../globals.css';

export const metadata: Metadata = {
  title: 'CargoOS Admin',
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
};

export default function CargoOSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-950">{children}</body>
    </html>
  );
}