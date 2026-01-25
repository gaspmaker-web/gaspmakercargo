import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Box, User, Scale, Edit, FileText, CheckCircle, Truck } from 'lucide-react';

// Importamos el formulario Legacy
import ReceivePackageForm from '@/components/admin/ReceivePackageForm';
// 👇 IMPORTAMOS EL NUEVO COMPONENTE PROFESIONAL DE EVIDENCIA
import AdminDeliveryProof from '@/components/admin/AdminDeliveryProof';
// 👇 IMPORTAMOS EL NUEVO GATILLO DE OPERACIONES (BOTONES)
import PackageStatusManager from '@/components/admin/PackageStatusManager';

export default async function PackageDetailPage({ params }: { params: { id: string, locale: string } }) {
  const session = await auth();
  
  // 1. Seguridad
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'WAREHOUSE')) {
    redirect('/login-cliente');
  }

  // 2. Buscar el Paquete
  const pkg = await prisma.package.findUnique({
    where: { id: params.id },
    include: { user: true }
  });

  if (!pkg) return notFound();

  // Detectamos si es una Pre-Alerta pura
  const isPreAlert = pkg.status === 'PRE_ALERTA';

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-montserrat">
      <div className="max-w-5xl mx-auto">
        
        {/* Header de Navegación */}
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <Link href={`/${params.locale}/dashboard-admin/paquetes`} className="text-gray-500 hover:text-black flex items-center gap-2 transition-colors">
                <ArrowLeft size={20} /> Volver a la Lista
            </Link>
            
            {!isPreAlert && (
                <Link 
                    href={`/${params.locale}/dashboard-admin/paquetes/${pkg.id}/editar`}
                    className="bg-black text-white px-5 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-gray-800 transition shadow-md"
                >
                    <Edit size={16} /> Editar / Corregir Entrada
                </Link>
            )}
        </div>

        {/* --- LÓGICA DE VISTA --- */}
        
        {isPreAlert ? (
            <ReceivePackageForm pkg={pkg} />
        ) : (
            <>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                    
                    {/* Encabezado */}
                    <div className="bg-[#222b3c] text-white p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <Box className="text-gmc-dorado-principal" size={24} />
                                <h1 className="text-2xl font-bold font-mono tracking-wide">
                                    {pkg.gmcTrackingNumber}
                                </h1>
                            </div>
                            <p className="text-sm text-gray-400 flex items-center gap-2">
                                <Truck size={14}/> Tracking Original: <span className="font-mono bg-white/10 px-2 py-0.5 rounded">{pkg.carrierTrackingNumber || 'GMC Interno'}</span>
                            </p>
                        </div>
                        <div>
                            <span className={`px-4 py-2 rounded-lg text-sm font-bold border ${
                                pkg.status === 'EN_ALMACEN' ? 'bg-blue-600 text-white border-blue-500' :
                                pkg.status === 'ENTREGADO' ? 'bg-green-600 text-white border-green-500' :
                                pkg.status === 'PROCESADO' ? 'bg-green-600 text-white border-green-500' :
                                'bg-gray-700 text-gray-300 border-gray-600'
                            }`}>
                                {pkg.status.replace('_', ' ')}
                            </span>
                        </div>
                    </div>

                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                        
                        {/* 1. Cliente */}
                        <div className="md:col-span-1 border-r border-gray-100 pr-4">
                            <h3 className="text-xs font-bold text-gray-400 uppercase mb-4 flex items-center gap-2">
                                <User size={14}/> Propietario
                            </h3>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
                                    {pkg.user?.name?.[0] || 'U'}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-800 leading-tight">{pkg.user?.name}</p>
                                    <p className="text-xs text-gray-500">{pkg.user?.email}</p>
                                </div>
                            </div>
                            <div className="bg-blue-50 px-3 py-2 rounded border border-blue-100 inline-block">
                                <span className="text-xs text-blue-800 font-bold uppercase">Casillero: </span>
                                <span className="text-sm font-mono font-bold text-blue-900">{pkg.user?.suiteNo}</span>
                            </div>
                        </div>

                        {/* 2. Datos Físicos */}
                        <div className="md:col-span-1 border-r border-gray-100 pr-4">
                            <h3 className="text-xs font-bold text-gray-400 uppercase mb-4 flex items-center gap-2">
                                <Scale size={14}/> Datos Físicos
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Peso:</span>
                                    <span className={`font-bold text-lg ${pkg.weightLbs === 0 ? 'text-red-500' : 'text-gray-900'}`}>
                                        {pkg.weightLbs || 0} <span className="text-xs text-gray-400">lb</span>
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Medidas:</span>
                                    <span className="font-mono text-sm text-gray-800 bg-gray-100 px-2 py-1 rounded">
                                        {pkg.lengthIn || 0} x {pkg.widthIn || 0} x {pkg.heightIn || 0} <span className="text-xs text-gray-400">in</span>
                                    </span>
                                </div>
                                {pkg.weightLbs === 0 && (
                                    <p className="text-xs text-red-500 font-bold mt-2 bg-red-50 p-1 rounded text-center">
                                        ⚠️ Pendiente de Pesar
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* 3. Notas */}
                        <div className="md:col-span-1">
                            <h3 className="text-xs font-bold text-gray-400 uppercase mb-4 flex items-center gap-2">
                                <FileText size={14}/> Descripción / Notas
                            </h3>
                            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 text-sm text-gray-700 italic min-h-[80px] max-h-[150px] overflow-y-auto whitespace-pre-wrap">
                                {pkg.description || "Sin descripción."}
                            </div>
                        </div>
                    </div>

                    {/* Sección de Fotos (Almacén y Miniatura de Entrega) */}
                    <div className="border-t border-gray-100 p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            
                            {/* Foto Recepción */}
                            <div className="bg-white p-4 rounded-xl border border-gray-200">
                                <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <CheckCircle size={16} className="text-green-600"/> Foto Recepción (Miami)
                                </h3>
                                {pkg.photoUrlMiami ? (
                                    <div className="relative h-64 w-full rounded-lg overflow-hidden border border-gray-200 shadow-inner group">
                                        <Image 
                                            src={pkg.photoUrlMiami} 
                                            alt="Foto Miami" 
                                            fill 
                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    </div>
                                ) : (
                                    <div className="h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400">
                                        <span className="text-xs font-bold">Sin foto de almacén</span>
                                        <span className="text-[10px] text-gray-300">Usa el botón "Editar" para subirla</span>
                                    </div>
                                )}
                            </div>

                            {/* Foto Entrega (Vista previa pequeña) */}
                            <div className="bg-white p-4 rounded-xl border border-gray-200 opacity-75">
                                <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <Truck size={16} className="text-blue-600"/> Foto Entrega Final
                                </h3>
                                {pkg.deliveryPhotoUrl ? (
                                    <div className="relative h-64 w-full rounded-lg overflow-hidden border border-gray-200 shadow-inner">
                                        <Image 
                                            src={pkg.deliveryPhotoUrl} 
                                            alt="Foto Entrega" 
                                            fill 
                                            className="object-cover"
                                        />
                                    </div>
                                ) : (
                                    <div className="h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400">
                                        <span className="text-xs">Pendiente de entrega</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- 🛠️ PANEL DE OPERACIONES (GATILLO) --- */}
                {/* Botones para Enviar o Recibir en Destino */}
                <div className="mb-6">
                    <PackageStatusManager pkg={pkg} />
                </div>

                {/* 👇 COMPONENTE DE POD (Solo se ve si está entregado) */}
                <AdminDeliveryProof pkg={pkg} />

            </>
        )}

      </div>
    </div>
  );
}