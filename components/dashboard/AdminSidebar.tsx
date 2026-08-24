"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react'; 
import { 
  Package, Truck, Layers, Users, DollarSign, Settings, LayoutDashboard,
  LogOut, Menu, X, Bell, Zap, AlertCircle, Mailbox, ChevronDown,
  ShoppingBag, Gift, PanelLeftClose, PanelLeftOpen
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useSidebar } from '@/lib/admin-sidebar-context';

export default function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { isOpen, setIsOpen } = useSidebar();
  const [collapsed, setCollapsed] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null); 

  const [paidPackagesCount, setPaidPackagesCount] = useState(0);
  const [preAlertsCount, setPreAlertsCount] = useState(0);
  const [kycPendingCount, setKycPendingCount] = useState(0);
  const [tasksPendingCount, setTasksPendingCount] = useState(0);
  const [receptionPendingCount, setReceptionPendingCount] = useState(0);
  const [expiredCount, setExpiredCount] = useState(0);
  const [pickupsPendingCount, setPickupsPendingCount] = useState(0);
  const [pendingShopperCount, setPendingShopperCount] = useState(0);
  const [pendingConsolidationsCount, setPendingConsolidationsCount] = useState(0); 
  const [pendingInvoicesCount, setPendingInvoicesCount] = useState(0);

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
            setPendingInvoicesCount(dataStats.stats.facturasClientes || 0);
          }
        }
      } catch (error) { console.error("Error en API stats:", error); }
      try {
        const resPaid = await fetch('/api/admin/packages/paid-count', { cache: 'no-store' });
        if (resPaid.ok) { const d = await resPaid.json(); setPaidPackagesCount(d.count || 0); }
      } catch (e) {}
      try {
        const resPreAlerts = await fetch('/api/admin/packages/prealerts-count', { cache: 'no-store' });
        if (resPreAlerts.ok) { const d = await resPreAlerts.json(); setPreAlertsCount(d.count || 0); }
      } catch (e) {}
      try {
        const resReception = await fetch('/api/admin/bodega/reception-pending-count', { cache: 'no-store' });
        if (resReception.ok) { const d = await resReception.json(); setReceptionPendingCount(d.count || 0); }
      } catch (e) {}
    };
    checkPendingWork();
    const interval = setInterval(checkPendingWork, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (pathname.includes('/buzones-kyc') || pathname.includes('/tareas-buzon') || 
        pathname.includes('/recepcion-buzones') || pathname.includes('/inventario-buzones')) {
      setOpenSubmenu("Buzón Virtual");
    }
  }, [pathname]);

