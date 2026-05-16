import { auth } from '@/auth'; 
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  Truck, MapPin, Package, Globe, ArrowRight, 
  User, ShieldAlert, Briefcase, Clock, Calendar, Box,
  Layers
} from 'lucide-react';

import AcceptTaskButton from '@/components/driver/AcceptTaskButton'; 
import DriverLogoutButton from '@/components/DriverLogoutButton'; 

export const dynamic = 'force-dynamic';

export default async function DriverDashboardPage(props: any) {
  const session = await auth();
  const params = await props.params;
  const locale = params?.locale || 'en';

  const userRole = session?.user?.role?.trim()?.toUpperCase();

  if (!session || userRole !== 'DRIVER') {
    redirect(`/${locale}/login-cliente`);
  }

  const driverId = session.user.id;

  const driver = await prisma.user.findUnique({
    where: { id: driverId },
    select: { countryCode: true, country: true, name: true }
  });

  const driverZone = driver?.countryCode; 

  if (!driverZone) {
    return (
        <div className="min-h-screen bg-slate-900 text-white p-6 flex flex-col items-center justify-center text-center">
            <ShieldAlert size={64} className="text-red-500 mb-4"/>
            <h1 className="text-2xl font-bold">Zona No Asignada</h1>
            <p className="text-slate-400">Tu usuario no tiene un código de país (Ej: US) asignado.</p>
            <div className="mt-6">
                <DriverLogoutButton locale={locale} />
            </div>
        </div>
    );
  }

  const isMiamiDriver = driverZone === 'US';

  // =================================================================================
  // 🧠 SMART FLOW LOGIC
  // =================================================================================

  // 1. OPORTUNIDADES DISPONIBLES (Pickups)
  let availableTasks: any[] = [];
  if (isMiamiDriver) {
      availableTasks = await prisma.pickupRequest.findMany({
        where: { 
            status: { in: ['PENDIENTE', 'PAGADO'] }, 
            driverId: null,
            serviceType: { notIn: ['STORAGE', 'STORAGE_FEE'] }
        },
        orderBy: { pickupDate: 'asc' }, 
        include: { user: { select: { name: true } } }
      });
  }

  // 2. MIS TAREAS ACTIVAS (Pickups)
  const myPickupTasks = await prisma.pickupRequest.findMany({
    where: { 
        driverId: driverId,
        status: { in: ['ACEPTADO', 'EN_CAMINO', 'EN_REPARTO', 'EN_RUTA'] },
        serviceType: { notIn: ['STORAGE', 'STORAGE_FEE'] }
    },
    orderBy: { pickupDate: 'asc' } 
  });

// =================================================================================
  // 🔥 ENRUTADOR DINÁMICO UNIVERSAL (Arregla US, TT, BB, etc.)
  // =================================================================================
  
  // 1️⃣ Reglas para PAQUETES SUELTOS (No tienen destinationCountryCode en Prisma)
  const packageOrConditions: any[] = [
      { shippingAddress: { contains: driverZone, mode: 'insensitive' } },
      { user: { countryCode: driverZone } }
  ];

  // 🚀 REGLAS DE COURIER SERVICE (La llave maestra según la zona del chofer)
  if (driverZone === 'US') {
      packageOrConditions.push({ courierService: { contains: 'Local Delivery', mode: 'insensitive' } });
  } else if (driverZone === 'TT') {
      packageOrConditions.push({ courierService: { contains: 'Trinidad', mode: 'insensitive' } });
  } else if (driverZone === 'BB') {
      packageOrConditions.push({ courierService: { contains: 'Barbados', mode: 'insensitive' } });
  } else if (driverZone === 'JM') {
      packageOrConditions.push({ courierService: { contains: 'Jamaica', mode: 'insensitive' } });
  }

  // 2️⃣ Reglas para CONSOLIDADOS (Le sumamos destinationCountryCode porque Prisma sí lo tiene aquí)
  const consolidationOrConditions: any[] = [
      ...packageOrConditions,
      { destinationCountryCode: driverZone }
  ];

  // 🔥 3. BUSCAR CONSOLIDACIONES (Acepta SHIPPING_INTL, CONSOLIDATION y LOCAL_DELIVERY)
  const activeConsolidations = await prisma.consolidatedShipment.findMany({
      where: {
          status: { in: ['EN_REPARTO', 'OUT_FOR_DELIVERY', 'EN_CAMINO', 'EN_RUTA'] },
          serviceType: { in: ['CONSOLIDATION', 'LOCAL_DELIVERY', 'SHIPPING_INTL'] },
          OR: consolidationOrConditions, // <--- Usamos la lista de Consolidados
          NOT: {
              OR: [
                  { selectedCourier: { contains: 'UPS', mode: 'insensitive' } },
                  { selectedCourier: { contains: 'DHL', mode: 'insensitive' } },
                  { selectedCourier: { contains: 'FEDEX', mode: 'insensitive' } }
              ]
          }
      },
      include: {
          user: { select: { name: true, address: true, country: true, countryCode: true } },
          packages: true 
      },
      orderBy: { updatedAt: 'desc' }
  });

  // 🔥 4. BUSCAR PAQUETES SUELTOS
  const activePackages = await prisma.package.findMany({
      where: {
          status: { in: ['EN_REPARTO', 'OUT_FOR_DELIVERY', 'EN_CAMINO', 'EN_RUTA'] },
          serviceType: { in: ['SHIPPING_INTL', 'PACKAGE', 'LOCAL_DELIVERY'] },
          AND: [
              { consolidatedShipmentId: null },
              { OR: packageOrConditions } // <--- Usamos la lista de Paquetes Sueltos
          ],
          NOT: {
              OR: [
                  { selectedCourier: { contains: 'UPS', mode: 'insensitive' } },
                  { selectedCourier: { contains: 'DHL', mode: 'insensitive' } },
                  { selectedCourier: { contains: 'FEDEX', mode: 'insensitive' } }
              ]
          }
      },
      include: {
          user: { select: { name: true, address: true, country: true, countryCode: true } }
      },
      orderBy: { updatedAt: 'desc' }
  });


  // =========================================================
  // 📦 UNIFICACIÓN DE LA VISTA DEL CHOFER
  // =========================================================
  const processedDeliveries: any[] = [];

  for (const cons of activeConsolidations) {
      // Diferenciación visual en la app del chofer
      const isAuraPallet = cons.courierService?.toLowerCase().includes('local delivery');
      const isTrinidad = cons.courierService?.toLowerCase().includes('trinidad');

      processedDeliveries.push({
          id: cons.id, 
          // Si es Aura pintamos Negro, si no, es un consolidado/internacional Morado
          type: isAuraPallet ? 'LOCAL_DELIVERY' : 'CONSOLIDATION',
          tracking: cons.gmcShipmentNumber || 'Consolidación',
          userName: cons.user?.name || 'Cliente',
          // ✅ FORZAMOS MOSTRAR LA DIRECCIÓN DE ENVÍO REAL
          address: cons.shippingAddress || cons.user?.address || 'Dirección no especificada',
          count: cons.packages.length,
          weightLbs: cons.weightLbs || 0, 
          childTrackings: cons.packages.map((p: any) => p.gmcTrackingNumber).filter((t: any) => t) 
      });
  }

  for (const pkg of activePackages) {
      const isAuraPallet = pkg.courierService?.toLowerCase().includes('local delivery');
      
      processedDeliveries.push({
          id: pkg.id, 
          type: isAuraPallet ? 'LOCAL_DELIVERY' : 'PACKAGE',
          tracking: pkg.gmcTrackingNumber || pkg.carrierTrackingNumber || 'Paquete',
          userName: pkg.user?.name || 'Cliente',
          address: pkg.shippingAddress || pkg.user?.address || 'Dirección no especificada',
          count: 1,
          weightLbs: pkg.weightLbs || 0,
          childTrackings: []
      });
  }

  const totalActiveTasks = myPickupTasks.length + processedDeliveries.length;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      <div className="bg-[#222b3c] text-white p-6 rounded-b-[30px] shadow-xl mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
        <div className="relative z-10 flex justify-between items-center mb-4">
            <div>
                <h1 className="text-2xl font-bold font-garamond uppercase tracking-wide">
                    HOLA, {driver?.name?.split(' ')[0]}
                </h1>
                <p className="text-sm text-gray-400 flex items-center gap-1 mt-1 font-medium">
                    <MapPin size={14} className="text-gmc-dorado-principal"/> 
                    Zona Operativa: <span className="text-white font-bold">{driverZone}</span>
                </p>
            </div>
            
            <div className="flex items-center gap-3">
                <div className="bg-white/10 p-3 rounded-full backdrop-blur-md border border-white/5 hidden sm:block">
                    <Truck size={28} className="text-gmc-dorado-principal"/>
                </div>
                <DriverLogoutButton locale={locale} />
            </div>
        </div>
      </div>

      <div className="px-4 space-y-8">
        {isMiamiDriver && availableTasks.length > 0 && (
            <div className="animate-in slide-in-from-right-5 duration-700">
                <h2 className="text-gray-800 font-bold mb-3 flex items-center gap-2 px-1">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    Nuevas Oportunidades ({availableTasks.length})
                </h2>
                
                <div className="flex overflow-x-auto gap-4 pb-6 -mx-4 px-4 scrollbar-hide snap-x snap-mandatory">
                    {availableTasks.map((task) => (
                        <div 
                            key={task.id} 
                            className="min-w-[85%] sm:min-w-[320px] bg-white p-5 rounded-2xl shadow-sm border border-gray-100 snap-center flex flex-col justify-between relative overflow-hidden"
                        >
                            <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${task.serviceType === 'DELIVERY' ? 'bg-green-500' : 'bg-blue-500'}`}></div>

                            <div>
                                <div className="flex justify-between items-center mb-3 pl-2">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${task.serviceType === 'DELIVERY' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {task.serviceType}
                                    </span>
                                </div>
                                
                                <div className="pl-2 space-y-2 mb-4">
                                    <h3 className="font-bold text-gray-800 text-sm line-clamp-2 leading-tight">
                                        {task.originAddress}
                                    </h3>
                                    
                                    <div className="flex items-center gap-3 text-xs bg-gray-50 p-2 rounded-lg text-gray-600 border border-gray-100">
                                        <div className="flex items-center gap-1 font-bold text-gray-700">
                                            <Calendar size={12} className="text-gmc-dorado-principal"/>
                                            {task.pickupDate ? new Date(task.pickupDate).toISOString().split('T')[0] : 'Fecha Pendiente'}
                                        </div>
                                        <div className="w-px h-3 bg-gray-300"></div>
                                        <div className="flex items-center gap-1">
                                            <Clock size={12} className="text-gray-400"/>
                                            10 AM - 6 PM
                                        </div>
                                    </div>

                                    <p className="text-xs text-gray-400 flex items-center gap-1">
                                        <User size={10}/> {task.user?.name || 'Cliente'}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="pl-2">
                                <AcceptTaskButton taskId={task.id} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        <div>
            <h2 className="text-gray-800 font-bold mb-4 flex items-center gap-2 px-1">
                <Briefcase size={20} className="text-gray-600"/> 
                Mi Ruta ({totalActiveTasks})
            </h2>

            <div className="space-y-3">
                {totalActiveTasks === 0 ? (
                    <div className="bg-white p-10 rounded-2xl border-2 border-dashed border-gray-200 text-center">
                        <Truck size={40} className="mx-auto text-gray-200 mb-3"/>
                        <p className="text-gray-400 font-medium text-sm">Tu ruta está vacía.</p>
                        <p className="text-xs text-gray-400 mt-1">¡Acepta tareas del carrusel para comenzar!</p>
                    </div>
                ) : (
                    <>
                        {myPickupTasks.map((task) => (
                            <Link 
                                key={task.id}
                                href={`/${locale}/dashboard-driver/tareas/${task.id}`}
                                className="block bg-white p-4 rounded-xl shadow-sm border border-gray-100 active:scale-[0.98] transition-all hover:shadow-md relative overflow-hidden group z-0"
                            >
                                <div className="absolute top-0 bottom-0 left-0 w-1 bg-gmc-dorado-principal group-hover:w-2 transition-all"></div>
                                
                                <div className="flex justify-between items-center mb-2 pl-3">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">#{task.id.slice(0,5)}</span>
                                    <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                                        <Clock size={10}/> EN PROCESO
                                    </span>
                                </div>
                                
                                <div className="pl-3 mb-2">
                                     <div className="flex items-center gap-2 text-xs font-medium text-gray-600 mb-2">
                                        <Calendar size={12} className="text-gmc-dorado-principal"/>
                                        {task.pickupDate ? new Date(task.pickupDate).toISOString().split('T')[0] : ''}
                                    </div>
                                    <p className="font-bold text-gray-800 text-sm truncate">{task.originAddress}</p>
                                    <p className="text-xs text-gray-500 truncate">Destino: {task.dropOffAddress || 'Almacén'}</p>
                                </div>
                                
                                <div className="flex justify-end pr-2">
                                    <ArrowRight size={16} className="text-gmc-dorado-principal"/>
                                </div>
                            </Link>
                        ))}

                        {processedDeliveries.map((item) => (
                            <Link 
                                key={item.id} 
                                href={`/${locale}/dashboard-driver/entregas/${item.id}`}
                                className="block bg-white p-4 rounded-xl shadow-sm border border-gray-100 active:scale-[0.98] transition-all hover:shadow-md relative overflow-hidden group z-0"
                            >
                                <div className={`absolute top-0 bottom-0 left-0 w-1 ${item.type === 'LOCAL_DELIVERY' ? 'bg-black' : (item.type === 'CONSOLIDATION' ? 'bg-purple-600' : 'bg-blue-500')} group-hover:w-2 transition-all`}></div>
                                
                                <div className="flex justify-between items-start mb-2 pl-3">
                                    
                                    <div className="flex flex-col min-w-0 pr-2">
                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider truncate">
                                            {item.tracking}
                                        </span>
                                        
                                        {(item.type === 'CONSOLIDATION' || item.type === 'LOCAL_DELIVERY') && item.childTrackings?.length > 0 && (
                                            <div className="flex flex-col mt-1 space-y-0.5">
                                                <span className="text-[9px] text-gray-400 font-mono flex items-center gap-1">
                                                   <Layers size={10}/> Contiene {item.count} cajas
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="shrink-0 flex flex-col items-end gap-1">
                                        {item.type === 'LOCAL_DELIVERY' ? (
                                            <span className="bg-black text-white px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 border border-gray-800 shadow-sm">
                                                <Truck size={10}/> PALLET AURA
                                            </span>
                                        ) : item.type === 'CONSOLIDATION' ? (
                                            <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 border border-purple-200">
                                                <Box size={10}/> {item.count} PACKS
                                            </span>
                                        ) : (
                                            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 border border-blue-200">
                                                <Globe size={10}/> DELIVERY
                                            </span>
                                        )}

                                        {item.weightLbs > 0 && (
                                            <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 rounded">
                                                {item.weightLbs.toFixed(1)} lbs
                                            </span>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3 pl-3">
                                    <div className={`p-2 rounded-lg ${item.type === 'LOCAL_DELIVERY' ? 'bg-gray-100 text-black' : (item.type === 'CONSOLIDATION' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600')}`}>
                                        {item.type === 'LOCAL_DELIVERY' ? <Layers size={18}/> : (item.type === 'CONSOLIDATION' ? <Box size={18}/> : <Package size={18} />)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        {/* 🔥 AHORA IMPRIME EL NOMBRE Y LA DIRECCIÓN EXACTA DEL ENVÍO */}
                                        <p className="font-bold text-gray-800 text-sm truncate">{item.userName}</p>
                                        <p className="text-xs text-gray-500 truncate mt-0.5">{item.address}</p>
                                    </div>
                                    <ArrowRight size={16} className="text-gray-300"/>
                                </div>
                            </Link>
                        ))}
                    </>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}