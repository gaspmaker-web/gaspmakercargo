"use client";

import React from 'react';
import Image from 'next/image';
import { CheckCircle, Camera, Calendar, MapPin, User, FileText } from 'lucide-react';

interface AdminDeliveryProofProps {
  pkg: any; 
}

export default function AdminDeliveryProof({ pkg }: AdminDeliveryProofProps) {
  // Si el paquete NO está entregado, este componente se oculta automáticamente.
  if (pkg.status !== 'ENTREGADO') return null;

  return (
    <div className="mt-8 bg-white border border-green-200 rounded-xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-4">
        {/* Encabezado Profesional */}
        <div className="bg-green-600 px-6 py-4 border-b border-green-700 flex justify-between items-center text-white">
            <h3 className="font-bold flex items-center gap-2 text-lg">
                <CheckCircle size={24} className="text-green-200"/> Evidencia de Entrega Final (POD)
            </h3>
            <span className="text-xs font-bold text-green-800 bg-green-100 px-3 py-1 rounded-full border border-green-200 shadow-sm">
                COMPLETADO & ARCHIVADO
            </span>
        </div>
        
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* IZQUIERDA: FOTO EVIDENCIA */}
            <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-1">
                    <Camera size={14}/> Foto Capturada por Driver
                </p>
                <div className="relative h-80 w-full bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 overflow-hidden group shadow-inner">
                    {pkg.deliveryPhotoUrl ? (
                        <a href={pkg.deliveryPhotoUrl} target="_blank" rel="noopener noreferrer" className="block w-full h-full cursor-zoom-in">
                            <Image 
                                src={pkg.deliveryPhotoUrl} 
                                alt="Prueba de Entrega" 
                                fill 
                                className="object-contain p-2 group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center pointer-events-none">
                                <span className="opacity-0 group-hover:opacity-100 bg-black/70 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-md">
                                    Click para ampliar original
                                </span>
                            </div>
                        </a>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <Camera size={48} className="mb-2 opacity-20"/>
                            <p className="text-sm font-bold">Sin foto disponible</p>
                        </div>
                    )}
                </div>
            </div>

            {/* DERECHA: METADATOS DE AUDITORÍA */}
            <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Fecha de Entrega</p>
                    <p className="font-mono text-xl text-gray-800 flex items-center gap-2 font-bold">
                        <Calendar size={20} className="text-green-600"/>
                        {pkg.updatedAt ? new Date(pkg.updatedAt).toLocaleString() : 'N/A'}
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 border rounded-lg">
                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">Recibido Por</p>
                        <p className="text-sm font-bold text-gray-800 flex items-center gap-2 truncate">
                            <User size={16} className="text-blue-500"/>
                            {pkg.user?.name || 'Cliente'}
                        </p>
                    </div>
                    <div className="p-3 border rounded-lg">
                         <p className="text-xs font-bold text-gray-400 uppercase mb-1">Destino</p>
                        <p className="text-sm font-bold text-gray-800 flex items-center gap-2 truncate">
                            <MapPin size={16} className="text-red-500"/>
                            {pkg.user?.country || 'Internacional'}
                        </p>
                    </div>
                </div>

                <div>
                     <p className="text-xs font-bold text-gray-400 uppercase mb-2">Firma Digital</p>
                     <div className="h-24 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-xs text-gray-400 italic shadow-sm">
                        <span className="flex items-center gap-1"><FileText size={14}/> Firma digital archivada en sistema seguro.</span>
                     </div>
                </div>

                <div className="text-[10px] text-gray-300 border-t pt-4 mt-2 font-mono">
                    System ID: {pkg.id}
                </div>
            </div>
        </div>
    </div>
  );
}