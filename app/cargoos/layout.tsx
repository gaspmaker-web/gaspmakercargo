import type { Metadata } from 'next';
import '../globals.css';

export const metadata: Metadata = {
  title: 'CargoOS Admin',
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