"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, Clock, Trash2, CheckCircle, Loader2, ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  href?: string;
  type?: string;
  createdAt: string;
}

export default function NotificationsPage() {
  const t = useTranslations('Notifications');
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeletingAll, setIsDeletingAll] = useState(false); 
  const [showPromptBanner, setShowPromptBanner] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        // 🔥 Forzamos descarga de datos frescos (Anti-caché)
        const res = await fetch('/api/notifications', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setNotifications(data);
        }
      } catch (error) {
        console.error("Error cargando notificaciones", error);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const OneSignal = (window as any).OneSignal || [];
      OneSignal.push(function() {
        const hasPermission = OneSignal.Notifications.hasPermission;
        if (!hasPermission) {
          setShowPromptBanner(true);
        }
      });
    }
  }, []);

  const handleEnablePush = async () => {
    try {
      const OneSignal = (window as any).OneSignal || [];
      await OneSignal.Notifications.requestPermission();
      setShowPromptBanner(false);
    } catch (error) {
      console.error("Error al solicitar permiso:", error);
    }
  };

  const markAllAsRead = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      await fetch('/api/notifications', { method: 'PATCH' });
    } catch (error) {
      console.error("Error actualizando lectura", error);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    const prevNotifications = [...notifications];
    setNotifications(prev => prev.filter(n => n.id !== id));
    try {
        const res = await fetch(`/api/notifications?id=${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error();
    } catch (error) {
        setNotifications(prevNotifications);
    }
  };

  const handleDeleteAll = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (notifications.length === 0) return;
    
    setIsDeletingAll(true);
    const prevNotifications = [...notifications];

    try {
      const res = await fetch('/api/notifications', { method: 'DELETE' });
      if (!res.ok) throw new Error("Error del servidor");
      setNotifications([]); 
      router.refresh();
    } catch (error) {
        setNotifications(prevNotifications);
    } finally {
        setIsDeletingAll(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    }).format(date);
  };

  const getTranslatedText = (text: string) => {
    if (!text) return "";
    const cleanText = text.trim();
    /* @ts-ignore */
    if (t.has(cleanText)) { return t(cleanText); }
    return text;
  };

  const uniqueNotifications = notifications.filter((notif, index, self) => {
    return index === self.findIndex((t) => {
      const sameTitle = t.title === notif.title;
      const sameMsg = t.message === notif.message;
      const diffTime = Math.abs(new Date(t.createdAt).getTime() - new Date(notif.createdAt).getTime()) < 600000;
      return sameTitle && sameMsg && diffTime;
    });
  });

  // 🔥 ENRUTADOR INTELIGENTE (PRODUCCIÓN) 🔥
  const getSmartUrl = (notif: Notification) => {
    // 1. Si la notificación tiene el link con el UUID (las nuevas), lo usamos.
    if (notif.href && notif.href.trim() !== "") {
      return notif.href;
    }
    
    // 2. Si no tiene link (las viejas), mandamos al Dashboard principal para EVITAR EL 404.
    return '/dashboard-cliente';
  };

  return (
    <div className="min-h-screen bg-gray-50 font-montserrat pt-6 sm:pt-8 pb-20">
      
      {showPromptBanner && (
        <div className="max-w-2xl mx-auto mb-6 px-4">
          <div className="bg-blue-600 rounded-[20px] px-5 py-4 flex justify-between items-center shadow-md relative z-50">
            <div className="flex items-center gap-3 pr-4">
              <span className="text-2xl">🔔</span>
              <p className="text-white text-xs sm:text-sm font-medium leading-snug">
                Activa las notificaciones para saber exactamente cuándo llega tu carga a Miami.
              </p>
            </div>
            <button 
              onClick={handleEnablePush}
              className="shrink-0 bg-white text-blue-600 px-5 py-2 rounded-full text-xs font-bold shadow-sm hover:bg-blue-50 transition-colors"
            >
              Activar
            </button>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 sm:px-6 mb-10 relative z-40">
        <div className="flex justify-between items-center w-full">
             <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight font-garamond">
               {/* @ts-ignore */}
               {t.has('title') ? t('title') : "Notifications"}
             </h1>
          <div className="flex gap-2 sm:gap-3">
            {uniqueNotifications.length > 0 && uniqueNotifications.some(n => !n.isRead) && (
              <button 
                  onClick={markAllAsRead}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center hover:bg-blue-100 transition-all shadow-sm"
              >
                  <CheckCircle size={18} strokeWidth={2.5}/>
              </button>
            )}
            {uniqueNotifications.length > 0 && (
              <button 
                  onClick={handleDeleteAll}
                  disabled={isDeletingAll}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-50 text-red-600 border border-red-100 flex items-center justify-center hover:bg-red-100 transition-all shadow-sm disabled:opacity-50"
              >
                  {isDeletingAll ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={20} strokeWidth={2.5}/>}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 space-y-4 relative z-30">
        {loading ? (
            <div className="flex flex-col items-center py-20"><Loader2 className="animate-spin text-gray-300" size={40}/></div>
        ) : uniqueNotifications.length === 0 ? (
            <div className="text-center py-24 opacity-60">
                <Bell size={40} className="mx-auto mb-6 text-gray-300"/>
                <h3 className="text-xl font-bold text-gray-600 font-garamond">No hay alertas nuevas</h3>
            </div>
        ) : (
            uniqueNotifications.map((notif) => (
                <div 
                    key={notif.id} 
                    className={`relative p-5 rounded-[20px] border transition-all duration-300 hover:shadow-md flex gap-4 group ${
                        notif.isRead 
                        ? 'bg-white border-gray-100 shadow-sm' 
                        : 'bg-gradient-to-r from-blue-50/80 to-white border-blue-100 shadow-sm'
                    }`}
                >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                        notif.isRead ? 'bg-gray-50 text-gray-400' : 'bg-blue-100 text-blue-600'
                    }`}>
                        <Bell size={22} />
                    </div>

                    <Link 
                        href={getSmartUrl(notif)} 
                        className="flex-1 pr-8 block cursor-pointer"
                    >
                        <div className="flex justify-between items-start mb-1">
                            <h4 className={`text-sm font-montserrat ${notif.isRead ? 'font-bold text-gray-700' : 'font-extrabold text-gray-900'}`}>
                                {getTranslatedText(notif.title)}
                            </h4>
                            <span className="text-[10px] text-gray-400 font-medium bg-gray-50 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 ml-2 border border-gray-100">
                                <Clock size={10}/> {formatDate(notif.createdAt)}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed font-medium">
                            {getTranslatedText(notif.message)}
                        </p>
                       
                        <span className="mt-3 inline-flex items-center text-xs font-bold text-gmc-dorado-principal hover:text-yellow-600 transition-colors bg-yellow-50 px-3 py-1.5 rounded-lg">
                            Ver detalles 
                            <ArrowLeft size={12} className="rotate-180 ml-1"/>
                        </span>
                    </Link>

                    {!notif.isRead && (
                        <div className="absolute top-5 right-5 w-2.5 h-2.5 bg-red-500 rounded-full shadow-sm shadow-red-200 animate-pulse"></div>
                    )}

                    <button 
                        onClick={(e) => handleDelete(notif.id, e)}
                        className="absolute bottom-4 right-4 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100 scale-90 hover:scale-100 z-10"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            ))
        )}
      </div>
    </div>
  );
}