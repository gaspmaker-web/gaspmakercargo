// 1. FORZAR MODO DINÁMICO
// Esta línea es obligatoria para que el build no intente generar esto estáticamente.
export const dynamic = 'force-dynamic';

export default function AccountSettingsPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Configuración de Cuenta</h1>
      <p>Cargando configuración...</p>
    </div>
  );
}