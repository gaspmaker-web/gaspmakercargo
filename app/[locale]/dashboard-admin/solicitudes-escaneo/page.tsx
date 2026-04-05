import React from 'react';
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { redirect } from 'next/navigation';
import { FileText, Clock, AlertTriangle } from 'lucide-react';
import ScanUploadForm from './ScanUploadForm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface Props {
  params: { locale: string };
}

export default async function SolicitudesEscaneoPage({ params: { locale } }: Props) {
  const session = await auth();
  if (!session?.user?.role || !['ADMIN', 'SUPERADMIN', 'WAREHOUSE'].includes(session.user.role)) {
    redirect(`/${locale}/login-admin`);
  }

  // Buscamos TODOS los sobres que los clientes pidieron escanear
  const pendingScans = await prisma.mailItem.findMany({
    where: { status: 'SCAN_REQUESTED' },
    include: { user: true },
    orderBy: { updatedAt: 'asc' } // Los más viejos primero (prioridad)
  });

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        
        <div className="flex items-center gap-3 mb-8">
            <div className="bg-blue-600 p-3 rounded-xl shadow-md">
                <FileText className="text-white" size={28} />
            </div>
            <div>
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight uppercase">Mesa de Escaneo</h1>
                <p className="text-gray-500 font-medium">Sobres pendientes de apertura y digitalización.</p>
            </div>
        </div>

        {pendingScans.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center flex flex-col items-center">
                <div className="bg-green-50 text-green-600 p-4 rounded-full mb-4 shadow-sm">
                    <Clock size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">¡Bandeja Limpia!</h3>
                <p className="text-gray-500">No hay solicitudes de escaneo pendientes en este momento.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 gap-4">
                {pendingScans.map((item) => (
                    <div key={item.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-6 items-start md:items-center transition-all hover:shadow-md">
                        
                        {/* Foto del Sobre Original */}
                        <div className="w-full md:w-32 h-32 bg-gray-100 rounded-xl overflow-hidden shrink-0 border border-gray-200 relative group cursor-pointer">
                            <img src={item.envelopeImageUrl} alt="Sobre" className="w-full h-full object-cover" />
                        </div>

                        {/* Datos del Cliente y Remitente */}
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                                <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider">Suite #{item.user?.suiteNo}</span>
                                <span className="text-sm font-bold text-gray-500">{item.user?.name}</span>
                            </div>
                            <p className="text-xl font-black text-gray-900 leading-tight">{item.senderName || 'Remitente No Especificado'}</p>
                            
                            {/* 🔥 NUEVO: Tracking Number para la mesa de escaneo */}
                            {item.trackingNumber && (
                                <div className="pt-1">
                                    <span className="inline-flex items-center text-[12px] font-black uppercase tracking-widest text-slate-800 bg-slate-200 border border-slate-300 px-2 py-1 rounded-md shadow-sm">
                                        Ref: {item.trackingNumber}
                                    </span>
                                </div>
                            )}

                            <p className="text-xs text-gray-400 font-medium pt-1">Solicitado: {new Date(item.updatedAt).toLocaleString()}</p>
                        </div>

                        {/* Formulario para Subir el PDF */}
                        <div className="w-full md:w-auto shrink-0 bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <ScanUploadForm mailItemId={item.id} />
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
}