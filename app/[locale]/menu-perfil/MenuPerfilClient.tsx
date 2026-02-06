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
import { useTranslations } from 'next-intl';

export default function MenuPerfilClient() {
  const t = useTranslations('MobileMenu');
  const { data: session, update } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(session?.user?.image || null);

  if (!session) {
    if (typeof window !== 'undefined') router.push('/login-cliente');
    return null;
  }

  const user = session.user;
  const memberSince = new Date().getFullYear(); 

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setPreviewImage(objectUrl);
    setUploading(true);

    try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/user/update-avatar', {
            method: 'POST',
            body: formData,
        });

        if (!res.ok) throw new Error("Error al subir imagen");

        const data = await res.json(); 

        await update({
            ...session,
            user: {
                ...session.user,
                image: data.url 
            }
        });
        
        router.refresh();

    } catch (error) {
        console.error("Error subiendo avatar:", error);
        alert("No se pudo guardar la imagen. (API no disponible aún)");
        setPreviewImage(session.user?.image || null);
    } finally {
        setUploading(false);
    }
  };

  return (
    // 1. FONDO LUXURY (Degradado Oscuro)
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-[#0f172a] to-[#1e1b4b] font-montserrat overflow-y-auto animate-in fade-in duration-300">
      
      {/* Efectos de fondo (Luces ambientales) */}
      <div className="fixed top-[-20%] right-[-10%] w-[300px] h-[300px] bg-gmc-dorado-principal/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[250px] h-[250px] bg-blue-900/20 blur-[100px] rounded-full pointer-events-none" />

      {/* Botón Volver (Estilo Glass) */}
      <div className="absolute top-6 left-4 z-20">
         <button 
            onClick={() => router.back()} 
            className="p-2.5 bg-white/10 backdrop-blur-md rounded-full text-white border border-white/20 hover:bg-white/20 hover:scale-105 transition-all shadow-lg"
         >
            <ArrowLeft size={24} />
         </button>
      </div>

      {/* 2. ZONA DE PERFIL (Glassmorphism Header) */}
      <div className="relative pt-24 px-5 pb-8">
        
        {/* Avatar Container */}
        <div className="relative flex justify-center mb-4">
            <div 
                onClick={handleAvatarClick}
                className="relative w-32 h-32 rounded-full p-1 border-2 border-gmc-dorado-principal cursor-pointer group shadow-[0_0_20px_rgba(251,191,36,0.3)] transition-all hover:shadow-[0_0_30px_rgba(251,191,36,0.5)]"
            >
                <div className="w-full h-full rounded-full overflow-hidden relative bg-[#1a1f2e]">
                    {previewImage ? (
                        <Image 
                            src={previewImage} 
                            alt="Profile" 
                            fill 
                            className="object-cover transition-transform group-hover:scale-110"
                            sizes="(max-width: 768px) 100vw, 150px"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-800 to-black flex items-center justify-center text-5xl font-bold text-gmc-dorado-principal font-garamond">
                            {user?.name?.[0]?.toUpperCase()}
                        </div>
                    )}
                    
                    {uploading && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm z-10">
                            <Loader2 className="w-8 h-8 text-gmc-dorado-principal animate-spin"/>
                        </div>
                    )}
                </div>
                
                {/* Botón Editar Lápiz (Estilo Lujo) */}
                <div className="absolute bottom-1 right-1 bg-gmc-dorado-principal text-[#1a1f2e] p-2 rounded-full shadow-lg border-2 border-[#1a1f2e] hover:scale-110 transition-transform z-20">
                    <Edit2 size={14} />
                </div>
            </div>
            
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/png, image/jpeg, image/jpg, image/webp" 
                onChange={handleFileChange}
                disabled={uploading}
            />
        </div>

        {/* Info Usuario */}
        <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white font-garamond tracking-wide mb-1">{user?.name}</h1>
            <p className="text-gmc-dorado-principal/80 text-sm font-medium tracking-wider">{user?.email}</p>
            <p className="text-gray-400 text-xs mt-2 uppercase tracking-[2px]">Miembro desde {memberSince}</p>
        </div>

        {/* Botones Dashboard/Settings (Estilo Glass Gold) */}
        <div className="flex gap-4">
            <Link 
                href="/dashboard-cliente" 
                className="flex-1 bg-white/5 backdrop-blur-md border border-gmc-dorado-principal/30 rounded-[20px] py-3.5 text-sm font-bold text-gmc-dorado-principal text-center shadow-lg hover:bg-gmc-dorado-principal hover:text-[#1a1f2e] transition-all flex items-center justify-center gap-2 group"
            >
                <LayoutDashboard size={18} className="group-hover:scale-110 transition-transform"/> {t('myDashboard')}
            </Link>
            <Link 
                href="/account-settings" 
                className="flex-1 bg-white/5 backdrop-blur-md border border-gmc-dorado-principal/30 rounded-[20px] py-3.5 text-sm font-bold text-gmc-dorado-principal text-center shadow-lg hover:bg-gmc-dorado-principal hover:text-[#1a1f2e] transition-all flex items-center justify-center gap-2 group"
            >
                <Settings size={18} className="group-hover:rotate-90 transition-transform duration-500"/> {t('settings')}
            </Link>
        </div>
      </div>

      {/* 3. LISTA DE MENÚ (Glassmorphism List) */}
      <div className="px-5 space-y-6 pb-12">
        <div className="bg-white/5 backdrop-blur-xl rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl shadow-black/20">
            
            <MenuItem 
                href="/dashboard-cliente/referidos" 
                icon={<Share2 size={20} />} 
                label={t('invite')} 
                badge={t('earn')}
            />
            
            <MenuItem 
                href="/faq" 
                icon={<HelpCircle size={20} />} 
                label={t('help')} 
            />

            <MenuItem 
                href="/dashboard-cliente/pagar-facturas" 
                icon={<FileText size={20} />} 
                label={t('bills')} 
            />

            <MenuItem 
                href="/dashboard-cliente/notificaciones" 
                icon={<Bell size={20} />} 
                label={t('notifications')} 
                isLast
            />
        </div>

        {/* Botón Logout (Estilo Glass Warning) */}
        <button 
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full bg-red-500/10 backdrop-blur-md border border-red-500/30 rounded-[20px] py-4 text-red-400 font-bold shadow-lg hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2 group active:scale-95"
        >
            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform"/> {t('logout')}
        </button>

        {/* Footer Legal */}
        <div className="text-center text-[10px] text-gray-500 mt-8 pb-8 uppercase tracking-widest">
            <p className="mb-3 font-bold text-gmc-dorado-principal/50">Gasp Maker Cargo App</p>
            <div className="flex justify-center gap-4 text-gray-400">
                <Link href="/privacy" className="hover:text-white transition-colors">{t('privacy')}</Link>
                <span>•</span>
                <Link href="/terms" className="hover:text-white transition-colors">{t('terms')}</Link>
            </div>
            <p className="mt-4 opacity-50">v1.0.5</p>
        </div>
      </div>
    </div>
  );
}

// Componente Auxiliar para Items de Menú
function MenuItem({ href, icon, label, badge, isLast = false }: { href: string, icon: React.ReactNode, label: string, badge?: string, isLast?: boolean }) {
    return (
        <Link 
            href={href} 
            className={`flex items-center justify-between p-5 hover:bg-white/10 transition-all group ${
                !isLast ? 'border-b border-white/5' : ''
            }`}
        >
            <div className="flex items-center gap-4">
                <div className="text-gray-400 group-hover:text-gmc-dorado-principal transition-colors duration-300">
                    {icon}
                </div>
                <span className="text-gray-200 font-medium tracking-wide group-hover:translate-x-1 transition-transform duration-300">
                    {label}
                </span>
            </div>
            
            <div className="flex items-center gap-3">
                {badge && (
                    <span className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg shadow-purple-500/30 flex items-center gap-1">
                        ★ {badge}
                    </span>
                )}
                <ChevronRight size={16} className="text-gray-600 group-hover:text-gmc-dorado-principal transition-colors"/>
            </div>
        </Link>
    );
}