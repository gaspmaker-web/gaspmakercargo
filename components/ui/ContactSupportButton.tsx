"use client";

import React from 'react';

export default function ContactSupportButton() {
  
  const handleOpenChat = () => {
    // Verificamos si Tawk.to está cargado
    if ((window as any).Tawk_API) {
      (window as any).Tawk_API.showWidget(); // 1. Mostrar la burbuja
      (window as any).Tawk_API.maximize();   // 2. Abrir la ventana de chat inmediatamente
    } else {
      console.warn("Tawk.to aún no ha cargado");
    }
  };

  return (
    <button 
      onClick={handleOpenChat}
      className="bg-gmc-gris-oscuro text-white px-8 py-3 rounded-lg font-bold text-sm hover:bg-black transition-colors shadow-lg"
    >
      Contact Support
    </button>
  );
}