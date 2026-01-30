import React from 'react';
import AdminSidebar from '@/components/dashboard/AdminSidebar';

export default function DashboardAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 1. Sidebar Fijo a la Izquierda (Responsivo) */}
      <AdminSidebar />

      {/* 2. Contenido Principal (A la derecha del Sidebar) */}
      {/* 🔥 CORRECCIÓN CLAVE: 
          - 'md:pl-64': En PC deja el hueco para el sidebar. En Móvil (iPhone) el padding es 0.
          - 'transition-all': Suaviza el cambio si redimensionas la ventana.
      */}
      <main className="md:pl-64 transition-all duration-300">
        
        {/* Ajustamos también el padding interno: p-4 en móvil, p-8 en PC */}
        <div className="p-4 md:p-8 pt-16 md:pt-8">
            {children}
        </div>
      </main>
    </div>
  );
}