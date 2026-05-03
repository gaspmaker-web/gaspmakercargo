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
  AlertCircle,
  Mailbox, 
  ChevronDown,
  ShoppingBag,
  Gift,
  CheckCircle
} from 'lucide-react';
import { signOut } from 'next-auth/react';

export default function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  
  const [isOpen, setIsOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null); 

  // Estados de Notificaciones (Generales)
  const [paidPackagesCount, setPaidPackagesCount] = useState(0);
  const [preAlertsCount, setPreAlertsCount] = useState(0);

  // Estados de Notificaciones para el Buzón Virtual y Shopper
  const [kycPendingCount, setKycPendingCount] = useState(0);
  const [tasksPendingCount, setTasksPendingCount] = useState(0);
  const [receptionPendingCount, setReceptionPendingCount] = useState(0);
  const [expiredCount, setExpiredCount] = useState(0);
  const [pickupsPendingCount, setPickupsPendingCount] = useState(0);

  // ESTADO PARA PERSONAL SHOPPER Y CONSOLIDACIONES
  const [pendingShopperCount, setPendingShopperCount] = useState(0);
  const [pendingConsolidationsCount, setPendingConsolidationsCount] = useState(0); 

  const userRole = (session?.user as any)?.role || '';

  const segment = pathname.split('/')[1];
  const validLocales = ['es', 'en', 'fr', 'pt'];
  const currentLocale = validLocales.includes(segment) ? segment : 'es';

  useEffect(() => {
    const checkPendingWork = async () => {
        try {
            const resStats = await fetch('/api/admin/stats', { cache: 'no-store' });
            if (resStats.ok) {
                const dataStats = await resStats.json();
                if (dataStats.success && dataStats.stats) {
                    setKycPendingCount(dataStats.stats.kycPendientes || 0);
                    setTasksPendingCount(dataStats.stats.tareasBuzon || 0);
                    setExpiredCount(dataStats.stats.caducados || 0);
                    setPendingShopperCount(dataStats.stats.comprasPendientes || 0);
                    setPendingConsolidationsCount(dataStats.stats.consolidaciones || 0);
                    setPickupsPendingCount(dataStats.stats.pickupsBuzon || 0);
                }
            }
        } catch (error) { console.error("Error en API stats:", error); }

        try {
            const resPaid = await fetch('/api/admin/packages/paid-count', { cache: 'no-store' });
            if (resPaid.ok) {
                const dataPaid = await resPaid.json();
                setPaidPackagesCount(dataPaid.count || 0);
            }
        } catch (e) { }

        try {
            const resPreAlerts = await fetch('/api/admin/packages/prealerts-count', { cache: 'no-store' });
            if (resPreAlerts.ok) {
                const dataPreAlerts = await resPreAlerts.json();
                setPreAlertsCount(dataPreAlerts.count || 0);
            }
        } catch (e) { }

        try {
            const resReception = await fetch('/api/admin/bodega/reception-pending-count', { cache: 'no-store' });
            if (resReception.ok) {
                const dataReception = await resReception.json();
                setReceptionPendingCount(dataReception.count || 0);
            }
        } catch (e) { }
    };

    checkPendingWork();
    const interval = setInterval(checkPendingWork, 60000); 
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (
        pathname.includes('/buzones-kyc') || 
        pathname.includes('/tareas-buzon') || 
        pathname.includes('/recepcion-buzones') || 
        pathname.includes('/inventario-buzones')
    ) {
        setOpenSubmenu("Buzón Virtual");
    }
  }, [pathname]);

  const menuItems = [
    { name: "Dashboard", href: `/${currentLocale}/dashboard-admin`, icon: LayoutDashboard, roles: ["ADMIN"] },
    { name: "Paquetes", href: `/${currentLocale}/dashboard-admin/paquetes`, icon: Package, roles: ["ADMIN", "WAREHOUSE"] },
    { name: "Crear Envío", href: `/${currentLocale}/dashboard-admin/crear-envio`, icon: Truck, roles: ["ADMIN", "WAREHOUSE"] },
    { name: "Pay & Go", href: `/${currentLocale}/dashboard-admin/pay-and-go`, icon: Zap, roles: ["ADMIN", "WAREHOUSE"] }, 
    
    { 
      name: "Consolidaciones", 
      href: `/${currentLocale}/dashboard-admin/consolidaciones`, 
      icon: Layers, 
      roles: ["ADMIN", "WAREHOUSE"],
      badgeCount: pendingConsolidationsCount,
      badgeColor: "bg-rose-500" 
    },
    
    { name: "Control de Referidos", href: `/${currentLocale}/dashboard-admin/referidos`, icon: Gift, roles: ["ADMIN"] },

    { 
      name: "Personal Shopper", 
      href: `/${currentLocale}/dashboard-admin/compras`, 
      icon: ShoppingBag, 
      roles: ["ADMIN", "WAREHOUSE"],
      badgeCount: pendingShopperCount,
      badgeColor: "bg-pink-500" 
    },

    { 
      name: "Buzón Virtual", 
      icon: Mailbox, 
      roles: ["ADMIN", "WAREHOUSE"],
      hasNotification: kycPendingCount > 0 || tasksPendingCount > 0 || receptionPendingCount > 0 || expiredCount > 0 || pickupsPendingCount > 0,
      subItems: [
        { name: "Aprobaciones KYC", href: `/${currentLocale}/dashboard-admin/buzones-kyc`, count: kycPendingCount },
        { name: "Tareas / Escaneos", href: `/${currentLocale}/dashboard-admin/tareas-buzon`, count: tasksPendingCount + pickupsPendingCount },
        { name: "Recepción", href: `/${currentLocale}/dashboard-admin/recepcion-buzones`, count: receptionPendingCount },
        { name: "Inventario Físico", href: `/${currentLocale}/dashboard-admin/inventario-buzones`, count: expiredCount } 
      ]
    },

    { name: "Clientes", href: `/${currentLocale}/dashboard-admin/clientes`, icon: Users, roles: ["ADMIN"] },
    { name: "Finanzas", href: `/${currentLocale}/dashboard-admin/finanzas`, icon: DollarSign, roles: ["ADMIN"] },
    { name: "Configuración", href: `/${currentLocale}/dashboard-admin/configuracion`, icon: Settings, roles: ["ADMIN"] }
  ];

  const allowedLinks = menuItems.filter(item => item.roles.includes(userRole));

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const toggleSubmenu = (name: string) => {
    if (openSubmenu === name) {
        setOpenSubmenu(null); 
    } else {
        setOpenSubmenu(name); 
    }
  };

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
        
        <div className="p-6 pt-16 border-b border-gray-100 flex flex-col items-center relative">
            
            {/* 🔥 LOS DOS BOTONES ORIGINALES RESTAURADOS 🔥 */}
            <div className="absolute top-4 left-0 w-full flex justify-center items-center gap-6">
                {/* 1. Botón Rojo: Paquetes Pagados */}
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

                {/* 2. Botón Morado: Pre-alertas (RESTAURADO) */}
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

            <button 
                onClick={() => setIsOpen(false)}
                className="md:hidden absolute top-4 right-4 text-gray-400 hover:text-red-500 bg-gray-50 p-1.5 rounded-full"
            >
                <X size={20} />
            </button>

            <h2 className="text-2xl font-bold text-gmc-gris-oscuro font-garamond mt-2">GaspMaker</h2>
            <span className={`text-[10px] font-bold px-3 py-1 rounded-full mt-2 uppercase tracking-widest shadow-sm ${
                userRole === 'ADMIN' ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-blue-100 text-blue-700 border border-blue-200'
            }`}>
                {userRole === 'WAREHOUSE' ? 'BODEGA' : 'ADMINISTRADOR'}
            </span>
        </div>

        {/* --- EL RESTO DEL MENÚ SE MANTIENE EXACTAMENTE IGUAL --- */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {allowedLinks.map((item) => {
            
            const showRedDot = item.name === "Paquetes" && (paidPackagesCount > 0 || preAlertsCount > 0);

            if (item.subItems) {
                const isSubmenuOpen = openSubmenu === item.name;
                const isChildActive = item.subItems.some(subItem => pathname === subItem.href);

                return (
                    <div key={item.name} className="flex flex-col mb-1">
                        <button 
                            onClick={() => toggleSubmenu(item.name)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm w-full outline-none relative ${
                                isChildActive 
                                ? 'bg-gmc-dorado-principal/10 text-gmc-dorado-principal shadow-sm font-bold' 
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gmc-gris-oscuro'
                            }`}
                        >
                            <item.icon size={18} />
                            <span>{item.name}</span>

                            {item.hasNotification && (
                                <span className={`absolute right-10 flex h-2.5 w-2.5`}>
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                                </span>
                            )}

                            <ChevronDown 
                                size={16} 
                                className={`ml-auto transition-transform duration-300 ${isSubmenuOpen ? 'rotate-180 text-gmc-dorado-principal' : 'text-gray-400'}`} 
                            />
                        </button>
                        
                        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isSubmenuOpen ? 'max-h-60 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                            <div className="pl-12 pr-4 py-1 space-y-1 relative before:absolute before:left-6 before:top-0 before:h-full before:w-px before:bg-gray-200">
                                {item.subItems.map((subItem) => {
                                    const isSubActive = pathname === subItem.href;
                                    return (
                                        <Link 
                                            key={subItem.href} 
                                            href={subItem.href}
                                            className={`flex items-center justify-between text-xs py-2 px-3 rounded-lg transition-colors relative ${
                                                isSubActive 
                                                ? 'text-gmc-dorado-principal font-bold bg-gmc-dorado-principal/5' 
                                                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                                            }`}
                                        >
                                            <span className="flex items-center">
                                                <span className={`absolute left-[-26px] top-1/2 -translate-y-1/2 w-[5px] h-[5px] rounded-full transition-colors ${
                                                    isSubActive ? 'bg-gmc-dorado-principal' : 'bg-gray-300'
                                                }`}></span>
                                                {subItem.name}
                                            </span>
                                            
                                            {subItem.count !== undefined && subItem.count > 0 && (
                                                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center shadow-sm animate-pulse">
                                                    {subItem.count > 99 ? '99+' : subItem.count}
                                                </span>
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                );
            }

            const isActive = pathname === item.href;
            return (
                <Link 
                    key={item.href} 
                    href={item.href!}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm relative group ${
                        isActive 
                        ? 'bg-gmc-dorado-principal text-white shadow-md' 
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gmc-gris-oscuro'
                    }`}
                >
                    <item.icon size={18} />
                    <span>{item.name}</span>

                    {item.badgeCount !== undefined && item.badgeCount > 0 && (
                        <span className={`ml-auto text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center shadow-sm animate-pulse ${item.badgeColor || 'bg-red-500'}`}>
                            {item.badgeCount > 99 ? '99+' : item.badgeCount}
                        </span>
                    )}

                    {showRedDot && item.badgeCount === undefined && (
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