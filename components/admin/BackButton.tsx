"use client";

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  href: string;
  label?: string;
}

export default function BackButton({ href, label = "Volver" }: BackButtonProps) {
  const router = useRouter();
  
  return (
    <button 
      onClick={() => router.push(href)}
      className="inline-flex items-center text-gray-500 hover:text-gmc-dorado-principal transition-colors font-bold py-2 cursor-pointer relative z-50"
      type="button"
    >
      <ArrowLeft size={20} className="mr-2" /> {label}
    </button>
  );
}