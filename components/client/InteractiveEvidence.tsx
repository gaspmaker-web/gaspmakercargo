"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import EvidenceModal from './EvidenceModal';

interface Props {
  photoUrl: string;
  trackingNumber: string;
}

export default function InteractiveEvidence({ photoUrl, trackingNumber }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div 
        onClick={() => setIsOpen(true)}
        className="relative w-full h-48 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 shadow-inner cursor-zoom-in group"
      >
          <Image 
            src={photoUrl} 
            alt="Foto Almacén" 
            fill 
            className="object-contain group-hover:scale-105 transition-transform duration-500" 
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-all">
              <span className="text-white opacity-0 group-hover:opacity-100 font-bold text-xs bg-black/40 px-3 py-1 rounded-full shadow-lg backdrop-blur-sm">
                Ampliar Evidencia
              </span>
          </div>
      </div>

      <EvidenceModal 
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        photoUrl={photoUrl}
        trackingNumber={trackingNumber}
      />
    </>
  );
}