import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CargoOS — Freight Infrastructure',
  description: 'The Operating System for Logistics Businesses',
  icons: {
    icon: '/favicon.png',
  },
};

export default function CargoOSLocaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}