'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { LayoutDashboard, Package, Layers, Users, Menu, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useSidebar } from '@/lib/admin-sidebar-context';

export default function AdminBottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { isOpen: menuOpen, setIsOpen: setMenuOpen } = useSidebar();
  const [counts, setCounts] = useState({ consolidaciones: 0, clientes: 0, paquetes: 0 });

  const segments = pathname.split('/');
  const validLocales = ['es', 'en', 'fr', 'pt'];
  const locale = validLocales.includes(segments[1]) ? segments[1] : 'es';

  useEffect(() => {
    fetch('/api/admin/stats', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setCounts({
            consolidaciones: d.stats.consolidaciones || 0,
            clientes: d.stats.facturasClientes || 0,
            paquetes: d.stats.paquetes || 0,
          });
        }
      })
      .catch(() => {});
  }, []);

  const navItems = [
    {
      label: 'Dashboard',
      href: `/${locale}/dashboard-admin`,
      icon: LayoutDashboard,
      exact: true,
    },
    {
      label: 'Packages',
      href: `/${locale}/dashboard-admin/paquetes`,
      icon: Package,
      badge: counts.paquetes,
    },
    {
      label: 'Consolidations',
      href: `/${locale}/dashboard-admin/consolidaciones`,
      icon: Layers,
      badge: counts.consolidaciones,
    },
    {
      label: 'Clients',
      href: `/${locale}/dashboard-admin/clientes`,
      icon: Users,
      badge: counts.clientes,
    },
  ];

  function isActive(item: any) {
    if (item.exact) return pathname === item.href || pathname.endsWith('/dashboard-admin');
    return pathname.includes(item.href.split('/').pop());
  }

  return (
    <>


      {/* Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 shadow-lg safe-area-pb">
        <div className="flex items-center justify-around h-16 px-2">
          
          {navItems.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full relative"
              >
                <div className="relative">
                  <item.icon
                    size={22}
                    className={active ? 'text-gmc-dorado-principal' : 'text-gray-400'}
                    strokeWidth={active ? 2.5 : 1.8}
                  />
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold px-1 py-0.5 rounded-full min-w-[1rem] text-center leading-none">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-semibold ${active ? 'text-gmc-dorado-principal' : 'text-gray-400'}`}>
                  {item.label}
                </span>
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-gmc-dorado-principal rounded-full" />
                )}
              </Link>
            );
          })}

          {/* Menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full"
          >
            <Menu size={22} className="text-gray-400" strokeWidth={1.8} />
            <span className="text-[10px] font-semibold text-gray-400">Menu</span>
          </button>

        </div>
      </nav>
    </>
  );
}