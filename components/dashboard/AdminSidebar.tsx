"use client";

import React from 'react';
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
  LogOut 
} from 'lucide-react';
import { signOut } from 'next-auth/react';

export default function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  
  // 1. Obtenemos el rol (Si no ha cargado, ponemos string vacío)
  // 🟢 CORRECCIÓN: Usamos 'as any' para evitar el error de TypeScript en Vercel
  const userRole = (session?.user as any)?.role || '';

  // 2. Definimos el Menú Maestro
  const menuItems = [
    {
      name: "Dashboard",
      href: "/dashboard-admin", 
      icon: LayoutDashboard,
      roles: ["ADMIN"] 
    },
    {
      name: "Paquetes",
      href: "/dashboard-admin/paquetes", 
      icon: Package,
      roles: ["ADMIN", "WAREHOUSE"] 
    },
    {
      name: "Crear Envío",
      href: "/dashboard-admin/crear-envio",
      icon: Truck,
      roles: ["ADMIN", "WAREHOUSE"] 
    },
    {
      name: "Consolidaciones",
      href: "/dashboard-admin/consolidaciones",
      icon: Layers,
      roles: ["ADMIN", "WAREHOUSE"] 
    },
    // 🔒 ZONA EXCLUSIVA ADMIN
    {
      name: "Clientes", 
      href: "/dashboard-admin/clientes", 
      icon: Users,
      roles: ["ADMIN"] 
    },
    {
      name: "Finanzas",
      href: "/dashboard-admin/finanzas", 
      icon: DollarSign,
      roles: ["ADMIN"] 
    },
    {
      name: "Configuración",
      href: "/dashboard-admin/configuracion", 
      icon: Settings,
      roles: ["ADMIN"] 
    }
  ];

  // 3. Filtramos el menú según el rol
  const allowedLinks = menuItems.filter(item => item.roles.includes(userRole));

  return (
    <aside className="w-64 bg-white h-screen border-r border-gray-200 flex flex-col fixed left-0 top-0 overflow-y-auto z-50">
      
      {/* Header */}
      <div className="p-6 border-b border-gray-100 flex flex-col items-center">
        <h2 className="text-2xl font-bold text-gmc-gris-oscuro font-garamond">GaspMaker</h2>
        <span className={`text-[10px] font-bold px-2 py-1 rounded mt-2 uppercase tracking-widest ${
            userRole === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
        }`}>
          {userRole === 'WAREHOUSE' ? 'BODEGA' : 'ADMINISTRADOR'}
        </span>
      </div>

      {/* Navegación */}
      <nav className="flex-1 p-4 space-y-1">
        {allowedLinks.map((item) => {
          // Detectamos si el link es el activo
          const isActive = pathname === item.href;
          
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${
                isActive 
                  ? 'bg-gmc-dorado-principal text-white shadow-md' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gmc-gris-oscuro'
              }`}
            >
              <item.icon size={18} />
              <span>{item.name}</span>
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
  );
}