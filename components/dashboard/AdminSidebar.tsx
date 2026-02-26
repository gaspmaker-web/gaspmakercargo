"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react'; 
import { 
  Package, 
  Truck, 
  Layers, 
  Users, 
  DollarSign, 
  Settings, 
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  Bell // 🔥 1. AGREGAMOS EL ÍCONO DE LA CAMPANITA
} from 'lucide-react';
import { signOut } from 'next-auth/react';

export default function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  
  const [isOpen, setIsOpen] = useState(false);
  
  // Estados de Notificaciones
  const [pendingConsolidations, setPendingConsolidations] = useState(false);
  // 🔥 2. NUEVO ESTADO: Contador de paquetes recién pagados
  const [paidPackagesCount, setPaidPackagesCount] = useState(0);

  const userRole = (session?.user as any)?.role || '';

  // Efecto Maestro: Revisa si hay trabajo o pagos pendientes (Polling cada 60s)
  useEffect(() => {
    const checkPendingWork = async () => {
        try {
            // A. Revisar Consolidaciones
            const resConsolidations = await fetch('/api/admin/consolidations/pending-count', { cache: 'no-store' }); 
            if (resConsolidations.ok) {
                const data = await resConsolidations.json();
                setPendingConsolidations(data.count > 0);
            }

            // 🔥 B. NUEVO: Revisar Paquetes Pagados (Requiere que crees esta API)
            const resPaid = await fetch('/api/admin/packages/paid-count', { cache: 'no-store' });
            if (resPaid.ok) {
                const dataPaid = await resPaid.json();
                setPaidPackagesCount(dataPaid.count || 0);
            }
        } catch (error) {
            console.error("Error verificando notificaciones", error);
        }
    };

    checkPendingWork();
    const interval = setInterval(checkPendingWork, 60000);
    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    { name: "Dashboard", href: "/dashboard-admin", icon: LayoutDashboard, roles: ["ADMIN"] },
    { name: "Paquetes", href: "/dashboard-admin/paquetes", icon: Package, roles: ["ADMIN", "WAREHOUSE"] },
    { name: "Crear Envío", href: "/dashboard-admin/crear-envio", icon: Truck, roles: ["ADMIN", "WAREHOUSE"] },
    { name: "Consolidaciones", href: "/dashboard-admin/consolidaciones", icon: Layers, roles: ["ADMIN", "WAREHOUSE"] },
    { name: "Clientes", href: "/dashboard-admin/clientes", icon: Users, roles: ["ADMIN"] },
    { name: "Finanzas", href: "/dashboard-admin/finanzas", icon: DollarSign, roles: ["ADMIN"] },
    { name: "Configuración", href: "/dashboard-admin/configuracion", icon: Settings, roles: ["ADMIN"] }
  ];

  const allowedLinks = menuItems.filter(item => item.roles.includes(userRole));

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 bg-white p-2 rounded-lg shadow-md border border-gray-200 text-gmc-gris-oscuro"
      >
        <Menu size={24} />
      </button>

      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`
        w-64 bg-white h-screen border-r border-gray-200 flex flex-col fixed left-0 top-0 z-50 transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'} 
        md:translate-x-0 md:shadow-none
      `}>
        
        {/* Header con Campanita */}
        <div className="p-6 border-b border-gray-100 flex flex-col items-center relative">
            
            {/* 🔥 3. CAMPANITA DE NOTIFICACIONES */}
            <Link 
                href="/dashboard-admin/paquetes?filter=pagados" 
                className="absolute top-6 left-4 text-gray-400 hover:text-gmc-dorado-principal transition-colors"
                title="Ver paquetes pagados"
            >
                <Bell size={22} />
                {paidPackagesCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-white">
                        {paidPackagesCount > 99 ? '99+' : paidPackagesCount}
                    </span>
                )}
            </Link>

            <button 
                onClick={() => setIsOpen(false)}
                className="md:hidden absolute top-4 right-4 text-gray-400 hover:text-red-500"
            >
                <X size={20} />
            </button>

            <h2 className="text-2xl font-bold text-gmc-gris-oscuro font-garamond mt-2">GaspMaker</h2>
            <span className={`text-[10px] font-bold px-2 py-1 rounded mt-2 uppercase tracking-widest ${
                userRole === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
            }`}>
                {userRole === 'WAREHOUSE' ? 'BODEGA' : 'ADMINISTRADOR'}
            </span>
        </div>

        {/* Navegación */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {allowedLinks.map((item) => {
            const isActive = pathname === item.href;
            
            // 🔥 Lógica combinada de Alertas
            const showRedDotConsolidations = item.name === "Consolidaciones" && pendingConsolidations;
            const showRedDotPackages = item.name === "Paquetes" && paidPackagesCount > 0;
            const showRedDot = showRedDotConsolidations || showRedDotPackages;

            return (
                <Link 
                    key={item.href} 
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm relative group ${
                        isActive 
                        ? 'bg-gmc-dorado-principal text-white shadow-md' 
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gmc-gris-oscuro'
                    }`}
                >
                    <item.icon size={18} />
                    <span>{item.name}</span>

                    {/* ALERTA VISUAL (PUNTO ROJO) */}
                    {showRedDot && (
                        <span className="ml-auto relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                    )}
                </Link>
            );
            })}
        </nav>

        {/* Footer / Logout */}
        <div className="p-4 border-t border-gray-100">
            <button 
                onClick={() => signOut()}
                className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl w-full transition-colors text-sm font-medium"
            >
                <LogOut size={18} />
                <span>Cerrar Sesión</span>
            </button>
        </div>
      </aside>
    </>
  );
}