import prisma from '@/lib/prisma';
import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle, Truck, MapPin, Camera, Clock, Package as PackageIcon, User, ArrowLeft, PenTool } from 'lucide-react';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function TrackingPage({ 
  params, 
  searchParams 
}: { 
  params: { trackingNumber: string },
  searchParams?: { from?: string } // 👈 1. ACEPTAMOS EL PARÁMETRO 'from'
}) {
  const { trackingNumber } = params;

  // 1. Buscar el paquete por su Tracking Number (GMC)
  const pkg = await prisma.package.findFirst({
    where: { gmcTrackingNumber: trackingNumber },
    include: { user: true }
  });

  if (!pkg) return notFound(); 

  // Lógica de Estado
  const statusUpper = pkg.status.toUpperCase();
  const isDelivered = statusUpper === 'ENTREGADO' || statusUpper === 'DELIVERED' || statusUpper === 'COMPLETADO';
  
  // URL del Mapa de Tookan
  // ✅ CORREGIDO: Usamos pkg.gmcTrackingNumber porque pkg.trackingNumber no existe
  const tookanTrackingLink = pkg.tookanLink || `https://jungleworks.com/tookan/tracking/${pkg.gmcTrackingNumber}`; 

  // URL de la Foto de Prueba
  const proofOfDeliveryPhoto = pkg.deliveryPhotoUrl || "/placeholder-delivery.jpg";

  // --- LÓGICA INTELIGENTE DE DESTINO ---
  let destinationName = pkg.user.country;

  if (!destinationName && pkg.courierService?.toLowerCase().includes('barbados')) {
      destinationName = 'Barbados';
  }
  
  if (!destinationName) {
      destinationName = pkg.user.countryCode ? pkg.user.countryCode.toUpperCase() : 'INTERNACIONAL';
  }

  // 👇 2. LÓGICA DE NAVEGACIÓN INTELIGENTE (Solución al error de redirección)
  let backLink = '/dashboard-cliente';
  let backLabel = 'Volver al Dashboard';

  if (searchParams?.from === 'admin') {
      // Si venimos del Admin, volvemos al Admin (Evita el error 403/Redirección)
      backLink = '/dashboard-admin/historial-envios';
      backLabel = 'Volver al Historial (Admin)';
  } else if (isDelivered) {
      // Si es cliente y ya se entregó, lo mandamos a su historial
      backLink = '/dashboard-cliente/en-destino';
      backLabel = 'Volver al Historial';
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-6 sm:py-10 px-4 font-sans">
      
      {/* BOTÓN VOLVER (Dinámico según quién lo ve) */}
      <div className="w-full max-w-3xl mb-4">
          <Link 
            href={backLink}
            className="inline-flex items-center text-gray-500 hover:text-blue-600 transition-colors font-medium text-sm"
          >
            <ArrowLeft size={18} className="mr-2" />
            {backLabel}
          </Link>
      </div>

      {/* TARJETA PRINCIPAL */}
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        
        {/* CABECERA: ESTADO */}
        <div className={`p-6 sm:p-8 text-white text-center transition-colors duration-500 ${isDelivered ? 'bg-green-600' : 'bg-blue-600'}`}>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-3">
                {isDelivered ? <CheckCircle size={32} className="shrink-0"/> : <Truck size={32} className="animate-bounce shrink-0"/>}
                <span>{isDelivered ? '¡PAQUETE ENTREGADO!' : 'TU PAQUETE ESTÁ EN CAMINO'}</span>
            </h1>
            <p className="opacity-90 font-mono text-base sm:text-lg tracking-wider">{pkg.gmcTrackingNumber}</p>
        </div>

        {/* CONTENIDO */}
        <div className="p-4 sm:p-6">
            
            {/* ESCENARIO 1: EN CAMINO (MAPA EN VIVO) */}
            {!isDelivered && (
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4 text-blue-800 font-bold bg-blue-50 p-3 rounded-lg border border-blue-100 text-sm sm:text-base">
                        <MapPin className="animate-pulse shrink-0" />
                        <span>Sigue a tu Driver en tiempo real:</span>
                    </div>
                    
                    <div className="w-full h-[300px] sm:h-[400px] rounded-xl overflow-hidden shadow-inner border border-gray-300 relative bg-gray-100">
                        <iframe 
                            src={tookanTrackingLink} 
                            width="100%" 
                            height="100%" 
                            frameBorder="0"
                            allowFullScreen
                            className="absolute inset-0"
                        />
                    </div>
                    <p className="text-center text-xs text-gray-400 mt-2">Powered by Tookan Live Map</p>
                </div>
            )}

            {/* ESCENARIO 2: ENTREGADO (FOTO + FIRMA) */}
            {isDelivered && (
                <div className="mb-8 animate-in zoom-in duration-500">
                    
                    {/* FOTO */}
                    <div className="flex items-center gap-2 mb-4 text-green-800 font-bold bg-green-50 p-3 rounded-lg border border-green-100 text-sm sm:text-base">
                        <Camera className="shrink-0" />
                        <span>Prueba de Entrega (Proof of Delivery):</span>
                    </div>

                    <div className="relative w-full h-[300px] sm:h-[450px] rounded-xl overflow-hidden shadow-lg border-4 border-white bg-gray-100 mb-6">
                         {pkg.deliveryPhotoUrl ? (
                             <img 
                                src={proofOfDeliveryPhoto} 
                                alt="Prueba de Entrega" 
                                className="object-cover w-full h-full hover:scale-105 transition-transform duration-700"
                             />
                         ) : (
                             <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                                 <Camera size={48} opacity={0.2} />
                                 <p>Foto no disponible</p>
                             </div>
                         )}
                    </div>
                    
                    {/* 👇 SECCIÓN DE FIRMA DIGITAL 👇 */}
                    {pkg.deliverySignature && (
                        <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center mb-4 shadow-sm relative overflow-hidden">
                            <div className="absolute top-2 left-3 flex items-center gap-1 text-xs font-bold text-gray-400 uppercase">
                                <PenTool size={12} /> Firma de Conformidad
                            </div>
                            {/* Mostramos la firma */}
                            <img 
                                src={pkg.deliverySignature} 
                                alt="Firma Digital Cliente" 
                                className="h-24 sm:h-32 object-contain mt-2 opacity-85 hover:opacity-100 transition-opacity"
                            />
                            <div className="w-32 h-px bg-gray-200 mt-2"></div>
                            <p className="text-xs text-gray-400 font-mono mt-1">Firmado Digitalmente</p>
                        </div>
                    )}

                    {/* PIE DE PÁGINA DE ENTREGA */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-4 text-sm text-gray-500 px-2 gap-2 border-t pt-4">
                        <span className="flex items-center gap-1"><Clock size={16}/> Entregado el: {new Date(pkg.updatedAt).toLocaleDateString()}</span>
                        <span className="font-bold text-gray-800 flex items-center gap-1">
                            <User size={16}/> Recibido por: {pkg.user.name}
                        </span>
                    </div>
                </div>
            )}

            {/* DETALLES DEL ENVÍO */}
            <div className="border-t border-gray-100 pt-6 mt-2">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <PackageIcon size={18} className="text-gray-400"/> Detalles del Envío
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm bg-gray-50 p-4 rounded-xl border border-gray-100">
                    
                    {/* DESTINO */}
                    <div>
                        <p className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                            <MapPin size={12}/> Destino
                        </p>
                        <p className="font-bold text-gray-800 text-lg leading-tight capitalize">
                            {destinationName}
                        </p>
                        <p className="text-gray-500 text-xs font-mono mt-0.5">
                            Casillero: {pkg.user.suiteNo}
                        </p>
                    </div>

                    {/* CONTENIDO */}
                    <div>
                        <p className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                            <PackageIcon size={12}/> Contenido
                        </p>
                        <p className="font-bold text-gray-800 text-lg leading-tight capitalize">
                            {pkg.description || 'Paquetería General'}
                        </p>
                         <p className="text-gray-500 text-xs mt-0.5">
                            Courier: {pkg.selectedCourier || 'GMC'}
                        </p>
                    </div>

                </div>
            </div>

        </div>
      </div>
    </div>
  );
}