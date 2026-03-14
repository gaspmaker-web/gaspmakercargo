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
  Bell, 
  Zap,
  AlertCircle // Añadido icono para pre-alertas
} from 'lucide-react';
import { signOut } from 'next-auth/react';

export default function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  
  const [isOpen, setIsOpen] = useState(false);
  
  // Estados de Notificaciones
  const [pendingConsolidations, setPendingConsolidations] = useState(false);
  const [paidPackagesCount, setPaidPackagesCount] = useState(0);
  const [preAlertsCount, setPreAlertsCount] = useState(0); // 🔥 NUEVO ESTADO PARA PRE-ALERTAS

  const userRole = (session?.user as any)?.role || '';

  // Filtro de seguridad para el idioma
  const segment = pathname.split('/')[1];
  const validLocales = ['es', 'en', 'fr', 'pt'];
  const currentLocale = validLocales.includes(segment) ? segment : 'es';

  // Efecto Maestro: Revisa si hay trabajo o pagos pendientes
  useEffect(() => {
    const checkPendingWork = async () => {
        try {
            // 1. Consolidaciones
            const resConsolidations = await fetch('/api/admin/consolidations/pending-count', { cache: 'no-store' }); 
            if (resConsolidations.ok) {
                const data = await resConsolidations.json();
                setPendingConsolidations(data.count > 0);
            }

            // 2. Paquetes Pagados (Salidas)
            const resPaid = await fetch('/api/admin/packages/paid-count', { cache: 'no-store' });
            if (resPaid.ok) {
                const dataPaid = await resPaid.json();
                setPaidPackagesCount(dataPaid.count || 0);
            }

            // 🔥 3. NUEVO: Pre-Alertas Entrantes
            const resPreAlerts = await fetch('/api/admin/packages/prealerts-count', { cache: 'no-store' });
            if (resPreAlerts.ok) {
                const dataPreAlerts = await resPreAlerts.json();
                setPreAlertsCount(dataPreAlerts.count || 0);
            }

        } catch (error) {
            console.error("Error verificando notificaciones", error);
        }
    };

    checkPendingWork();
    const interval = setInterval(checkPendingWork, 60000); // Revisa cada 60 seg
    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    { name: "Dashboard", href: `/${currentLocale}/dashboard-admin`, icon: LayoutDashboard, roles: ["ADMIN"] },
    { name: "Paquetes", href: `/${currentLocale}/dashboard-admin/paquetes`, icon: Package, roles: ["ADMIN", "WAREHOUSE"] },
    { name: "Crear Envío", href: `/${currentLocale}/dashboard-admin/crear-envio`, icon: Truck, roles: ["ADMIN", "WAREHOUSE"] },
    { name: "Pay & Go", href: `/${currentLocale}/dashboard-admin/pay-and-go`, icon: Zap, roles: ["ADMIN", "WAREHOUSE"] }, 
    { name: "Consolidaciones", href: `/${currentLocale}/dashboard-admin/consolidaciones`, icon: Layers, roles: ["ADMIN", "WAREHOUSE"] },
    { name: "Clientes", href: `/${currentLocale}/dashboard-admin/clientes`, icon: Users, roles: ["ADMIN"] },
    { name: "Finanzas", href: `/${currentLocale}/dashboard-admin/finanzas`, icon: DollarSign, roles: ["ADMIN"] },
    { name: "Configuración", href: `/${currentLocale}/dashboard-admin/configuracion`, icon: Settings, roles: ["ADMIN"] }
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
        
        {/* Header con Campanitas */}
        <div className="p-6 pt-14 border-b border-gray-100 flex flex-col items-center relative">
            
            {/* GRUPO DE ALERTAS (Centradas en la parte superior) */}
            <div className="absolute top-4 left-0 w-full flex justify-center items-center gap-6">
                
                {/* CAMPANITA 1: PAGADOS (SALIDAS) - Roja */}
                <Link 
                    href={`/${currentLocale}/dashboard-admin/paquetes?filter=pagados`} 
                    className="relative p-1.5 bg-red-50 rounded-full text-red-400 hover:text-red-600 hover:bg-red-100 transition-all shadow-sm border border-red-100"
                    title="Ver paquetes pagados listos para envío"
                >
                    <Bell size={20} />
                    {paidPackagesCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-md ring-2 ring-white">
                            {paidPackagesCount > 99 ? '99+' : paidPackagesCount}
                        </span>
                    )}
                </Link>

                {/* CAMPANITA 2: PRE-ALERTAS (ENTRADAS) - Morada */}
                <Link 
                    href={`/${currentLocale}/dashboard-admin/paquetes?filter=prealertas`} 
                    className="relative p-1.5 bg-purple-50 rounded-full text-purple-500 hover:text-purple-700 hover:bg-purple-100 transition-all shadow-sm border border-purple-100"
                    title="Ver pre-alertas en camino a bodega"
                >
                    <AlertCircle size={20} />
                    {preAlertsCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-[10px] font-bold text-white shadow-md ring-2 ring-white animate-pulse">
                            {preAlertsCount > 99 ? '99+' : preAlertsCount}
                        </span>
                    )}
                </Link>

            </div>

            {/* Botón de cerrar en móvil */}
            <button 
                onClick={() => setIsOpen(false)}
                className="md:hidden absolute top-4 right-4 text-gray-400 hover:text-red-500 bg-gray-50 p-1.5 rounded-full"
            >
                <X size={20} />
            </button>

            {/* Logo y Rol */}
            <h2 className="text-2xl font-bold text-gmc-gris-oscuro font-garamond mt-2">GaspMaker</h2>
            <span className={`text-[10px] font-bold px-3 py-1 rounded-full mt-2 uppercase tracking-widest shadow-sm ${
                userRole === 'ADMIN' ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-blue-100 text-blue-700 border border-blue-200'
            }`}>
                {userRole === 'WAREHOUSE' ? 'BODEGA' : 'ADMINISTRADOR'}
            </span>
        </div>

        {/* Navegación */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {allowedLinks.map((item) => {
            const isActive = pathname === item.href;
            
            // Lógica combinada de Alertas
            const showRedDotConsolidations = item.name === "Consolidaciones" && pendingConsolidations;
            const showRedDotPackages = item.name === "Paquetes" && (paidPackagesCount > 0 || preAlertsCount > 0); // La alerta de Paquetes brilla por pagados o por prealertas
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

                    {/* ALERTA VISUAL (PUNTO ROJO/MORADO) */}
                    {showRedDot && (
                        <span className={`ml-auto relative flex h-3 w-3`}>
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${preAlertsCount > 0 && paidPackagesCount === 0 ? 'bg-purple-400' : 'bg-red-400'}`}></span>
                          <span className={`relative inline-flex rounded-full h-3 w-3 ${preAlertsCount > 0 && paidPackagesCount === 0 ? 'bg-purple-600' : 'bg-red-500'}`}></span>
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