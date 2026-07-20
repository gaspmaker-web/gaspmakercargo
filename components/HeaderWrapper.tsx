"use client";

import { usePathname } from "next/navigation";

interface HeaderWrapperProps {
  children: React.ReactNode;
  tenantSlug?: string;
}

export default function HeaderWrapper({ children, tenantSlug }: HeaderWrapperProps) {
  const pathname = usePathname();

  // 🏢 Si es CargoOS, no mostrar header
  if (tenantSlug === 'cargoos') return null;

  const privateZones = [
    '/dashboard-admin',
    '/dashboard-driver',
  ];

  const isPrivateZone = privateZones.some((zone) => pathname?.includes(zone));
  if (isPrivateZone) return null;

  return <>{children}</>;
}