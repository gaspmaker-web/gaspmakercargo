import React from 'react';
import AdminSidebar from '@/components/dashboard/AdminSidebar';
import AdminMobileHeader from '@/components/dashboard/AdminMobileHeader';
import AdminBottomNav from '@/components/dashboard/AdminBottomNav';
import { SidebarProvider } from '@/lib/admin-sidebar-context';

export default function DashboardAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gray-50">
        <AdminSidebar />
        <AdminMobileHeader />
        <AdminBottomNav />
        <main className="md:pl-64 transition-all duration-300">
          <div className="p-4 md:p-8 pt-16 md:pt-8 pb-20 md:pb-8">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}