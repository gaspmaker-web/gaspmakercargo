import React from 'react';
import AdminSidebar from '@/components/dashboard/AdminSidebar';
import AdminMobileHeader from '@/components/dashboard/AdminMobileHeader';
import AdminBottomNav from '@/components/dashboard/AdminBottomNav';

export default function DashboardAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar — desktop */}
      <AdminSidebar />

      {/* Header móvil — fijo arriba */}
      <AdminMobileHeader />

      {/* Bottom navbar — fijo abajo en móvil */}
      <AdminBottomNav />

      {/* Contenido principal */}
      <main className="md:pl-64 transition-all duration-300">
        <div className="p-4 md:p-8 pt-16 md:pt-8 pb-20 md:pb-8">
          {children}
        </div>
      </main>
    </div>
  );
}