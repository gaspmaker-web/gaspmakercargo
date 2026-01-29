"use client";

import { signOut } from "next-auth/react"; // Usamos la versión de Cliente
import { LogOut } from "lucide-react";

interface Props {
  locale: string;
}

export default function DriverLogoutButton({ locale }: Props) {
  return (
    <button 
        onClick={() => {
            // Esto fuerza la limpieza del caché del cliente y del Header
            signOut({ callbackUrl: `/${locale}/login-cliente` });
        }}
        className="bg-red-500/20 p-3 rounded-full backdrop-blur-md border border-red-500/30 hover:bg-red-600 hover:text-white transition-all text-red-200 active:scale-95 shadow-lg flex items-center justify-center group"
        title="Cerrar Sesión y Limpiar"
    >
        <LogOut size={24} className="group-hover:scale-110 transition-transform" />
    </button>
  );
}