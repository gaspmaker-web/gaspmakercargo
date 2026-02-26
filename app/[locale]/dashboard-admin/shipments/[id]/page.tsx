import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Box, User, Scale, Truck, Layers, CheckCircle } from 'lucide-react';
import AdminDeliveryProof from '@/components/admin/AdminDeliveryProof';
// 🔥 IMPORTAMOS EL NUEVO ADMINISTRADOR BILINGÜE
import PackageStatusManager from '@/components/admin/PackageStatusManager';

export const dynamic = 'force-dynamic';

export default async function ShipmentDetailPage({ params }: { params: { id: string, locale: string } }) {
  const session = await auth();
  
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'WAREHOUSE')) {
    redirect('/login-cliente');
  }

  const shipment = await prisma.consolidatedShipment.findFirst({
    where: {
      OR: [
        { id: params.id },                  
        { gmcShipmentNumber: params.id }    
      ]
    },
    include: { 
        user: true,
        packages: true 
    }
  });

  if (!shipment) return notFound();

  const proofPackage = shipment.packages.find(p => p.deliveryPhotoUrl || p.deliverySignature);
  
  const isDelivered = shipment.status === 'ENTREGADO' || shipment.status === 'DELIVERED' || shipment.status === 'COMPLETADO';

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-montserrat">
      <div className="max-w-5xl mx-auto">
        
        <div className="mb-6 flex items-center gap-4">
            <Link href={`/dashboard-admin/consolidaciones`} className="text-gray-500 hover:text-black flex items-center gap-2 transition-colors">
                <ArrowLeft size={20} /> Volver a Consolidaciones
            </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
            
            <div className="bg-[#222b3c] text-white p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <Layers className="text-purple-400" size={24} />
                        <h1 className="text-2xl font-bold font-mono tracking-wide">
                            {shipment.gmcShipmentNumber}
                        </h1>
                    </div>
                    <p className="text-sm text-gray-400 flex items-center gap-2">
                        <Truck size={14}/> Courier: <span className="font-bold text-white">{shipment.selectedCourier}</span>
                    </p>
                </div>
                <div>
                    <span className={`px-4 py-2 rounded-lg text-sm font-bold border ${isDelivered ? 'bg-green-600 border-green-500' : 'bg-purple-600 border-purple-500'} text-white`}>
                        {shipment.status.replace(/_/g, ' ')}
                    </span>
                </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                
                <div className="md:col-span-1 border-r border-gray-100 pr-4">
                    <h3 className="text-xs font-bold text-gray-400 uppercase mb-4 flex items-center gap-2">
                        <User size={14}/> Propietario
                    </h3>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
                            {shipment.user?.name?.[0] || 'U'}
                        </div>
                        <div>
                            <p className="font-bold text-gray-800 leading-tight">{shipment.user?.name}</p>
                            <p className="text-xs text-gray-500">{shipment.user?.email}</p>
                        </div>
                    </div>
                    <div className="bg-blue-50 px-3 py-2 rounded border border-blue-100 inline-block">
                        <span className="text-xs text-blue-800 font-bold uppercase">Casillero: </span>
                        <span className="text-sm font-mono font-bold text-blue-900">{shipment.user?.suiteNo}</span>
                    </div>
                </div>

                <div className="md:col-span-1 border-r border-gray-100 pr-4">
                    <h3 className="text-xs font-bold text-gray-400 uppercase mb-4 flex items-center gap-2">
                        <Scale size={14}/> Datos Consolidación
                    </h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Peso Total:</span>
                            <span className="font-bold text-lg text-gray-900">
                                {shipment.weightLbs || 0} <span className="text-xs text-gray-400">lb</span>
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Medidas:</span>
                            <span className="font-mono text-sm text-gray-800 bg-gray-100 px-2 py-1 rounded">
                                {shipment.lengthIn || 0} x {shipment.widthIn || 0} x {shipment.heightIn || 0} <span className="text-xs text-gray-400">in</span>
                            </span>
                        </div>
                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
                             <span className="text-xs text-gray-500">Paquetes:</span>
                             <span className="font-bold bg-purple-100 text-purple-700 px-2 rounded-full text-xs">{shipment.packages.length}</span>
                        </div>
                    </div>
                </div>

                <div className="md:col-span-1">
                    <h3 className="text-xs font-bold text-gray-400 uppercase mb-4 flex items-center gap-2">
                        <Truck size={14}/> Detalles
                    </h3>
                    <div className="space-y-2 text-sm">
                        <p><span className="text-gray-500">Servicio:</span> <span className="font-bold">{shipment.courierService}</span></p>
                        <p><span className="text-gray-500">Tracking Salida:</span></p>
                        <p className="font-mono bg-gray-100 p-2 rounded text-center text-xs break-all">
                            {shipment.finalTrackingNumber || 'Pendiente'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="border-t border-gray-200">
                <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                    <h3 className="text-xs font-bold text-gray-500 uppercase">Contenido de la Caja</h3>
                </div>
                <div className="divide-y divide-gray-100">
                    {shipment.packages.map((pkg) => (
                        <div key={pkg.id} className="px-6 py-3 flex justify-between items-center hover:bg-gray-50">
                            <div className="flex items-center gap-3">
                                <Box size={16} className="text-gray-400"/>
                                <div>
                                    <p className="font-bold text-sm text-gray-800">{pkg.gmcTrackingNumber}</p>
                                    <p className="text-xs text-gray-500">{pkg.description}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-mono text-gray-400">{pkg.carrierTrackingNumber}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* --- 🔥 ESTADOS Y ACCIONES 🔥 --- */}
        {isDelivered && proofPackage ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <CheckCircle className="text-green-600" /> Evidencia de Entrega Final
                </h3>
                <AdminDeliveryProof pkg={proofPackage} />
            </div>
        ) : (
            <div className="mb-6">
                {/* 🛡️ EL ESCUDO: Usamos el manager inteligente pasándole que SÍ es consolidación */}
                <PackageStatusManager pkg={shipment} isConsolidation={true} />
            </div>
        )}

      </div>
    </div>
  );
}