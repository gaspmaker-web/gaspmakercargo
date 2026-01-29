import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Phone, User, Navigation, Map, AlertCircle, 
  Camera, PackageCheck, CheckCircle, Lock, ExternalLink 
} from 'lucide-react';

export const dynamic = 'force-dynamic';

// ⚠️ CORRECCIÓN AQUÍ: Usamos 'id' en lugar de 'taskId' para coincidir con el nombre de tu carpeta
export default async function DriverTaskPage({ params }: { params: { id: string, locale: string } }) {
  const session = await auth();

  // 1. SEGURIDAD: Solo Choferes
  if (!session || session.user.role?.trim()?.toUpperCase() !== 'DRIVER') {
    redirect(`/${params.locale}/login-cliente`);
  }

  // 2. BUSCAR LA TAREA (Usando params.id)
  const task = await prisma.pickupRequest.findUnique({
    where: { id: params.id }, // 👈 Aquí estaba el error, ahora usa .id
    include: {
        user: { select: { name: true, phone: true } }
    }
  });

  // 3. VALIDACIÓN DE ESTADO
  if (!task || !['PAGADO', 'ACEPTADO', 'EN_CAMINO', 'EN_REPARTO', 'ENTREGADO', 'COMPLETADO'].includes(task.status)) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50 font-montserrat text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Tarea No Disponible</h1>
            <p className="text-sm text-gray-500 mb-6">Esta tarea puede haber sido cancelada o ya no existe.</p>
             <Link href={`/${params.locale}/dashboard-driver`} className="text-gmc-dorado-principal font-bold flex items-center gap-2 bg-white px-6 py-3 rounded-full shadow-md">
                <ArrowLeft size={20}/> Volver al Tablero
            </Link>
        </div>
      );
  }

  // 🧠 LÓGICA DE ESTADO INTELIGENTE
  const isPickupDone = !!task.photoPickupUrl || ['EN_REPARTO', 'ENTREGADO', 'COMPLETADO'].includes(task.status);
  const isDeliveryDone = ['ENTREGADO', 'COMPLETADO'].includes(task.status);

  // --- HELPER PARA BOTONES DE MAPA ---
  const MapButtons = ({ address }: { address: string }) => (
    <div className="flex gap-2 mt-3">
        <a 
            href={`https://waze.com/ul?q=${encodeURIComponent(address)}`} 
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-2 rounded-lg border border-blue-100 active:scale-95 transition-transform hover:bg-blue-100"
        >
            <Navigation size={14}/> Waze
        </a>
        <a 
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`} 
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-1 text-[10px] font-bold text-gray-700 bg-white px-3 py-2 rounded-lg border border-gray-200 active:scale-95 transition-transform hover:bg-gray-50 shadow-sm"
        >
            <Map size={14}/> Google Maps
        </a>
    </div>
  );
  
  return (
    <div className="min-h-screen bg-gray-50 p-4 font-sans pb-24">
      
      {/* HEADER */}
      <div className="mb-6 flex justify-between items-center pt-2">
        <Link 
            href={`/${params.locale}/dashboard-driver`} 
            className="inline-flex items-center text-gray-500 hover:text-black font-bold text-sm bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100 active:scale-95 transition"
        >
            <ArrowLeft size={18} className="mr-1" /> Volver
        </Link>
        <div className="text-right">
             <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider">ORDEN</span>
             <span className="text-xs font-mono font-bold text-gray-600">#{task.id.slice(0,6).toUpperCase()}</span>
        </div>
      </div>

      <div className="max-w-md mx-auto space-y-8">

        {/* --- PASO 1: RECOGIDA --- */}
        <div className={`relative p-5 rounded-2xl border-2 transition-all duration-500 ${isPickupDone ? 'bg-green-50/50 border-green-200' : 'bg-white border-blue-500 shadow-xl ring-4 ring-blue-50'}`}>
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm ${isPickupDone ? 'bg-green-500' : 'bg-blue-600'}`}>
                        {isPickupDone ? <CheckCircle size={18}/> : '1'}
                    </div>
                    <div>
                        <h3 className={`font-bold text-sm uppercase tracking-wide ${isPickupDone ? 'text-green-700' : 'text-blue-700'}`}>Punto de Recogida</h3>
                        <p className="text-xs text-gray-400 font-medium">Origen</p>
                    </div>
                </div>
            </div>

            <div className="pl-11">
                <p className="text-lg font-bold text-gray-800 leading-tight mb-2">{task.originAddress}</p>
                
                {!isPickupDone && <MapButtons address={task.originAddress} />}

                {/* ACCIÓN PRINCIPAL / EVIDENCIA */}
                <div className="mt-4">
                    {isPickupDone ? (
                        <div className="flex flex-col gap-2 animate-in fade-in zoom-in duration-300">
                             <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-bold w-fit border border-green-200">
                                <CheckCircle size={14}/> Recogida Completada
                            </div>
                            
                            {task.photoPickupUrl && (
                                <div className="mt-2 relative w-full h-32 rounded-lg overflow-hidden border border-green-200 shadow-sm group bg-gray-100">
                                    <img 
                                        src={task.photoPickupUrl} 
                                        alt="Evidencia Recogida" 
                                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <a href={task.photoPickupUrl} target="_blank" className="text-white text-xs font-bold flex items-center gap-1 bg-black/50 px-3 py-1 rounded-full">
                                            <ExternalLink size={14}/> Ver Grande
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link 
                            href={`/${params.locale}/dashboard-driver/recogida/${task.id}`}
                            className="block w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold text-center shadow-lg hover:bg-blue-700 transition active:scale-95 flex items-center justify-center gap-2"
                        >
                            <Camera size={20}/> CONFIRMAR RECOGIDA
                        </Link>
                    )}
                </div>
            </div>
        </div>

        {/* --- CONECTOR --- */}
        <div className="absolute left-[34px] md:left-[50%] md:-ml-[216px] -mt-8 h-10 border-l-2 border-dashed border-gray-300 z-0 hidden"></div> 

        {/* --- PASO 2: ENTREGA --- */}
        <div className={`relative p-5 rounded-2xl border-2 transition-all duration-500 ${!isPickupDone ? 'bg-gray-50 border-gray-200 opacity-60 grayscale' : (isDeliveryDone ? 'bg-green-50/50 border-green-200' : 'bg-white border-gmc-dorado-principal shadow-xl ring-4 ring-yellow-50')}`}>
            
            {!isPickupDone && <div className="absolute inset-0 z-20 cursor-not-allowed"></div>}

            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm z-10 ${!isPickupDone ? 'bg-gray-400' : (isDeliveryDone ? 'bg-green-500' : 'bg-[#222b3c]')}`}>
                        {isDeliveryDone ? <CheckCircle size={18}/> : '2'}
                    </div>
                    <div>
                        <h3 className={`font-bold text-sm uppercase tracking-wide ${!isPickupDone ? 'text-gray-500' : (isDeliveryDone ? 'text-green-700' : 'text-gray-900')}`}>
                            Punto de Entrega
                        </h3>
                        <p className="text-xs text-gray-400 font-medium">Destino Final</p>
                    </div>
                </div>
                {!isPickupDone && <Lock className="text-gray-400" size={20}/>}
            </div>

            <div className="pl-11">
                <p className={`text-lg font-bold leading-tight mb-2 ${!isPickupDone ? 'text-gray-500' : 'text-gray-800'}`}>
                    {task.dropOffAddress || 'Almacén Central GMC'}
                </p>

                {isPickupDone && !isDeliveryDone && (
                    <MapButtons address={task.dropOffAddress || '701 S Miami Ave, Miami, FL 33130'} />
                )}

                <div className="mt-4">
                    {!isPickupDone ? (
                         <div className="w-full bg-gray-200 text-gray-400 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2">
                            <Lock size={16}/> Pendiente de Recogida
                        </div>
                    ) : isDeliveryDone ? (
                        <div className="flex flex-col gap-2 animate-in fade-in zoom-in duration-300">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-bold w-full justify-center border border-green-200">
                                <CheckCircle size={14}/> Entrega Finalizada
                            </div>
                             {task.photoDeliveryUrl && (
                                <div className="mt-2 relative w-full h-32 rounded-lg overflow-hidden border border-green-200 shadow-sm group bg-gray-100">
                                    <img 
                                        src={task.photoDeliveryUrl} 
                                        alt="Evidencia Entrega" 
                                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <a href={task.photoDeliveryUrl} target="_blank" className="text-white text-xs font-bold flex items-center gap-1 bg-black/50 px-3 py-1 rounded-full">
                                            <ExternalLink size={14}/> Ver Grande
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link 
                            href={`/${params.locale}/dashboard-driver/entregas/${task.id}`}
                            className="block w-full bg-[#222b3c] text-white py-3.5 rounded-xl font-bold text-center shadow-lg hover:bg-black transition active:scale-95 flex items-center justify-center gap-2"
                        >
                            <PackageCheck size={20}/> INICIAR ENTREGA
                        </Link>
                    )}
                </div>
            </div>
        </div>

        {/* NOTA DEL CLIENTE */}
        <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 shadow-sm flex gap-3 items-start mt-6">
            <AlertCircle size={20} className="text-yellow-600 shrink-0 mt-0.5"/>
            <div className="flex-1">
                <h3 className="text-[10px] font-bold text-yellow-800 uppercase mb-1">Nota del Cliente</h3>
                <p className="text-gray-800 text-sm italic">"{task.description || 'Sin instrucciones adicionales.'}"</p>
            </div>
        </div>
        
        {/* INFO CONTACTO */}
        <div className="flex items-center justify-between px-2 py-4 border-t border-gray-200 mt-6">
             <div className="flex items-center gap-2 text-gray-600">
                <User size={16}/>
                <span className="text-sm font-bold">{task.user?.name}</span>
             </div>
             {task.contactPhone && (
                 <a href={`tel:${task.contactPhone}`} className="flex items-center gap-1 text-green-700 bg-green-100 hover:bg-green-200 transition px-4 py-2 rounded-full text-xs font-bold shadow-sm">
                    <Phone size={14}/> Llamar
                 </a>
             )}
        </div>

      </div>
    </div>
  );
}