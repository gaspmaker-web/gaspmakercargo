import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowLeft, User, Phone, MapPin, Package, Camera, CheckCircle, 
  ExternalLink, PenTool, Map as MapIcon, Clock 
} from 'lucide-react';

// IMPORTAMOS EL COMPONENTE DE ACCIÓN
import AdminPickupActions from '@/components/admin/AdminPickupActions';

export default async function PickupRequestDetailPage({ params }: { params: { id: string, locale: string } }) {
  const session = await auth();
  
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'WAREHOUSE')) {
    redirect('/login-cliente');
  }

  const req = await prisma.pickupRequest.findUnique({
    where: { id: params.id },
    include: { user: true }
  });

  if (!req) return notFound();

  const driverLinkPath = `/dashboard-driver/tareas/${req.id}`;

  // 🔍 DETECCIÓN: ¿Es Delivery?
  const isDelivery = req.serviceType?.toUpperCase() === 'DELIVERY';

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-montserrat">
      <div className="max-w-7xl mx-auto">
        
        <div className="mb-6">
            <Link href={`/${params.locale}/dashboard-admin/solicitudes-pickup`} className="text-gray-500 hover:text-black flex items-center gap-2 transition-colors">
                <ArrowLeft size={20} /> Volver a la lista
            </Link>
        </div>

        {/* GRID RESPONSIVO */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* --- COLUMNA DERECHA (ACCIONES Y DETALLES) --- */}
            <div className="space-y-6 order-first lg:order-last lg:col-span-1 lg:sticky lg:top-6">
                
                {/* 1. BOTÓN DE ACCIÓN (Recepción en Almacén) */}
                {/* Pasamos el serviceType para que sepa si ocultarse */}
                <div className="bg-white p-1 rounded-xl border-2 border-gmc-dorado-principal shadow-lg">
                    <AdminPickupActions 
                        pickupId={req.id} 
                        status={req.status} 
                        serviceType={req.serviceType || 'SHIPPING'} // ✅ CLAVE: Pasamos el tipo
                    />
                </div>

                {/* 1.1 Si es DELIVERY, mostramos Tracking en Vivo */}
                {isDelivery && req.tookanLink && (
                     <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm">
                        <h4 className="font-bold text-gray-800 mb-2 text-sm flex items-center gap-2">
                            <MapIcon size={16} className="text-blue-600"/> Seguimiento en Vivo
                        </h4>
                        <a 
                            href={req.tookanLink} 
                            target="_blank"
                            className="block w-full text-center bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition"
                        >
                            Ver Driver en Mapa
                        </a>
                     </div>
                )}

                {/* 2. Detalles Financieros */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                    <h4 className="font-bold text-gray-800 mb-3 text-sm">Detalles Financieros</h4>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Servicio</span>
                            <span className="font-medium text-gray-900">{req.serviceType}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Est. Peso</span>
                            <span className="font-medium text-gray-900">{req.weightInfo || 'N/A'}</span>
                        </div>
                        <div className="border-t border-gray-100 my-2 pt-2 flex justify-between">
                            <span className="font-bold text-gray-700">Total Pagado</span>
                            <span className="font-bold text-green-600">${req.totalPaid?.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* 3. Link Chofer */}
                <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
                     <p className="font-bold text-blue-800 mb-2 text-sm flex items-center gap-2">
                        <ExternalLink size={14}/> Link Chofer
                     </p>
                     <code className="block bg-white p-2 rounded border border-blue-200 text-xs text-gray-600 break-all font-mono select-all">
                        {driverLinkPath}
                     </code>
                </div>
            </div>

            {/* --- COLUMNA IZQUIERDA (DATOS PRINCIPALES) --- */}
            <div className="lg:col-span-2 space-y-6">
                
                {/* TARJETA DE INFO */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-gmc-gris-oscuro text-white p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold font-garamond flex items-center gap-2">
                                Solicitud #{req.id.slice(0,8).toUpperCase()}
                            </h1>
                            <p className="text-sm text-gray-400">Creada el {new Date(req.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                            <span className={`px-4 py-2 rounded-lg text-sm font-bold border ${
                                req.status === 'COMPLETADO' || req.status === 'ENTREGADO' ? 'bg-green-500 text-white border-green-600' :
                                req.status === 'PROCESADO' ? 'bg-gray-600 text-gray-300 border-gray-500' :
                                'bg-white/10 text-white border-white/20'
                            }`}>
                                {req.status.replace('_', ' ')}
                            </span>
                        </div>
                    </div>

                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Cliente */}
                        <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2 tracking-wider">
                                <User size={14}/> Cliente
                            </h3>
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                    {req.user?.name?.[0] || 'C'}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-800">{req.user?.name || 'Cliente'}</p>
                                    <p className="text-sm text-gray-500">{req.user?.email}</p>
                                    <p className="text-xs text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded inline-block mt-1">
                                        Suite: {req.user?.suiteNo || 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Contacto */}
                        <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2 tracking-wider">
                                <Phone size={14}/> Contacto
                            </h3>
                            <p className="text-lg font-medium text-gray-800">{req.contactPhone || 'No registrado'}</p>
                            <p className="text-sm text-gray-500">
                                Fecha: <span className="text-gray-800 font-bold">{req.pickupDate ? new Date(req.pickupDate).toLocaleDateString() : 'Pendiente'}</span>
                            </p>
                        </div>

                        {/* Ruta */}
                        <div className="md:col-span-2 bg-gray-50 p-5 rounded-xl border border-gray-200 relative">
                            <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-gray-300 border-l border-dashed border-gray-300"></div>
                            
                            <div className="relative pl-8 mb-6">
                                <div className="absolute left-0 top-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-sm -ml-[5px]"></div>
                                <p className="text-xs font-bold text-gray-400 uppercase mb-1">Origen (A)</p>
                                <p className="font-medium text-gray-800 text-lg">{req.originAddress}</p>
                            </div>

                            <div className="relative pl-8">
                                <div className="absolute left-0 top-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-sm -ml-[5px]"></div>
                                <p className="text-xs font-bold text-gray-400 uppercase mb-1">Destino (B)</p>
                                <p className="font-medium text-gray-800">{req.dropOffAddress || 'Almacén Central GMC'}</p>
                            </div>
                        </div>

                        {/* Carga */}
                        <div className="md:col-span-2">
                            <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2 tracking-wider">
                                <Package size={14}/> Detalles de Carga
                            </h3>
                            <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 text-gray-700 italic flex items-start gap-3">
                                <span className="text-2xl text-yellow-400 leading-none">“</span>
                                <p>{req.description || 'Sin descripción'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- SECCIÓN DE EVIDENCIA --- */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2 font-garamond">
                        <Camera size={20} className="text-purple-600"/> Evidencia de la Operación
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* 1. FOTO RECOGIDA */}
                        <div className="border border-gray-100 rounded-xl p-3 bg-gray-50/50">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-1 rounded flex items-center gap-1">
                                    <CheckCircle size={12}/> RECOGIDA
                                </span>
                            </div>
                            
                            {req.photoPickupUrl ? (
                                <div className="relative h-48 w-full rounded-lg overflow-hidden border border-gray-200 shadow-md group">
                                    <Image src={req.photoPickupUrl} alt="Recogida" fill className="object-cover group-hover:scale-105 transition-transform duration-500"/>
                                    <a href={req.photoPickupUrl} target="_blank" className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white font-bold text-xs"><ExternalLink size={16} className="mr-1"/> VER FOTO</a>
                                </div>
                            ) : (
                                <div className="h-48 w-full rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 bg-white">
                                    <Camera size={24} className="mb-2 opacity-30"/>
                                    <span className="text-xs font-medium">Sin foto</span>
                                </div>
                            )}
                        </div>

                        {/* 2. FOTO ENTREGA */}
                        <div className="border border-gray-100 rounded-xl p-3 bg-gray-50/50">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded flex items-center gap-1">
                                    <CheckCircle size={12}/> ENTREGA FINAL
                                </span>
                            </div>

                            {req.photoDeliveryUrl ? (
                                <div className="relative h-48 w-full rounded-lg overflow-hidden border border-gray-200 shadow-md group">
                                    <Image src={req.photoDeliveryUrl} alt="Entrega" fill className="object-cover group-hover:scale-105 transition-transform duration-500"/>
                                    <a href={req.photoDeliveryUrl} target="_blank" className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white font-bold text-xs"><ExternalLink size={16} className="mr-1"/> VER FOTO</a>
                                </div>
                            ) : (
                                <div className="h-48 w-full rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 bg-white">
                                    <Clock size={24} className="mb-2 opacity-30"/>
                                    <span className="text-xs font-medium">Pendiente</span>
                                </div>
                            )}
                        </div>

                        {/* 3. FIRMA */}
                        {req.signatureUrl && (
                            <div className="md:col-span-2 mt-2 pt-4 border-t border-gray-100">
                                 <p className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1">
                                    <PenTool size={12} className="text-black"/> Firma de Conformidad
                                </p>
                                <div className="bg-white border border-gray-200 rounded-xl p-4 flex justify-center">
                                    <img src={req.signatureUrl} alt="Firma Cliente" className="h-24 object-contain opacity-90"/>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}