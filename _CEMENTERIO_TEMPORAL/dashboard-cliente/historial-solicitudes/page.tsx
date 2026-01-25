"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
// ❌ ArrowLeft eliminado de los imports
import { Loader2 } from 'lucide-react';
// 👇 Importamos el componente profesional
import HistoryRequestsCarousel from '@/components/client/HistoryRequestsCarousel';
// 🔥 Importamos el hook de traducción
import { useTranslations } from 'next-intl';

export default function ClientRequestsHistoryPage() {
  // 🔥 Inicializamos el hook para leer del JSON 'HistoryPage'
  const t = useTranslations('HistoryPage');

  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const isFetching = useRef(false);

  useEffect(() => {
    if (isFetching.current) return;
    isFetching.current = true;
    const fetchData = async () => {
        try {
            const res = await fetch('/api/user/history', { cache: 'no-store' }); 
            if (res.ok) {
                const data = await res.json();
                setRequests(Array.isArray(data.requests) ? data.requests : []);
            }
        } catch (e) { console.error(e); } 
        finally { setLoading(false); }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 font-montserrat">
      <div className="max-w-7xl mx-auto">
        
        {/* Header SIN FLECHA LOCAL y CENTRADO para evitar choque con la flecha global */}
        <div className="mb-8 text-center">
            <div>
                {/* 🔥 Usamos la traducción dinámica */}
                <h1 className="text-3xl font-bold text-gray-900 font-garamond mb-1">{t('title')}</h1>
                <p className="text-gray-500 text-sm">{t('subtitle')}</p>
            </div>
        </div>

        {/* Contenido */}
        {loading ? (
            <div className="py-32 text-center bg-white rounded-[2rem] border border-dashed border-gray-200">
                <Loader2 className="animate-spin mx-auto text-yellow-500 mb-3" size={32}/> 
                <p className="text-sm text-gray-400 font-medium">{t('loading')}</p>
            </div>
        ) : (
            // 👇 Usamos el componente nuevo
            <HistoryRequestsCarousel requests={requests} />
        )}
      </div>
    </div>
  );
}