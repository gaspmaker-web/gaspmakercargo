import React from 'react';
import AdminSidebar from '@/components/dashboard/AdminSidebar';

export default function DashboardAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 1. Sidebar Fijo a la Izquierda */}
      <AdminSidebar />

      {/* 2. Contenido Principal (A la derecha del Sidebar) */}
      <main className="pl-64 transition-all duration-300">
        <div className="p-8">
            {children}
        </div>
      </main>
    </div>
  );
}