"use client";

import React, { useState, useRef } from 'react';
import { useSession, signOut } from "next-auth/react";
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  User, LayoutDashboard, Settings, LogOut, 
  ArrowLeft, Edit2, Share2, HelpCircle, 
  FileText, Bell, ChevronRight, Loader2 
} from 'lucide-react';
// 🔥 IMPORTAMOS EL HOOK DE TRADUCCIÓN
import { useTranslations } from 'next-intl';

export default function MenuPerfilPage() {
  // 🔥 INICIALIZAMOS TRADUCCIONES
  const t = useTranslations('MobileMenu');

  // 🔥 Extraemos 'update' para refrescar la sesión manualmente
  const { data: session, update } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [uploading, setUploading] = useState(false);
  
  // Estado local para mostrar la imagen inmediatamente (UX)
  const [previewImage, setPreviewImage] = useState<string | null>(session?.user?.image || null);

  if (!session) {
    if (typeof window !== 'undefined') router.push('/login-cliente');
    return null;
  }

  const user = session.user;
  const memberSince = new Date().getFullYear(); 

  const handleAvatarClick = () => fileInputRef.current?.click();

  // 🔥 LÓGICA DE SUBIDA + REFRESCO VISUAL 🔥
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Mostrar inmediatamente la imagen seleccionada (Feedback Instantáneo)
    const objectUrl = URL.createObjectURL(file);
    setPreviewImage(objectUrl);
    setUploading(true);

    try {
        // 2. Preparar datos
        const formData = new FormData();
        formData.append('file', file);

        // 3. Enviar a la API
        const res = await fetch('/api/user/update-avatar', {
            method: 'POST',
            body: formData,
        });

        if (!res.ok) throw new Error("Error al subir imagen");

        const data = await res.json(); // Recibimos { url: "..." }

        // 4. 🔥 CRÍTICO: Actualizar la sesión del navegador para que el Header se entere
        await update({
            ...session,
            user: {
                ...session.user,
                image: data.url // Usamos la URL que nos devolvió Cloudinary
            }
        });
        
        // 5. 🔥 CRÍTICO: Refrescar componentes del servidor (Server Components)
        router.refresh();

        console.log("Imagen actualizada exitosamente:", data.url);

    } catch (error) {
        console.error("Error subiendo avatar:", error);
        alert("No se pudo guardar la imagen. Intenta con una más ligera.");
        
        // Si falla, volvemos a mostrar la imagen anterior
        setPreviewImage(session.user?.image || null);
    } finally {
        setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#F3F4F6] font-montserrat overflow-y-auto">
      
      {/* 1. BANNER SUPERIOR */}
      <div className="relative h-40 bg-[#1a1f2e] overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gmc-dorado-principal/10 rounded-full blur-3xl -mr-10 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-full h-12 bg-[#F3F4F6] rounded-t-[40px] translate-y-6 opacity-10"></div>
        
        {/* Flecha Volver */}
        <button onClick={() => router.back()} className="absolute top-6 left-4 text-white hover:text-gmc-dorado-principal transition-colors z-20">
            <ArrowLeft size={26} />
        </button>
      </div>

      {/* 2. ZONA DE PERFIL */}
      <div className="px-5 relative -mt-16 mb-6">
        
        {/* Avatar Interactivo */}
        <div className="relative inline-block mb-3 cursor-pointer group" onClick={handleAvatarClick}>
            <div className="w-28 h-28 rounded-full border-4 border-white bg-white shadow-md overflow-hidden relative">
                {previewImage ? (
                    <Image 
                        src={previewImage} 
                        alt="Profile" 
                        fill 
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 150px"
                    />
                ) : (
                    <div className="w-full h-full bg-gmc-dorado-principal flex items-center justify-center text-4xl font-bold text-[#1a1f2e]">
                        {user?.name?.[0]?.toUpperCase()}
                    </div>
                )}
                
                {/* Overlay de Carga */}
                {uploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm z-10">
                        <Loader2 className="w-8 h-8 text-white animate-spin"/>
                    </div>
                )}
            </div>
            
            {/* Botón de edición (Lápiz) */}
            <div className="absolute bottom-1 right-1 bg-white text-gray-700 p-2 rounded-full shadow-lg border border-gray-100 group-hover:scale-110 transition-transform z-20">
                <Edit2 size={16} />
            </div>
            
            {/* Input Oculto */}
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/png, image/jpeg, image/jpg, image/webp" 
                onChange={handleFileChange}
                disabled={uploading}
            />
        </div>

        <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">{user?.name}</h1>
            <p className="text-blue-600 font-medium text-sm mb-1">{user?.email}</p>
            <p className="text-gray-400 text-xs">Miembro desde {memberSince}</p>
        </div>

        <div className="flex gap-4">
            {/* TRADUCCIÓN: 'myDashboard' */}
            <Link href="/dashboard-cliente" className="flex-1 bg-white border border-gray-300 rounded-full py-2.5 text-sm font-bold text-gray-700 text-center shadow-sm hover:bg-gray-50 flex items-center justify-center gap-2">
                <LayoutDashboard size={16}/> {t('myDashboard')}
            </Link>
            {/* TRADUCCIÓN: 'settings' */}
            <Link href="/account-settings" className="flex-1 bg-white border border-gray-300 rounded-full py-2.5 text-sm font-bold text-gray-700 text-center shadow-sm hover:bg-gray-50 flex items-center justify-center gap-2">
                <Settings size={16}/> {t('settings')}
            </Link>
        </div>
      </div>

      {/* 3. LISTA DE MENÚ */}
      <div className="px-4 space-y-6 pb-10">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* TRADUCCIÓN: 'invite' y 'earn' */}
            <Link href="/dashboard-cliente/referidos" className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-100">
                <div className="flex items-center gap-4">
                    <Share2 size={22} className="text-gray-700"/>
                    <span className="text-gray-800 font-medium">{t('invite')}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">★ {t('earn')}</span>
                    <ChevronRight size={18} className="text-gray-300"/>
                </div>
            </Link>

            {/* TRADUCCIÓN: 'help' */}
            <Link href="/faq" className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-100">
                <div className="flex items-center gap-4">
                    <HelpCircle size={22} className="text-gray-700"/>
                    <span className="text-gray-800 font-medium">{t('help')}</span>
                </div>
                <ChevronRight size={18} className="text-gray-300"/>
            </Link>

            {/* TRADUCCIÓN: 'bills' */}
            <Link href="/dashboard-cliente/pagar-facturas" className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-100">
                <div className="flex items-center gap-4">
                    <FileText size={22} className="text-gray-700"/>
                    <span className="text-gray-800 font-medium">{t('bills')}</span>
                </div>
                <ChevronRight size={18} className="text-gray-300"/>
            </Link>

            {/* TRADUCCIÓN: 'notifications' */}
            <Link href="/dashboard-cliente/notificaciones" className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                    <Bell size={22} className="text-gray-700"/>
                    <span className="text-gray-800 font-medium">{t('notifications')}</span>
                </div>
                <ChevronRight size={18} className="text-gray-300"/>
            </Link>
        </div>

        {/* TRADUCCIÓN: 'logout' */}
        <button 
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full bg-white rounded-full py-4 text-red-600 font-bold shadow-sm border border-gray-200 hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
        >
            <LogOut size={20}/> {t('logout')}
        </button>

        <div className="text-center text-xs text-gray-400 mt-6 pb-8">
            <p className="mb-2">Gasp Maker Cargo App</p>
            <div className="flex justify-center gap-4">
                {/* TRADUCCIÓN: 'privacy' y 'terms' */}
                <Link href="/privacy" className="hover:underline">{t('privacy')}</Link>
                <span>•</span>
                <Link href="/terms" className="hover:underline">{t('terms')}</Link>
            </div>
            <p className="mt-4">Versión 1.0.5</p>
        </div>
      </div>
    </div>
  );
}