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
  const router = useRouter();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/notifications');
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
        console.error("Error al borrar todas", error);
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
    
    if (text.includes("Cotización Lista") || text.includes("Quote Ready") || text.includes("Devis Prêt") || text.includes("Cotação Pronta")) {
        try {
           // @ts-ignore
           return t.has('shopperQuoteTitle') ? t('shopperQuoteTitle') : t('titlePickup'); 
        } catch(e) {}
    }

    if (text.includes("ha sido cotizada. Ve a la pestaña") || text.includes("has been quoted")) {
         try {
           // @ts-ignore
           return t.has('shopperQuoteMsg') ? t('shopperQuoteMsg') : text; 
        } catch(e) {}
    }

    try {
      const parsed = JSON.parse(text);
      if (parsed && parsed.key) {
        // @ts-ignore
        return t.has(parsed.key) ? t(parsed.key, parsed) : text;
      }
    } catch (e) {}

    const cleanText = text.trim();

    // @ts-ignore
    if (t.has(cleanText)) {
      // @ts-ignore
      return t(cleanText);
    }

    const legacyMap: Record<string, string> = {
        "¡Chofer Asignado!": "titlePickup",
        "Paquete Recogido": "titlePickup",
        "📦 Paquete Recogido": "titlePickup",
        "¡Entrega Completada!": "titleDelivery",
        "¡Entrega Completada! 🏁": "titleDelivery",
        "Chofer Principal ha aceptado tu solicitud y está en camino.": "msgDriver",
        "El chofer ya tiene tu envío y va en camino al destino.": "msgDriver"
    };
    
    if (legacyMap[cleanText]) {
         // @ts-ignore
         return t.has(legacyMap[cleanText]) ? t(legacyMap[cleanText]) : text;
    }
    
    return text;
  };

  const uniqueNotifications = notifications.filter((notif, index, self) => {
    return index === self.findIndex((t) => {
      const sameTitle = getTranslatedText(t.title) === getTranslatedText(notif.title);
      const sameMsg = getTranslatedText(t.message) === getTranslatedText(notif.message);
      const timeA = new Date(t.createdAt).getTime();
      const timeB = new Date(notif.createdAt).getTime();
      const diffMinutes = Math.abs(timeA - timeB) / (1000 * 60);
      return sameTitle && sameMsg && diffMinutes <= 10;
    });
  });

  return (
    <div className="min-h-screen bg-gray-50 font-montserrat pt-6 sm:pt-8 pb-20">
      
      {/* 🔥 FIX: Agregamos "pointer-events-none" al contenedor global del encabezado */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 mb-10 relative z-40 pointer-events-none">
        
        <div className="flex justify-between items-start w-full">
          
          {/* IZQUIERDA: Transparente y ahora deja pasar los clics hacia la flecha */}
          <div className="flex-1"></div>

          {/* CENTRO: Título */}
          <div className="flex flex-col items-center flex-none px-2">
             <div className="w-12 h-12 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center text-purple-600 mb-3">
               <Bell size={22} strokeWidth={2} />
             </div>
             <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight text-center font-garamond">
               {/* @ts-ignore */}
               {t.has('title') ? t('title') : "Notifications"}
             </h1>
             <p className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-widest mt-1 text-center">Updates & Alerts</p>
          </div>

          {/* 🔥 FIX: DERECHA: Agregamos "pointer-events-auto" SÓLO a la zona de botones */}
          <div className="flex-1 flex justify-end gap-2 sm:gap-3 pointer-events-auto">
            {uniqueNotifications.length > 0 && uniqueNotifications.some(n => !n.isRead) && (
              <button 
                  onClick={markAllAsRead}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center hover:bg-blue-100 hover:scale-105 transition-all shadow-sm"
                  title={/* @ts-ignore */ t.has('markRead') ? t('markRead') : "Mark as read"}
              >
                  <CheckCircle size={18} strokeWidth={2.5}/>
              </button>
            )}
            
            {uniqueNotifications.length > 0 && (
              <button 
                  onClick={handleDeleteAll}
                  disabled={isDeletingAll}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-50 text-red-600 border border-red-100 flex items-center justify-center hover:bg-red-100 hover:scale-105 transition-all shadow-sm disabled:opacity-50"
                  title={/* @ts-ignore */ t.has('vaciar') ? t('vaciar') : "Clear all"}
              >
                  {isDeletingAll ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={20} strokeWidth={2.5}/>}
              </button>
            )}
          </div>

        </div>
      </div>

      {/* 2. LISTA DE NOTIFICACIONES */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 space-y-4 relative z-30">
        {loading ? (
            <div className="flex flex-col items-center py-20"><Loader2 className="animate-spin text-gray-300" size={40}/></div>
        ) : uniqueNotifications.length === 0 ? (
            <div className="text-center py-24 opacity-60">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <Bell size={40} className="text-gray-300"/>
                </div>
                <h3 className="text-xl font-bold text-gray-600 font-garamond">{/* @ts-ignore */}{t.has('emptyTitle') ? t('emptyTitle') : "No notifications yet"}</h3>
                <p className="text-sm text-gray-400 mt-2">{/* @ts-ignore */}{t.has('emptyDesc') ? t('emptyDesc') : "You are up to date with your shipments."}</p>
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

                    <div className="flex-1 pr-8">
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
                        {notif.href && (
                            <Link href={notif.href} className="mt-3 inline-flex items-center text-xs font-bold text-gmc-dorado-principal hover:text-yellow-600 transition-colors bg-yellow-50 px-3 py-1.5 rounded-lg">
                                {/* @ts-ignore */}
                                {t.has('viewDetails') ? t('viewDetails') : "Voir détails"} 
                                <ArrowLeft size={12} className="rotate-180 ml-1"/>
                            </Link>
                        )}
                    </div>

                    {!notif.isRead && (
                        <div className="absolute top-5 right-5 w-2.5 h-2.5 bg-red-500 rounded-full shadow-sm shadow-red-200 animate-pulse"></div>
                    )}

                    <button 
                        onClick={(e) => handleDelete(notif.id, e)}
                        className="absolute bottom-4 right-4 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100 scale-90 hover:scale-100"
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