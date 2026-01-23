"use client";

// 1. IMPORTACIONES
import useSWR from 'swr'; 
import { Bell } from 'lucide-react';
import Link from 'next/link';

// Fetcher simple para SWR
const fetcher = (url: string) => fetch(url).then((res) => res.json());

// 🔥 MODIFICACIÓN: Definimos que el componente acepta estilos externos
interface NotificationBellProps {
  className?: string; 
}

export default function NotificationBell({ className }: NotificationBellProps) {
  
  // 🔥 CONFIGURACIÓN ENTERPRISE (MANTENIDA EXACTAMENTE IGUAL):
  const { data: notifications = [] } = useSWR('/api/notifications', fetcher, {
    refreshInterval: 60000, // 1 minuto
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    shouldRetryOnError: false,
    dedupingInterval: 5000,
  });

  const unreadCount = Array.isArray(notifications) 
    ? notifications.filter((n: any) => !n.isRead).length 
    : 0;

  return (
    // 🔥 CAMBIO PRINCIPAL: Ahora es un Link directo, no un div con botón
    <Link 
      href="/dashboard-cliente/notificaciones"
      className={`relative p-2 rounded-full transition-all focus:outline-none hover:text-gmc-dorado-principal hover:bg-white/10 ${className || 'text-white'}`}
    >
        <Bell size={24} />
        
        {/* Indicador de no leídos */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 border-2 border-gmc-gris-oscuro rounded-full text-[9px] font-bold text-white flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
    </Link>
  );
}