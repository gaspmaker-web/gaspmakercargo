import React from 'react';
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { redirect } from 'next/navigation';
import Link from 'next/link'; 
import { revalidatePath } from 'next/cache'; 
import { Archive, Trash2, CheckCircle2, Search, Clock, Mailbox, FileText, PackagePlus, AlertTriangle, MapPin, UserCheck } from 'lucide-react';
import ReassignEnvelopeModal from './ReassignEnvelopeModal';

// 🔥 IMPORTAMOS TUS BOTONES ORIGINALES (Los que llaman a tu API real) 🔥
import ShredConfirmButton from './ShredConfirmButton';
import CargoConfirmButton from './CargoConfirmButton';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ============================================================================
// 🔥 SERVER ACTIONS 
// (Solo dejamos la de Purgar, porque es una tarea exclusiva de Admin sin cobro)
// ============================================================================

async function actionPurgar(id: string) {
    "use server";
    await prisma.mailItem.update({ where: { id }, data: { status: 'SHREDDED' } });
    revalidatePath('/', 'layout');
}

// ============================================================================
// COMPONENTE PRINCIPAL DE LA PÁGINA
// ============================================================================

interface Props {
  params: { locale: string };
}

export default async function InventarioBuzonesPage({ params: { locale } }: Props) {
  const session = await auth();
  if (!session?.user?.role || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
    redirect(`/${locale}/login-admin`);
  }

  // Traemos TODOS los sobres
  const allMailRaw = await prisma.mailItem.findMany({
    include: { user: { include: { mailboxSubscription: true } } },
    orderBy: { updatedAt: 'desc' }
  });

  // EL CEREBRO DE LA PURGA
  const now = new Date();
  const allMail = allMailRaw.map(item => {
      const sub = item.user?.mailboxSubscription;
      const isPremium = sub?.planType === 'PREMIUM_1499' || sub?.planType === 'Premium Cargo' || sub?.planType === 'PREMIUM';
      const maxDays = isPremium ? 60 : 30; 
      
      const diffInMs = now.getTime() - new Date(item.receivedAt).getTime();
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
      
      const isExpired = diffInDays >= maxDays && (item.status === 'UNREAD' || item.status === 'SCANNED_READY');
      return { ...item, isExpired, maxDays, diffInDays };
  });

  // Estadísticas
  const totalShredRequests = allMail.filter(m => m.status === 'SHRED_REQUESTED').length;
  const totalScanRequests = allMail.filter(m => m.status === 'SCAN_REQUESTED').length;
  const totalExpired = allMail.filter(m => m.isExpired).length; 

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* ENCABEZADO Y KPIS */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div className="flex items-center gap-3">
                <div className="bg-slate-900 p-3 rounded-xl shadow-md">
                    <Archive className="text-gmc-dorado-principal" size={28} />
                </div>
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight uppercase">Archivo Maestro</h1>
                    <p className="text-gray-500 font-medium">Control global y registro histórico de correspondencia.</p>
                </div>
            </div>

            <div className="flex flex-wrap gap-3">
                <div className="bg-orange-50 border border-orange-200 px-4 py-2 rounded-xl flex items-center gap-3 shadow-sm">
                    <AlertTriangle className="text-orange-500" size={20} />
                    <div>
                        <p className="text-[10px] text-orange-600 font-bold uppercase tracking-wider">Caducados</p>
                        <p className="text-lg font-black text-orange-700 leading-none">{totalExpired}</p>
                    </div>
                </div>
                <div className="bg-red-50 border border-red-200 px-4 py-2 rounded-xl flex items-center gap-3 shadow-sm">
                    <Trash2 className="text-red-500" size={20} />
                    <div>
                        <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider">Por Triturar</p>
                        <p className="text-lg font-black text-red-700 leading-none">{totalShredRequests}</p>
                    </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 px-4 py-2 rounded-xl flex items-center gap-3 shadow-sm">
                    <Search className="text-blue-500" size={20} />
                    <div>
                        <p className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">Por Escanear</p>
                        <p className="text-lg font-black text-blue-700 leading-none">{totalScanRequests}</p>
                    </div>
                </div>
            </div>
        </div>

        {/* TABLA MAESTRA */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase tracking-wider text-[11px] font-bold">
                        <tr>
                            <th className="px-6 py-4">Sobre / Remitente</th>
                            <th className="px-6 py-4">Cliente (Suite)</th>
                            <th className="px-6 py-4">Fecha Ingreso</th>
                            <th className="px-6 py-4">Estado Físico</th>
                            <th className="px-6 py-4 text-right">Acción / Historial Digital</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
                        {allMail.map((item) => (
                            <tr key={item.id} className={`transition-colors ${item.isExpired ? 'bg-red-50/50' : 'hover:bg-gray-50'}`}>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                       <ReassignEnvelopeModal 
                                         mailItemId={item.id}
                                         imageUrl={item.envelopeImageUrl}
                                         isExpired={item.isExpired}
                                         currentName={item.user?.name || 'Desconocido'}
                                         currentSuite={item.user?.suiteNo || ''}
                                     />
                                       <div>
                                            <p className="font-bold text-gray-900">{item.senderName || 'Desconocido'}</p>
                                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                {item.trackingNumber && (
                                                    <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-widest text-slate-700 bg-slate-200 px-1.5 py-0.5 rounded">
                                                        Ref: {item.trackingNumber}
                                                    </span>
                                                )}
                                                {item.weightOz !== null && (
                                                    <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                                                        {item.weightOz} oz
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="font-bold text-gray-900">{item.user?.name}</p>
                                    <span className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded font-bold">
                                        Suite #{item.user?.suiteNo}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-gray-500">
                                    <div className="flex flex-col">
                                        <span>{new Date(item.receivedAt).toLocaleDateString()}</span>
                                        <span className={`text-[10px] uppercase font-bold tracking-wider mt-0.5 ${item.isExpired ? 'text-red-600' : 'text-gray-400'}`}>
                                            {item.diffInDays} días almacenado
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-1.5">
                                        {/* Etiquetas Visuales Originales */}
                                        {item.status === 'UNREAD' && <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 w-max"><Mailbox size={12}/> En Suite</span>}
                                        {item.status === 'SCAN_REQUESTED' && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 w-max"><Search size={12}/> Requiere Escaneo</span>}
                                        {item.status === 'SCANNED_READY' && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 w-max"><CheckCircle2 size={12}/> Guardado (Leído)</span>}
                                        {item.status === 'SHRED_REQUESTED' && <span className="text-[10px] bg-red-100 text-red-700 px-2 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 w-max animate-pulse"><Trash2 size={12}/> Requiere Triturar</span>}
                                        {item.status === 'SHREDDED' && <span className="text-[10px] bg-slate-800 text-white px-2 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 w-max"><Archive size={12}/> Destruido</span>}
                                        {item.status === 'CARGO_REQUESTED' && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 w-max animate-pulse"><PackagePlus size={12}/> Requiere Carga</span>}
                                        {item.status === 'MOVED_TO_CARGO' && <span className="text-[10px] bg-purple-800 text-white px-2 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 w-max"><PackagePlus size={12}/> En Paquetes</span>}
                                        {item.isExpired && <span className="text-[10px] bg-red-600 text-white px-2 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 w-max animate-pulse shadow-sm"><AlertTriangle size={12}/> VENCIDO</span>}
                                        
                                        {/* 🔥 NUEVAS ETIQUETAS DE PICKUP */}
                                        {item.status === 'PICKUP_SCHEDULED' && <span className="text-[10px] bg-orange-100 text-orange-800 px-2 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 w-max"><MapPin size={12}/> Cita Programada</span>}
                                        {item.status === 'DELIVERED_PHYSICAL' && <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 w-max"><UserCheck size={12}/> Entregado Físico</span>}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex flex-col items-end gap-2">
                                        
                                        {/* 🔴 PURGAR: Acción de Admin */}
                                        {item.isExpired && (
                                            <form action={actionPurgar.bind(null, item.id)}>
                                                <button type="submit" className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-[11px] uppercase tracking-wider font-bold transition-all shadow-md active:scale-95">
                                                    <Trash2 size={14} /> Purgar (Admin)
                                                </button>
                                            </form>
                                        )}

                                        {/* 🔴 TRITURAR: Componente conectado a tu API */}
                                        {item.status === 'SHRED_REQUESTED' && (
                                            <ShredConfirmButton mailItemId={item.id} />
                                        )}

                                        {/* 🟣 MOVER A CARGA: Componente conectado a tu API */}
                                        {item.status === 'CARGO_REQUESTED' && (
                                            <CargoConfirmButton mailItemId={item.id} />
                                        )}
                                        
                                        {/* 🔵 ESCANEAR */}
                                        {item.status === 'SCAN_REQUESTED' && (
                                            <Link 
                                                href={`/${locale}/dashboard-admin/solicitudes-escaneo`}
                                                className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-[11px] uppercase tracking-wider font-bold transition-all shadow-sm active:scale-95"
                                            >
                                                <Search size={14} /> Ir a Escanear
                                            </Link>
                                        )}

                                        {/* HISTORIAL DIGITAL */}
                                        {item.scannedDocUrl && (
                                            <a 
                                                href={item.scannedDocUrl} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg text-[11px] uppercase tracking-wider font-bold transition-all shadow-sm"
                                            >
                                                <FileText size={14} /> Ver PDF Guardado
                                            </a>
                                        )}

                                        {/* 🔥 NUEVO: Lógica actualizada de textos neutros */}
                                        {item.status !== 'SHRED_REQUESTED' && item.status !== 'SCAN_REQUESTED' && item.status !== 'CARGO_REQUESTED' && !item.scannedDocUrl && !item.isExpired && (
                                            <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
                                                {item.status === 'SHREDDED' ? 'Destruido sin leer' : 
                                                 item.status === 'MOVED_TO_CARGO' ? 'Movido a Paquetes' : 
                                                 item.status === 'PICKUP_SCHEDULED' ? 'En espera de cliente' :
                                                 item.status === 'DELIVERED_PHYSICAL' ? 'Entregado al cliente' :
                                                 'Físico en bodega'}
                                            </span>
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
    </div>
  );
}