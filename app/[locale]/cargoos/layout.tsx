import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CargoOS — Freight Infrastructure',
  description: 'The Operating System for Logistics Businesses',
  icons: {
    icon: '/brand/cargoos-favicon.png',
  },
  manifest: '/cargoos-manifest.json',
};

export default function CargoOSLocaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}