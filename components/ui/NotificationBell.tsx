"use client";

import useSWR from 'swr'; 
import { Bell } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface NotificationBellProps {
  className?: string; 
}

export default function NotificationBell({ className }: NotificationBellProps) {
  const pathname = usePathname();
  
  // Extraer locale del pathname directamente
  const locale = pathname?.split('/')[1] || 'en';
  
  const { data: notifications = [] } = useSWR('/api/notifications', fetcher, {
    refreshInterval: 60000,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    shouldRetryOnError: false,
    dedupingInterval: 5000,
  });

  const unreadCount = Array.isArray(notifications) 
    ? notifications.filter((n: any) => !n.isRead).length 
    : 0;

  return (
    <Link 
      href={`/${locale}/dashboard-cliente/notificaciones`}
      className={`relative p-2 rounded-full transition-all focus:outline-none hover:text-gmc-dorado-principal hover:bg-white/10 ${className || 'text-white'}`}
    >
      <Bell size={24} />
      {unreadCount > 0 && (
        <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 border-2 border-gmc-gris-oscuro rounded-full text-[9px] font-bold text-white flex items-center justify-center animate-pulse">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  );
}