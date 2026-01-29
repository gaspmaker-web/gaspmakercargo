"use client";

import { usePathname } from "next/navigation";

export default function HeaderWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // 1. Definimos las "Zonas Privadas" (Donde trabajamos)
  // Cualquier ruta que contenga estas palabras ocultará el Header público
  const privateZones = [
    '/dashboard-admin',    // Cubre Admin y Warehouse
    '/dashboard-cliente',  // Cubre Clientes
    '/dashboard-driver'    // Cubre Choferes
  ];

  // 2. Lógica: ¿Estoy en una zona privada?
  const isPrivateZone = privateZones.some((zone) => pathname.includes(zone));

  // Si es zona privada, ocultamos el Header (return null)
  // Así el usuario se enfoca 100% en el Sidebar y su trabajo
  if (isPrivateZone) return null;

  // Si no (está en Home, Login, Contacto), mostramos el Header normal
  return <>{children}</>;
}