const menuItems = [
    { name: "Dashboard", href: `/${currentLocale}/dashboard-admin`, icon: LayoutDashboard, roles: ["ADMIN"] },
    { name: "Packages", href: `/${currentLocale}/dashboard-admin/paquetes`, icon: Package, roles: ["ADMIN", "WAREHOUSE", "CONSOLIDATION"] },
    { name: "Create Shipment", href: `/${currentLocale}/dashboard-admin/crear-envio`, icon: Truck, roles: ["ADMIN", "WAREHOUSE"] },
    { name: "Pay & Go", href: `/${currentLocale}/dashboard-admin/pay-and-go`, icon: Zap, roles: ["ADMIN", "WAREHOUSE"] },
    { name: "Consolidations", href: `/${currentLocale}/dashboard-admin/consolidaciones`, icon: Layers, roles: ["ADMIN", "CONSOLIDATION"], badgeCount: pendingConsolidationsCount, badgeColor: "bg-rose-500" },
    { name: "Referral Control", href: `/${currentLocale}/dashboard-admin/referidos`, icon: Gift, roles: ["ADMIN"] },
    { name: "Personal Shopper", href: `/${currentLocale}/dashboard-admin/compras`, icon: ShoppingBag, roles: ["ADMIN"], badgeCount: pendingShopperCount, badgeColor: "bg-pink-500" },
    {
      name: "Virtual Mailbox", icon: Mailbox, roles: ["ADMIN", "WAREHOUSE"],
      hasNotification: kycPendingCount > 0 || tasksPendingCount > 0 || receptionPendingCount > 0 || expiredCount > 0 || pickupsPendingCount > 0,
      subItems: [
        { name: "KYC Approvals", href: `/${currentLocale}/dashboard-admin/buzones-kyc`, count: kycPendingCount },
        { name: "Tasks / Scans", href: `/${currentLocale}/dashboard-admin/tareas-buzon`, count: tasksPendingCount + pickupsPendingCount },
        { name: "Reception", href: `/${currentLocale}/dashboard-admin/recepcion-buzones`, count: receptionPendingCount },
        { name: "Physical Inventory", href: `/${currentLocale}/dashboard-admin/inventario-buzones`, count: expiredCount }
      ]
    },
    { name: "Amazon Catalog", href: `/${currentLocale}/dashboard-admin/catalogo`, icon: ShoppingBag, roles: ["ADMIN"] },
    { name: "Clients", href: `/${currentLocale}/dashboard-admin/clientes`, icon: Users, roles: ["ADMIN", "CONSOLIDATION"], badgeCount: pendingInvoicesCount, badgeColor: "bg-red-500" },
    { name: "Finances", href: `/${currentLocale}/dashboard-admin/finanzas`, icon: DollarSign, roles: ["ADMIN"] },
    { name: "Settings", href: `/${currentLocale}/dashboard-admin/configuracion`, icon: Settings, roles: ["ADMIN"] }
  ];

  const allowedLinks = menuItems.filter(item => item.roles.includes(userRole));

  useEffect(() => { setIsOpen(false); }, [pathname]);

  const toggleSubmenu = (name: string) => {
    if (collapsed) { setCollapsed(false); setOpenSubmenu(name); return; }
    setOpenSubmenu(openSubmenu === name ? null : name);
  };

  return (
    <>
{/* Hamburguesa MÓVIL — oculta, se abre desde bottom nav */}
{isOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsOpen(false)} />}

      <aside className={`
        bg-white h-screen border-r border-gray-200 flex flex-col fixed left-0 top-0 z-50
        transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
        md:translate-x-0 md:shadow-none
       ${collapsed ? 'w-16' : 'w-[85vw] md:w-64'}
      `}>

        {/* Header */}
        <div className={`border-b border-gray-100 flex flex-col items-center relative ${collapsed ? 'p-3 pt-12' : 'p-6 pt-16'}`}>

          {/* Notificaciones — solo expandido */}
          {!collapsed && (
            <div className="absolute top-4 left-0 w-full flex justify-center items-center gap-6">
              <Link href={`/${currentLocale}/dashboard-admin/paquetes?filter=pagados`} className="relative p-1.5 bg-red-50 rounded-full text-red-400 hover:text-red-600 hover:bg-red-100 transition-all shadow-sm border border-red-100" title="Ver paquetes pagados">
                <Bell size={20} />
                {paidPackagesCount > 0 && <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-md ring-2 ring-white">{paidPackagesCount > 99 ? '99+' : paidPackagesCount}</span>}
              </Link>
              <Link href={`/${currentLocale}/dashboard-admin/paquetes?filter=prealertas`} className="relative p-1.5 bg-purple-50 rounded-full text-purple-500 hover:text-purple-700 hover:bg-purple-100 transition-all shadow-sm border border-purple-100" title="Ver pre-alertas">
                <AlertCircle size={20} />
                {preAlertsCount > 0 && <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-[10px] font-bold text-white shadow-md ring-2 ring-white animate-pulse">{preAlertsCount > 99 ? '99+' : preAlertsCount}</span>}
              </Link>
            </div>
          )}

          {/* X móvil */}
        <button onClick={() => setIsOpen(true)} className="hidden fixed top-4 left-4 z-40 bg-white p-2 rounded-lg shadow-md border border-gray-200 text-gmc-gris-oscuro">
  <Menu size={24} />
</button>

          {/* 🔥 Botón collapse DESKTOP */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex absolute top-4 right-2 p-1.5 rounded-lg text-gray-400 hover:text-gmc-gris-oscuro hover:bg-gray-100 transition-colors"
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>

          {/* Logo / badge */}
          {!collapsed ? (
            <>
              <h2 className="text-2xl font-bold text-gmc-gris-oscuro font-garamond mt-2">GaspMaker</h2>
              <span className={`text-[10px] font-bold px-3 py-1 rounded-full mt-2 uppercase tracking-widest shadow-sm ${userRole === 'ADMIN' ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-blue-100 text-blue-700 border border-blue-200'}`}>
                {userRole === 'WAREHOUSE' ? 'WAREHOUSE' : 'ADMINISTRATOR'}
              </span>
            </>
          ) : (
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mt-2 ${userRole === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
              {userRole === 'ADMIN' ? 'A' : 'W'}
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {allowedLinks.map((item) => {
            const showRedDot = item.name === "Paquetes" && (paidPackagesCount > 0 || preAlertsCount > 0);

            if (item.subItems) {
              const isSubmenuOpen = openSubmenu === item.name && !collapsed;
              const isChildActive = item.subItems.some(sub => pathname === sub.href);
              return (
                <div key={item.name} className="flex flex-col mb-1">
                  <button
                    onClick={() => toggleSubmenu(item.name)}
                    title={collapsed ? item.name : undefined}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all font-medium text-sm w-full outline-none relative ${isChildActive ? 'bg-gmc-dorado-principal/10 text-gmc-dorado-principal font-bold' : 'text-gray-500 hover:bg-gray-50 hover:text-gmc-gris-oscuro'} ${collapsed ? 'justify-center' : ''}`}
                  >
                    <item.icon size={18} className="shrink-0" />
                    {!collapsed && <span>{item.name}</span>}
                    {!collapsed && item.hasNotification && (
                      <span className="absolute right-10 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                      </span>
                    )}
                    {!collapsed && <ChevronDown size={16} className={`ml-auto transition-transform duration-300 ${isSubmenuOpen ? 'rotate-180 text-gmc-dorado-principal' : 'text-gray-400'}`} />}
                    {collapsed && item.hasNotification && (
                      <span className="absolute top-1 right-1 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                    )}
                  </button>
                  {!collapsed && (
                    <div className={`overflow-hidden transition-all duration-300 ${isSubmenuOpen ? 'max-h-60 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                      <div className="pl-12 pr-4 py-1 space-y-1 relative before:absolute before:left-6 before:top-0 before:h-full before:w-px before:bg-gray-200">
                        {item.subItems.map((sub) => {
                          const isSubActive = pathname === sub.href;
                          return (
                            <Link key={sub.href} href={sub.href} className={`flex items-center justify-between text-xs py-2 px-3 rounded-lg transition-colors relative ${isSubActive ? 'text-gmc-dorado-principal font-bold bg-gmc-dorado-principal/5' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}>
                              <span className="flex items-center">
                                <span className={`absolute left-[-26px] top-1/2 -translate-y-1/2 w-[5px] h-[5px] rounded-full ${isSubActive ? 'bg-gmc-dorado-principal' : 'bg-gray-300'}`}></span>
                                {sub.name}
                              </span>
                              {sub.count !== undefined && sub.count > 0 && (
                                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center shadow-sm animate-pulse">{sub.count > 99 ? '99+' : sub.count}</span>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href!}
                title={collapsed ? item.name : undefined}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all font-medium text-sm relative group ${isActive ? 'bg-gmc-dorado-principal text-white shadow-md' : 'text-gray-500 hover:bg-gray-50 hover:text-gmc-gris-oscuro'} ${collapsed ? 'justify-center' : ''}`}
              >
                <item.icon size={18} className="shrink-0" />
                {!collapsed && <span>{item.name}</span>}
                {!collapsed && item.badgeCount !== undefined && item.badgeCount > 0 && (
                  <span className={`ml-auto text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center shadow-sm animate-pulse ${item.badgeColor || 'bg-red-500'}`}>{item.badgeCount > 99 ? '99+' : item.badgeCount}</span>
                )}
                {collapsed && item.badgeCount !== undefined && item.badgeCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-2 w-2">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${item.badgeColor || 'bg-red-500'}`}></span>
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${item.badgeColor || 'bg-red-500'}`}></span>
                  </span>
                )}
                {!collapsed && showRedDot && item.badgeCount === undefined && (
                  <span className="ml-auto relative flex h-3 w-3">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${preAlertsCount > 0 && paidPackagesCount === 0 ? 'bg-purple-400' : 'bg-red-400'}`}></span>
                    <span className={`relative inline-flex rounded-full h-3 w-3 ${preAlertsCount > 0 && paidPackagesCount === 0 ? 'bg-purple-600' : 'bg-red-500'}`}></span>
                  </span>
                )}
                {/* Tooltip colapsado */}
                {collapsed && (
                  <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                    {item.name}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-2 border-t border-gray-100">
          <button
            onClick={() => signOut()}
            title={collapsed ? 'Cerrar Sesión' : undefined}
            className={`flex items-center gap-3 px-3 py-3 text-red-500 hover:bg-red-50 rounded-xl w-full transition-colors text-sm font-medium ${collapsed ? 'justify-center' : ''}`}
          >
            <LogOut size={18} className="shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}