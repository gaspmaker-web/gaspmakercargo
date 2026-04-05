"use client";

import React from 'react';

export default function EmailButton({ email }: { email: string }) {
    
    // 🔥 Lógica idéntica a tu archivo FaqClient.tsx
    const handleOpenChat = (e: React.MouseEvent) => {
        e.preventDefault(); // 🛑 Bloquea por completo cualquier intento de abrir Outlook o Gmail
        
        if (typeof window !== 'undefined' && (window as any).Tawk_API) {
            (window as any).Tawk_API.showWidget(); // 1. Muestra la burbuja
            (window as any).Tawk_API.maximize();   // 2. Abre la ventana de chat
        } else {
            console.warn("Tawk.to aún no ha cargado completamente.");
        }
    };

    return (
        <button 
            type="button"
            onClick={handleOpenChat} 
            className="text-blue-600 hover:underline text-sm font-medium text-left bg-transparent border-none p-0 cursor-pointer focus:outline-none"
        >
            {email}
        </button>
    );
}