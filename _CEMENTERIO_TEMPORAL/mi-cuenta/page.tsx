import React from 'react';

// 🛑 ESTA LÍNEA ES LA CLAVE. SI NO ESTÁ, EL BUILD FALLARÁ.
// Le dice a Next.js: "Nunca intentes construir esta página en el servidor de build. Hazlo en vivo".
export const dynamic = 'force-dynamic';

// Opcional: Si tienes 'generateStaticParams' en este archivo, BORRALO. 
// Choca con force-dynamic.

export default function AccountSettingsPage() {
  return (
    <div className="p-8 text-center">
      <h1 className="text-2xl font-bold mb-4">Configuración de Cuenta</h1>
      <p>Cargando panel de usuario...</p>
    </div>
  );
}