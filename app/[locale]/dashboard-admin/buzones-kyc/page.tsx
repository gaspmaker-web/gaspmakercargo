import React from 'react';
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ShieldAlert, CheckCircle, XCircle, ExternalLink, Mailbox, Search, ArrowLeft, AlertCircle, Users, Clock, History } from 'lucide-react';
import KycActionButtons from './KycActionButtons';

interface Props {
  params: { locale: string };
}

export default async function BuzonesKycAdminPage({ params: { locale } }: Props) {
  const session = await auth();
  
  if (!session?.user?.role || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
    redirect(`/${locale}/dashboard-cliente`);
  }

  // Traemos TODO el historial de clientes y sus adicionales que han subido documentos.
  const allSubscriptions = await prisma.mailboxSubscription.findMany({
    where: { 
        // 🔥 SOLUCIÓN: Mostramos a los que ya pagaron, sin importar si ya subieron el PDF o no.
        // Ocultamos los "PENDING_PAYMENT" porque son los que cerraron la ventana sin pagar.
        status: { in: ['PENDING_USPS', 'ACTIVE', 'REJECTED'] } 
    },
    include: { 
        user: { select: { id: true, name: true, email: true, suiteNo: true } },
        additionalRecipients: true
    },
    orderBy: { updatedAt: 'desc' } 
  });

  // 🔥 SOLUCIÓN: Calculamos titulares Y adicionales pendientes para que coincida con el Sidebar
  const pendingTitulares = allSubscriptions.filter(s => s.status === 'PENDING_USPS').length;
  const pendingAdicionales = allSubscriptions.reduce((acc, sub) => acc + sub.additionalRecipients.filter(r => r.status === 'PENDING_USPS').length, 0);
  const totalPending = pendingTitulares + pendingAdicionales;

  // Calculamos también el total de activos sumando ambos grupos
  const activeTitulares = allSubscriptions.filter(s => s.status === 'ACTIVE').length;
  const activeAdicionales = allSubscriptions.reduce((acc, sub) => acc + sub.additionalRecipients.filter(r => r.status === 'ACTIVE').length, 0);
  const totalActive = activeTitulares + activeAdicionales;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ENCABEZADO Y KPIS */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
           <div className="flex items-center gap-4">
               <Link href={`/${locale}/dashboard-admin`} className="p-2 bg-white rounded-full border border-gray-200 hover:bg-gray-100 transition-colors shadow-sm">
                 <ArrowLeft size={20} className="text-gray-600" />
               </Link>
               <div>
                 <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
                   <ShieldAlert className="text-red-500" size={32} /> Bóveda Legal & KYC
                 </h1>
                 <p className="text-gray-500 mt-1">Historial completo y revisión de solicitudes de Buzón Virtual (Forma 1583).</p>
               </div>
           </div>

           {/* CONTADORES RÁPIDOS */}
           <div className="flex gap-3">
                <div className="bg-orange-50 border border-orange-200 px-4 py-2 rounded-xl flex items-center gap-3 shadow-sm">
                    <Clock className="text-orange-500" size={20} />
                    <div>
                        <p className="text-[10px] text-orange-600 font-bold uppercase tracking-wider">Pendientes</p>
                        {/* 🔥 Ahora muestra el TOTAL real de trabajo pendiente */}
                        <p className="text-lg font-black text-orange-700 leading-none">{totalPending}</p>
                    </div>
                </div>
                <div className="bg-green-50 border border-green-200 px-4 py-2 rounded-xl flex items-center gap-3 shadow-sm">
                    <CheckCircle className="text-green-500" size={20} />
                    <div>
                        <p className="text-[10px] text-green-600 font-bold uppercase tracking-wider">Aprobados</p>
                        <p className="text-lg font-black text-green-700 leading-none">{totalActive}</p>
                    </div>
                </div>
            </div>
        </div>

        {/* TABLA PRINCIPAL (HISTORIAL COMPLETO) */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <h2 className="font-bold text-gray-800 flex items-center gap-2"><History size={18} className="text-blue-500"/> Registro Histórico de Documentos</h2>
                <div className="relative hidden sm:block">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="Buscar cliente..." className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500" disabled />
                </div>
            </div>

            {allSubscriptions.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center">
                    <Mailbox size={48} className="text-gray-300 mb-4" />
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Bóveda Vacía</h3>
                    <p className="text-gray-500">Aún no hay documentos KYC registrados en el historial.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                                <th className="p-4 font-bold">Cliente / Usuario</th>
                                <th className="p-4 font-bold">Estado Legal</th>
                                <th className="p-4 font-bold">Documentos (Auditoría)</th>
                                <th className="p-4 font-bold text-right">Acción / Resolución</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {allSubscriptions.map((sub) => (
                                <React.Fragment key={sub.id}>
                                    
                                    {/* 🔴 FILA: TITULAR PRINCIPAL */}
                                    <tr className={sub.status === 'ACTIVE' ? "bg-green-50/10" : "hover:bg-gray-50 transition-colors"}>
                                        <td className="p-4">
                                            <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider mb-1 inline-block ${sub.status === 'ACTIVE' ? 'bg-green-600 text-white' : 'bg-gray-900 text-white'}`}>
                                                Titular
                                            </span>
                                            <p className="font-bold text-gray-900">{sub.user.name}</p>
                                            <p className="text-xs text-gray-500">{sub.user.email}</p>
                                            {sub.user.suiteNo && (
                                                <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded font-bold uppercase mt-1 inline-block">
                                                    Suite #{sub.user.suiteNo}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            {/* Indicadores Dinámicos de Estado */}
                                            {sub.status === 'PENDING_USPS' && <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 w-max animate-pulse"><Clock size={12}/> Revisión Pendiente</span>}
                                            {sub.status === 'ACTIVE' && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 w-max"><CheckCircle size={12}/> Aprobado / Activo</span>}
                                            {sub.status === 'REJECTED' && <span className="text-[10px] bg-red-100 text-red-700 px-2 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 w-max"><XCircle size={12}/> Rechazado</span>}
                                        </td>
                                        
                                        <td className="p-4">
                                            <div className="flex gap-2">
                                                {sub.uspsForm1583Url ? (
                                                    <a href={sub.uspsForm1583Url} target="_blank" rel="noopener noreferrer" className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-100 hover:bg-blue-600 hover:text-white transition flex items-center gap-1 font-semibold">
                                                        F1583 <ExternalLink size={12}/>
                                                    </a>
                                                ) : (
                                                    <span className="text-xs bg-gray-100 text-gray-400 px-3 py-1.5 rounded-lg border border-gray-200 flex items-center gap-1 font-semibold cursor-not-allowed">
                                                        F1583 <AlertCircle size={12}/>
                                                    </span>
                                                )}

                                                {sub.primaryIdUrl ? (
                                                    <a href={sub.primaryIdUrl} target="_blank" rel="noopener noreferrer" className="text-xs bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-600 hover:text-white transition flex items-center gap-1 font-semibold">
                                                        ID 1 <ExternalLink size={12}/>
                                                    </a>
                                                ) : (
                                                    <span className="text-xs bg-gray-100 text-gray-400 px-3 py-1.5 rounded-lg border border-gray-200 flex items-center gap-1 font-semibold cursor-not-allowed">
                                                        ID 1 <AlertCircle size={12}/>
                                                    </span>
                                                )}

                                                {sub.secondaryIdUrl ? (
                                                    <a href={sub.secondaryIdUrl} target="_blank" rel="noopener noreferrer" className="text-xs bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-600 hover:text-white transition flex items-center gap-1 font-semibold">
                                                        ID 2 <ExternalLink size={12}/>
                                                    </a>
                                                ) : (
                                                    <span className="text-xs bg-gray-100 text-gray-400 px-3 py-1.5 rounded-lg border border-gray-200 flex items-center gap-1 font-semibold cursor-not-allowed">
                                                        ID 2 <AlertCircle size={12}/>
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        <td className="p-4 text-right">
                                            {sub.status === 'PENDING_USPS' ? (
                                                <KycActionButtons 
                                                    subscriptionId={sub.id} 
                                                    userId={sub.user.id} 
                                                    isPrimary={true} 
                                                    currentSuite={sub.user.suiteNo} 
                                                />
                                            ) : (
                                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                                    Resuelto el {new Date(sub.updatedAt).toLocaleDateString()}
                                                </span>
                                            )}
                                        </td>
                                    </tr>

                                    {/* 🔵 FILAS: PERSONAS ADICIONALES (Muestra todo el historial de adicionales) */}
                                    {sub.additionalRecipients.map((rec) => (
                                        <tr key={rec.id} className="bg-blue-50/10 hover:bg-blue-50/30 transition-colors">
                                            <td className="p-4 pl-8 border-l-4 border-blue-400">
                                                <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider mb-1 inline-flex items-center gap-1"><Users size={10}/> Adicional</span>
                                                <p className="font-bold text-gray-900">{rec.fullName}</p>
                                                <p className="text-xs text-gray-500">Buzón de: {sub.user.name}</p>
                                            </td>
                                            <td className="p-4">
                                                {rec.status === 'PENDING_USPS' && <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 w-max animate-pulse"><Clock size={12}/> Revisión Pendiente</span>}
                                                {rec.status === 'ACTIVE' && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 w-max"><CheckCircle size={12}/> Aprobado</span>}
                                                {rec.status === 'REJECTED' && <span className="text-[10px] bg-red-100 text-red-700 px-2 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 w-max"><XCircle size={12}/> Rechazado</span>}
                                            </td>
                                            
                                            <td className="p-4">
                                                <div className="flex gap-2">
                                                    {rec.uspsForm1583Url ? (
                                                        <a href={rec.uspsForm1583Url} target="_blank" rel="noopener noreferrer" className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-100 hover:bg-blue-600 hover:text-white transition flex items-center gap-1 font-semibold">
                                                            F1583 <ExternalLink size={12}/>
                                                        </a>
                                                    ) : (
                                                        <span className="text-xs bg-gray-100 text-gray-400 px-3 py-1.5 rounded-lg border border-gray-200 flex items-center gap-1 font-semibold cursor-not-allowed">
                                                            F1583 <AlertCircle size={12}/>
                                                        </span>
                                                    )}

                                                    {rec.primaryIdUrl ? (
                                                        <a href={rec.primaryIdUrl} target="_blank" rel="noopener noreferrer" className="text-xs bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-600 hover:text-white transition flex items-center gap-1 font-semibold">
                                                            ID 1 <ExternalLink size={12}/>
                                                        </a>
                                                    ) : (
                                                        <span className="text-xs bg-gray-100 text-gray-400 px-3 py-1.5 rounded-lg border border-gray-200 flex items-center gap-1 font-semibold cursor-not-allowed">
                                                            ID 1 <AlertCircle size={12}/>
                                                        </span>
                                                    )}

                                                    {rec.secondaryIdUrl ? (
                                                        <a href={rec.secondaryIdUrl} target="_blank" rel="noopener noreferrer" className="text-xs bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-600 hover:text-white transition flex items-center gap-1 font-semibold">
                                                            ID 2 <ExternalLink size={12}/>
                                                        </a>
                                                    ) : (
                                                        <span className="text-xs bg-gray-100 text-gray-400 px-3 py-1.5 rounded-lg border border-gray-200 flex items-center gap-1 font-semibold cursor-not-allowed">
                                                            ID 2 <AlertCircle size={12}/>
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="p-4 text-right">
                                                {rec.status === 'PENDING_USPS' ? (
                                                    <KycActionButtons 
                                                        subscriptionId={sub.id} 
                                                        userId={sub.user.id} 
                                                        isPrimary={false} 
                                                        recipientId={rec.id}
                                                        currentSuite={sub.user.suiteNo} 
                                                    />
                                                ) : (
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                                        Resuelto el {new Date(rec.updatedAt).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}

                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>

      </div>
    </div>
  );
}