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

  const markAllAsRead = async () => {
    try {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      await fetch('/api/notifications', { method: 'PATCH' });
    } catch (error) {
      console.error("Error actualizando lectura", error);
    }
  };

  const handleDelete = async (id: string) => {
    const prevNotifications = [...notifications];
    setNotifications(prev => prev.filter(n => n.id !== id));
    try {
        const res = await fetch(`/api/notifications?id=${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error();
    } catch (error) {
        setNotifications(prevNotifications);
    }
  };

  const handleDeleteAll = async () => {
    setIsDeletingAll(true);
    const prevNotifications = [...notifications];
    setNotifications([]); 

    try {
        const res = await fetch('/api/notifications', { method: 'DELETE' });
        if (!res.ok) throw new Error();
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
    if (cleanText.startsWith('Notifications.')) {
        const key = cleanText.replace('Notifications.', '');
        // @ts-ignore
        return t.has(key) ? t(key) : text;
    }
    const legacyMap: Record<string, string> = {
        "¡Chofer Asignado!": "titlePickup",
        "Paquete Recogido": "titlePickup",
        "📦 Paquete Recogido": "titlePickup",
        "¡Entrega Completada!": "titleDelivery",
        "¡Entrega Completada! 🏁": "titleDelivery",
        "Chofer Principal ha aceptado tu solicitud y está en camino.": "msgDriver",
        "El chofer ya tiene tu envío y va en camino al destino.": "msgDriver",
        "Tu Delivery Local ha sido completado exitosamente.": "msgLocalDelivery",
        "Tu Pickup Recibido en Bodega ha sido completado exitosamente.": "msgWarehousePickup",
        "Tu Consolidación ha sido completado exitosamente.": "msgConsolidation",
        "Package Picked Up": "titlePickup", // 🔥 Mapeo extra para asegurar
        "The driver has your shipment and is on the way to the destination.": "msgDriver" // 🔥 Mapeo extra
    };
    if (legacyMap[cleanText]) {
         // @ts-ignore
         return t.has(legacyMap[cleanText]) ? t(legacyMap[cleanText]) : text;
    }
    return text;
  };

  // 🔥 LÓGICA DE DEDUPLICACIÓN ULTRA-ESTRICTA
  const uniqueNotifications = notifications.filter((notif, index, self) => {
    return index === self.findIndex((t) => {
      // Comparamos el texto final que verá el usuario
      const sameTitle = getTranslatedText(t.title) === getTranslatedText(notif.title);
      const sameMsg = getTranslatedText(t.message) === getTranslatedText(notif.message);
      
      const timeA = new Date(t.createdAt).getTime();
      const timeB = new Date(notif.createdAt).getTime();
      const diffMinutes = Math.abs(timeA - timeB) / (1000 * 60);

      // Si el contenido traducido es igual y el tiempo es menor a 10 minutos, es un duplicado.
      return sameTitle && sameMsg && diffMinutes <= 10;
    });
  });

  return (
    <div className="min-h-screen bg-gray-50 font-montserrat pb-20">
      
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm h-16 flex items-center">
        <div className="max-w-2xl mx-auto w-full px-4 flex items-center justify-between relative">
            
            <div className="flex items-center gap-3">
                <button 
                  onClick={() => router.push('/dashboard-cliente')}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gmc-gris-oscuro"
                >
                  <ArrowLeft size={24} />
                </button>
                <h1 className="text-lg font-bold text-gmc-gris-oscuro">
                    {/* @ts-ignore */}
                    {t.has('title') ? t('title') : "Notifications"}
                </h1>
            </div>
            
            <div className="flex gap-2 relative z-[60]">
                {uniqueNotifications.length > 0 && uniqueNotifications.some(n => !n.isRead) && (
                    <button 
                        onClick={markAllAsRead}
                        className="text-[10px] font-bold text-blue-600 hover:bg-blue-50 bg-white border border-blue-100 px-3 py-1.5 rounded-full transition-all flex items-center gap-1 active:scale-95 shadow-sm"
                    >
                        <CheckCircle size={12}/>
                        {/* @ts-ignore */}
                        {t.has('markRead') ? t('markRead') : "Read"}
                    </button>
                )}
                
                {uniqueNotifications.length > 0 && (
                    <button 
                        onClick={handleDeleteAll}
                        disabled={isDeletingAll}
                        className="text-[10px] font-bold text-red-600 hover:bg-red-50 bg-white border border-red-100 px-3 py-1.5 rounded-full transition-all flex items-center gap-1 active:scale-95 disabled:opacity-50 shadow-sm"
                    >
                        {isDeletingAll ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12}/>}
                        {/* @ts-ignore */}
                        {t.has('vaciar') ? t('vaciar') : "Vaciar"}
                    </button>
                )}
            </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-3">
        {loading ? (
            <div className="flex flex-col items-center py-20"><Loader2 className="animate-spin text-gray-300" size={40}/></div>
        ) : uniqueNotifications.length === 0 ? (
            <div className="text-center py-20 opacity-60">
                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4"><Bell size={32} className="text-gray-400"/></div>
                <h3 className="text-lg font-bold text-gray-600">{/* @ts-ignore */}{t.has('emptyTitle') ? t('emptyTitle') : "Sin notificaciones"}</h3>
                <p className="text-sm text-gray-400">{/* @ts-ignore */}{t.has('emptyDesc') ? t('emptyDesc') : "Estás al día."}</p>
            </div>
        ) : (
            uniqueNotifications.map((notif) => (
                <div 
                    key={notif.id} 
                    className={`relative p-4 rounded-2xl border transition-all flex gap-4 group ${
                        notif.isRead ? 'bg-white border-gray-100' : 'bg-blue-50/50 border-blue-100'
                    }`}
                >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        notif.isRead ? 'bg-gray-100 text-gray-500' : 'bg-blue-100 text-blue-600'
                    }`}><Bell size={20} /></div>

                    <div className="flex-1 pr-6">
                        <div className="flex justify-between items-start">
                            <h4 className={`text-sm ${notif.isRead ? 'font-semibold text-gray-700' : 'font-bold text-gray-900'}`}>
                                {getTranslatedText(notif.title)}
                            </h4>
                            <span className="text-[10px] text-gray-400 flex items-center gap-1 shrink-0 ml-2">
                                <Clock size={10}/> {formatDate(notif.createdAt)}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                            {getTranslatedText(notif.message)}
                        </p>
                        {notif.href && (
                            <Link href={notif.href} className="mt-3 inline-flex items-center text-xs font-bold text-gmc-dorado-principal hover:underline">
                                {/* @ts-ignore */}
                                {t.has('viewDetails') ? t('viewDetails') : "Ver detalles"} →
                            </Link>
                        )}
                    </div>

                    {!notif.isRead && <div className="absolute top-4 right-4 w-2 h-2 bg-red-500 rounded-full"></div>}

                    <button 
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(notif.id); }}
                        className="absolute bottom-3 right-3 p-2 text-gray-300 hover:text-red-500 transition-colors"
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