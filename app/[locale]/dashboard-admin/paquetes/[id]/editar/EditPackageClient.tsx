"use client";

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ReceivePackageForm from '@/components/admin/ReceivePackageForm';

interface EditPackageClientProps {
  pkg: any;
  locale: string;
}

export default function EditPackageClient({ pkg, locale }: EditPackageClientProps) {
  return (
    <div className="min-h-screen bg-gray-50 p-6 font-montserrat">
      <div className="max-w-4xl mx-auto">
        
        {/* Botón Volver */}
        <div className="mb-6">
            <Link href={`/${locale}/dashboard-admin/paquetes`} className="text-gray-500 hover:text-black flex items-center gap-2 transition-colors">
                <ArrowLeft size={20} /> Cancelar y volver a la lista
            </Link>
        </div>

        <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800 font-garamond">
                Recepción de Paquete
            </h1>
            <p className="text-gray-500 mt-1">
                Ingresa los datos reales de báscula para el recibo generado desde la solicitud.
            </p>
        </div>

        {/* Aquí insertamos el componente Formulario */}
        <ReceivePackageForm pkg={pkg} />

      </div>
    </div>
  );
}