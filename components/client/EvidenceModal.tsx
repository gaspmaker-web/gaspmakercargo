"use client";

import React from 'react';
import Image from 'next/image';
import { X, Download, Package, Calendar } from 'lucide-react';

interface EvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  photoUrl: string | null;
  trackingNumber: string;
}

export default function EvidenceModal({ isOpen, onClose, photoUrl, trackingNumber }: EvidenceModalProps) {
  if (!isOpen || !photoUrl) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 text-white/70 hover:text-white p-2 transition-all hover:rotate-90 z-[110]"
      >
        <X size={32} />
      </button>

      <div className="max-w-4xl w-full flex flex-col gap-4">
        <div className="flex items-center justify-between text-white px-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gmc-dorado-principal">Warehouse Evidence</p>
            <h3 className="text-xl font-mono font-bold">{trackingNumber}</h3>
          </div>
          <a 
            href={photoUrl} 
            download 
            target="_blank"
            className="bg-white/10 hover:bg-white/20 p-3 rounded-full transition-all border border-white/10"
          >
            <Download size={20} />
          </a>
        </div>

        <div className="relative aspect-video w-full overflow-hidden rounded-3xl shadow-2xl border border-white/10 bg-gray-900">
          <Image 
            src={photoUrl} 
            alt="Evidencia Gasp Maker" 
            fill 
            className="object-contain"
            priority
          />
        </div>
      </div>
    </div>
  );
}