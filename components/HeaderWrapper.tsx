"use client";

import { usePathname } from "next/navigation";

export default function HeaderWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // 1. Definimos las "Zonas Privadas"
  // En estas rutas NO se mostrará el Header público (Menú Web)
  const privateZones = [
    '/dashboard-admin',    // Cubre Admin y Warehouse
    '/dashboard-driver',   // ✅ Ocultamos también para Driver (ya tiene su propio botón de salir)
  ];

  // 2. Lógica: ¿Estoy en una zona privada?
  // Usamos .some() para ver si la URL actual contiene alguna de las zonas prohibidas
  const isPrivateZone = privateZones.some((zone) => pathname?.includes(zone));

  // Si es zona privada, ocultamos el Header público por completo
  if (isPrivateZone) return null;

  // Para el resto (Cliente, Home, Login), mostramos el Header normal
  return <>{children}</>;
}