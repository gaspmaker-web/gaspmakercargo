"use client";

import { useSession, signOut } from "next-auth/react";
import React, { useState, useEffect, useRef } from "react";
import Link from 'next/link';
import { LogOut, Settings, User, LayoutDashboard, Package, Layers } from 'lucide-react'; 

export default function ProfileButton() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Manejador de clics fuera del componente
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileMenuRef]);

  const toggleMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  if (status === "loading") {
    return <div className="h-10 w-10 rounded-full bg-gray-500 animate-pulse" />;
  }

  if (!session?.user) {
    return (
      <Link href="/login-cliente" className="text-sm font-bold text-white hover:text-yellow-400 transition-colors">
        Acceso
      </Link>
    );
  }

  const name = session.user.name || 'Usuario';
  const initials = name.slice(0, 2).toUpperCase();
  
  // 🟢 DETECTAMOS EL ROL
  const userRole = (session.user as any).role;
  const isAdmin = userRole === 'ADMIN';

  return (
    <div ref={profileMenuRef} className="relative z-50">
      
      {/* BOTÓN DEL PERFIL */}
      <button
        onClick={toggleMenu}
        className={`h-10 w-10 rounded-full font-bold flex items-center justify-center text-sm shadow-md border-2 border-white hover:scale-105 transition-transform cursor-pointer ${isAdmin ? 'bg-blue-600 text-white' : 'bg-yellow-500 text-black'}`}
        type="button"
      >
        {initials}
      </button>

      {/* MENÚ DESPLEGABLE */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-72 bg-white rounded-xl shadow-2xl overflow-hidden ring-1 ring-black ring-opacity-5 origin-top-right z-[100]">
          
          {/* Cabecera Datos */}
          <div className={`px-5 py-4 border-b border-gray-100 ${isAdmin ? 'bg-blue-50' : 'bg-gray-50'}`}>
            <p className="font-bold text-gray-900 truncate text-sm">{name}</p>
            <p className="text-xs text-gray-500 truncate mt-0.5">{session.user.email}</p>
            {isAdmin && <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold mt-1 inline-block">ADMINISTRADOR</span>}
          </div>
          
          {/* Opciones */}
          <div className="py-2 bg-white">
            
            {/* 🔽 MENÚ ESPECÍFICO PARA ADMIN 🔽 */}
            {isAdmin ? (
                <>
                    <Link 
                        href="/dashboard-admin" 
                        onClick={() => setIsOpen(false)}
                        className="flex items-center px-5 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                    >
                        <LayoutDashboard size={18} className="mr-3 text-blue-500" />
                        Panel Principal
                    </Link>

                    {/* 🔥 EL ENLACE AL CENTRO DE MANDO UNIFICADO 🔥 */}
                    <Link 
                        href="/dashboard-admin/consolidaciones" 
                        onClick={() => setIsOpen(false)}
                        className="flex items-center px-5 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors bg-green-50/30"
                    >
                        <Layers size={18} className="mr-3 text-green-600" />
                        Gestión Consolidaciones
                    </Link>

                    <Link 
                        href="/dashboard-admin/paquetes" 
                        onClick={() => setIsOpen(false)}
                        className="flex items-center px-5 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                    >
                        <Package size={18} className="mr-3 text-blue-400" />
                        Paquetes Sueltos
                    </Link>
                    
                    <div className="border-t border-gray-100 my-1"></div>
                </>
            ) : (
                // 🔽 MENÚ PARA CLIENTE 🔽
                <Link 
                    href="/dashboard-cliente" 
                    onClick={() => setIsOpen(false)}
                    className="flex items-center px-5 py-3 text-sm text-gray-700 hover:bg-yellow-50 hover:text-yellow-700 transition-colors"
                >
                    <User size={18} className="mr-3 text-gray-400" />
                    Mi Dashboard
                </Link>
            )}

            {/* Opciones Comunes */}
            <Link 
                href="/account-settings" 
                onClick={() => setIsOpen(false)}
                className="flex items-center px-5 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
                <Settings size={18} className="mr-3 text-gray-400" />
                Configuración
            </Link>

            <div className="border-t border-gray-100 my-1"></div>

            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    signOut({ callbackUrl: '/login-cliente' });
                }}
                className="w-full flex items-center px-5 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
            >
                <LogOut size={18} className="mr-3" />
                Cerrar Sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}