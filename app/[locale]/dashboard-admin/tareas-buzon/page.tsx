import React from 'react';
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { redirect } from 'next/navigation';
import Link from 'next/link'; 
import { ClipboardList, Search, Trash2, PackagePlus, Clock, MapPin, Calendar, User, Mail } from 'lucide-react';

// ============================================================================
// 🔥 CAMBIO CRÍTICO 1: IMPORTAMOS EL MODAL DE REASIGNACIÓN REUTILIZABLE 🔥
// ============================================================================
import ReassignEnvelopeModal from '../inventario-buzones/ReassignEnvelopeModal';
import CargoConfirmButton from '../inventario-buzones/CargoConfirmButton';
import ShredConfirmButton from '../inventario-buzones/ShredConfirmButton';

// 🔥 NUEVO: IMPORTAMOS LOS BOTONES DE PICKUP QUE CREAMOS
import PickupActionButtons from './PickupActionButtons';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface Props {
  params: { locale: string };
}

export default async function TareasBuzonPage({ params: { locale } }: Props) {
  const session = await auth();
  if (!session?.user?.role || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
    redirect(`/${locale}/login-admin`);
  }

  // 1. TAREAS INDIVIDUALES (Escanear, Destruir, Carga)
  const pendingTasks = await prisma.mailItem.findMany({
    where: { 
        status: { in: ['SCAN_REQUESTED', 'SHRED_REQUESTED', 'CARGO_REQUESTED'] } 
    },
    include: { user: { include: { mailboxSubscription: true } } }, 
    orderBy: { updatedAt: 'asc' } 
  });

  // 2. 🔥 NUEVO: CITAS DE RECOGIDA (Pickups)
  const pendingPickups = await prisma.mailPickupRequest.findMany({
    where: { 
        status: { in: ["PENDING", "READY"] } 
    },
    include: { 
        user: true, 
        mailItems: true 
    },
    orderBy: { scheduledDate: 'asc' }
  });

  const isMesaLimpia = pendingTasks.length === 0 && pendingPickups.length === 0;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* ENCABEZADO */}
        <div className="flex items-center gap-3 mb-2">
            <div className="bg-indigo-600 p-3 rounded-xl shadow-md">
                <ClipboardList className="text-white" size={28} />
            </div>
            <div>
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight uppercase">Mesa de Tareas</h1>
                <p className="text-gray-500 font-medium">Gestión operativa del Buzón Virtual y Entregas Físicas.</p>
            </div>
        </div>

        {isMesaLimpia ? (
            <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center flex flex-col items-center shadow-sm">
                <div className="bg-green-50 text-green-600 p-4 rounded-full mb-4 shadow-sm border border-green-100">
                    <Clock size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">¡Mesa Operativa Limpia!</h3>
                <p className="text-gray-500">No hay tareas de sobres ni recogidas programadas pendientes de procesar.</p>
            </div>
        ) : (
            <>
                {/* =====================================================================
                    🔥 NUEVA SECCIÓN: ENTREGAS FÍSICAS (PICKUPS)
                    ===================================================================== */}
                {pendingPickups.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="text-lg font-black text-gray-800 uppercase tracking-wider flex items-center gap-2 border-b border-gray-200 pb-2">
                            <MapPin className="text-orange-600" size={20} /> Entregas Programadas (Mostrador)
                        </h2>
                        <div className="grid gap-4">
                            {pendingPickups.map((task) => (
                            <div key={task.id} className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border-l-4 border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:shadow-md transition-shadow" style={{ borderLeftColor: task.status === 'READY' ? '#16a34a' : '#f97316' }}>
                                
                                {/* INFO DEL CLIENTE Y CITA */}
                                <div className="flex items-start sm:items-center gap-4 min-w-[280px]">
                                    <div className="bg-blue-50 p-3 rounded-xl text-blue-600 border border-blue-100 shrink-0 hidden sm:block">
                                        <User size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg leading-tight">{task.user.name || 'Cliente'}</h3>
                                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                            <span className="text-xs font-black text-blue-800 bg-blue-100 border border-blue-200 px-2 py-0.5 rounded tracking-wider uppercase">
                                                Suite #{task.user.suiteNo}
                                            </span>
                                            <span className="flex items-center gap-1 text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                                                <Calendar size={12} /> {new Date(task.scheduledDate).toLocaleDateString()} @ {task.scheduledTime}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* DETALLE DE DOCUMENTOS */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 text-sm font-bold text-orange-700 bg-orange-50 w-max px-3 py-1.5 rounded-lg border border-orange-100">
                                        <Mail size={16} /> 
                                        <span>Preparar {task.mailItems.length} Documentos</span>
                                    </div>
                                </div>

                                {/* BOTONES DE ACCIÓN (Imprimir / Preparar / Entregar) */}
                                <PickupActionButtons 
                                    taskId={task.id} 
                                    status={task.status} 
                                    clientName={task.user.name || "Cliente Desconocido"}
                                    suiteNo={task.user.suiteNo || "----"}
                                    scheduledDate={task.scheduledDate.toISOString()}
                                    scheduledTime={task.scheduledTime}
                                    mailItems={task.mailItems.map(m => ({ 
                                        id: m.id, 
                                        ref: m.trackingNumber || m.id,
                                        senderName: m.senderName,
                                        receivedAt: m.receivedAt.toISOString()
                                    }))} 
                                />
                            </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* =====================================================================
                    SECCIÓN ORIGINAL: TAREAS INTERNAS DE SOBRES
                    ===================================================================== */}
                {pendingTasks.length > 0 && (
                    <div className="space-y-4 pt-4">
                        <h2 className="text-lg font-black text-gray-800 uppercase tracking-wider flex items-center gap-2 border-b border-gray-200 pb-2">
                            <ClipboardList className="text-indigo-600" size={20} /> Tareas Internas de Sobres
                        </h2>
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase tracking-wider text-[11px] font-bold">
                                        <tr>
                                            <th className="px-6 py-4">Foto del Sobre</th>
                                            <th className="px-6 py-4">Cliente / Suite</th>
                                            <th className="px-6 py-4">Tarea Solicitada</th>
                                            <th className="px-6 py-4 text-right">Ejecutar Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
                                        {pendingTasks.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                                
                                                {/* FOTO CON MODAL REUTILIZABLE */}
                                               <td className="px-6 py-4">
                                                 <div className="flex items-center gap-3">
                                                 <div className="w-12 h-12 shrink-0 rounded-lg shadow-sm border border-gray-200 overflow-hidden relative">
                                                 <div className="absolute inset-0 [&>button]:w-full [&>button]:h-full [&>button>img]:object-cover [&>button>img]:w-full [&>button>img]:h-full">
                                                      <ReassignEnvelopeModal 
                                                      mailItemId={item.id}
                                                     imageUrl={item.envelopeImageUrl}
                                                     isExpired={false} 
                                                     currentName={item.user?.name || 'Desconocido'}
                                                      currentSuite={item.user?.suiteNo || ''}
                                                       />
                                                </div>
                                                </div>
                                                    <div className="flex flex-col items-start">
                                                            <span className="font-bold text-gray-900">{item.senderName || 'Remitente Desconocido'}</span>
                                                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                                {item.trackingNumber && (
                                                                    <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-widest text-slate-700 bg-slate-200 px-1.5 py-0.5 rounded">
                                                                        Ref: {item.trackingNumber}
                                                                    </span>
                                                                )}
                                                                <span className="text-[10px] text-gray-400">
                                                                    {new Date(item.updatedAt).toLocaleString()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* CLIENTE Y SUITE */}
                                                <td className="px-6 py-4">
                                                    <p className="font-bold text-gray-900">{item.user?.name}</p>
                                                    <span className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded font-bold uppercase tracking-wider mt-1 inline-block">
                                                        Suite #{item.user?.suiteNo}
                                                    </span>
                                                </td>

                                                {/* ETIQUETA DE TAREA */}
                                                <td className="px-6 py-4">
                                                    {item.status === 'SCAN_REQUESTED' && <span className="text-[11px] bg-blue-100 text-blue-800 border border-blue-200 px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider flex items-center gap-1.5 w-max"><Search size={14}/> Escanear Contenido</span>}
                                                    {item.status === 'SHRED_REQUESTED' && <span className="text-[11px] bg-red-100 text-red-800 border border-red-200 px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider flex items-center gap-1.5 w-max animate-pulse"><Trash2 size={14}/> Destruir Sobre</span>}
                                                    {item.status === 'CARGO_REQUESTED' && <span className="text-[11px] bg-indigo-100 text-indigo-800 border border-indigo-200 px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider flex items-center gap-1.5 w-max animate-pulse"><PackagePlus size={14}/> Mover a Carga</span>}
                                                </td>

                                                {/* BOTONES DE ACCIÓN */}
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end">
                                                        {item.status === 'SHRED_REQUESTED' && <ShredConfirmButton mailItemId={item.id} />}
                                                        {item.status === 'CARGO_REQUESTED' && <CargoConfirmButton mailItemId={item.id} />}
                                                        {item.status === 'SCAN_REQUESTED' && (
                                                            <Link 
                                                                href={`/${locale}/dashboard-admin/solicitudes-escaneo`}
                                                                className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-[11px] uppercase tracking-wider font-bold transition-all shadow-sm active:scale-95"
                                                            >
                                                                <Search size={14} /> Ir a Escanear
                                                            </Link>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </>
        )}
      </div>
    </div>
  );
}