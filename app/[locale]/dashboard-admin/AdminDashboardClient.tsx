'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react'; 
import { 
  Package, Users, Truck, MapPin, PlusCircle, Layers, 
  Activity, DollarSign, ClipboardList, Car, Loader2, TrendingUp, Container, Store, ShieldAlert, Mailbox, FileSearch, Archive, ShoppingBag, Gift, ShoppingCart, ChevronDown, UserPlus
} from 'lucide-react';

export default function AdminDashboardClient({ locale }: { locale: string }) {
  const [activities, setActivities] = useState<any[]>([]);
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [activityExpanded, setActivityExpanded] = useState(false);
  
  const [stats, setStats] = useState({
    usuarios: 0,
    paquetes: 0,
    consolidaciones: 0,
    pickups: 0,
    entregasHoy: 0,
    paquetesEntregadosHoy: 0,
    nuevosClientes: 0,
    ventas: 0,
    kycPendientes: 0,
    tareasBuzon: 0, 
    comprasPendientes: 0,
    // 🔥 Añadido para que el componente sepa que existe
    facturasClientes: 0 
  });

useEffect(() => {
    fetch('/api/admin/stats')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStats(data.stats);
        }
      })
      .catch(err => console.error("Error cargando stats:", err))
      .finally(() => setLoading(false));

    // Cargar actividad reciente
    fetch('/api/admin/activity')
      .then(res => res.json())
      .then(data => setActivities(data.activities || []));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 font-montserrat">
        <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin text-gmc-gris-oscuro mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Loading panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-montserrat pb-20">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* ENCABEZADO */}
        <div className="flex justify-between items-end border-b pb-4 border-gray-200">
          <div>
           <h1 className="text-3xl font-bold text-gmc-gris-oscuro tracking-tight uppercase">
             Operations Control Panel
           </h1>
           <p className="text-gray-500 mt-1 text-sm font-medium">
            Welcome, <span className="font-bold text-gmc-dorado-principal uppercase">{session?.user?.name || 'Admin'}</span>. 
            Role: <span className="text-[10px] bg-gmc-gris-oscuro text-white px-2 py-0.5 rounded uppercase ml-1 tracking-wider">{(session?.user as any)?.role || '...'}</span>
         </p>
          </div>
          <div className="text-right">
             <p className="text-xs font-bold text-gray-400 uppercase tracking-widest lining-nums hidden sm:block">
                {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
             </p>
          </div>
        </div>

        {/* 1. SECCIÓN DE ESTADÍSTICAS (KPIs) */}
      <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] md:grid md:grid-cols-2 lg:grid-cols-5 md:overflow-visible">
          
  <Link href={`/${locale}/dashboard-admin/paquetes`} className="block group shrink-0 w-[70vw] snap-center md:w-auto">
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center h-full">
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Active Packages</p>
        <h3 className="text-4xl font-extrabold text-gmc-gris-oscuro tracking-tight font-montserrat lining-nums group-hover:text-blue-600 transition-colors">
            {stats.paquetes}
        </h3>
      </div>
      <div className="p-3 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
        <Package size={24} strokeWidth={2.5} />
      </div>
    </div>
  </Link>

  <Link href={`/${locale}/dashboard-admin/solicitudes-pickup?filter=entregados`} className="block group shrink-0 w-[70vw] snap-center md:w-auto">
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center h-full">
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Local Deliveries</p>
        <h3 className="text-4xl font-extrabold text-gmc-gris-oscuro tracking-tight font-montserrat lining-nums group-hover:text-green-600 transition-colors">
            {stats.entregasHoy || 0}
        </h3> 
      </div>
      <div className="p-3 bg-green-50 text-green-600 rounded-lg">
        <Truck size={24} strokeWidth={2.5} />
      </div>
    </div>
  </Link>

  <Link href={`/${locale}/dashboard-admin/paquetes?filter=entregados`} className="block group shrink-0 w-[70vw] snap-center md:w-auto">
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center h-full">
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Intl. Deliveries</p>
        <h3 className="text-4xl font-extrabold text-gmc-gris-oscuro tracking-tight font-montserrat lining-nums group-hover:text-blue-600 transition-colors">
            {stats.paquetesEntregadosHoy || 0}
        </h3> 
      </div>
      <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
        <Truck size={24} strokeWidth={2.5} />
      </div>
    </div>
  </Link>

  <Link href={`/${locale}/dashboard-admin/clientes`} className="block group shrink-0 w-[70vw] snap-center md:w-auto">
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center h-full">
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">New Clients</p>
        <h3 className="text-4xl font-extrabold text-gmc-gris-oscuro tracking-tight font-montserrat lining-nums group-hover:text-purple-600 transition-colors">
            {stats.usuarios}
        </h3>
      </div>
      <div className="p-3 bg-purple-50 text-purple-600 rounded-lg group-hover:bg-purple-100 transition-colors">
        <Users size={24} strokeWidth={2.5} />
      </div>
    </div>
  </Link>

  <Link href={`/${locale}/dashboard-admin/finanzas`} className="block group shrink-0 w-[70vw] snap-center md:w-auto">
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center h-full">
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Sales (Week)</p>
        <h3 className="text-4xl font-extrabold text-gmc-gris-oscuro tracking-tight font-montserrat lining-nums group-hover:text-yellow-600 transition-colors">
            ${(stats.ventas || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </h3>
      </div>
      <div className="p-3 bg-yellow-50 text-yellow-600 rounded-lg group-hover:bg-yellow-100 transition-colors">
        <DollarSign size={24} strokeWidth={2.5} />
      </div>
    </div>
  </Link>
</div>

<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* 2. ACCIONES DISPONIBLES */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-lg font-bold text-gmc-gris-oscuro flex items-center gap-2 uppercase tracking-wide">
              <Activity size={20} className="text-gmc-dorado-principal" /> Quick Actions
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
              
              <Link href={`/${locale}/dashboard-admin/pay-and-go`} 
                className="group bg-slate-900 p-5 rounded-xl border border-slate-700 hover:border-gmc-dorado-principal hover:shadow-[0_0_15px_rgba(234,216,177,0.3)] transition-all cursor-pointer block relative md:col-span-2 overflow-hidden">
                <div className="absolute -right-10 -top-10 opacity-10 text-white">
                  <Store size={150} />
                </div>
                <div className="flex items-start justify-between relative z-10">
                  <div>
                    <h3 className="text-xl font-black text-white group-hover:text-gmc-dorado-principal transition-colors tracking-wide">Drop & Go (Counter)</h3>
                    <p className="text-sm text-gray-300 mt-1 font-medium">Quick reception, quoting and billing for walk-in clients.</p>
                  </div>
                  <div className="bg-white/10 p-3 rounded-lg text-gmc-dorado-principal backdrop-blur-sm">
                    <Store size={28} strokeWidth={2} />
                  </div>
                </div>
              </Link>

              {/* 🔥 NUEVA TARJETA: CONTROL DE REFERIDOS 🔥 */}
              <Link href={`/${locale}/dashboard-admin/referidos`} 
                className="group bg-white p-5 rounded-xl border border-gray-200 hover:border-green-500 hover:shadow-md transition-all cursor-pointer block relative">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-gmc-gris-oscuro group-hover:text-green-600 transition-colors">Referral Control</h3>
                    <p className="text-xs text-gray-500 mt-1 font-medium">Monitor the $25 rewards referral program.</p>
                  </div>
                  <div className="bg-green-50 p-2 rounded-lg text-green-600 group-hover:bg-green-100 transition-colors border border-green-100">
                    <Gift size={20} strokeWidth={2} />
                  </div>
                </div>
              </Link>

              <Link href={`/${locale}/dashboard-admin/compras`} 
                className="group bg-white p-5 rounded-xl border border-gray-200 hover:border-pink-500 hover:shadow-md transition-all cursor-pointer block relative">
                
                {(stats.comprasPendientes || 0) > 0 && (
                    <span className="absolute top-4 right-4 bg-pink-600 text-white text-[10px] font-bold px-2 py-1 rounded-full animate-pulse uppercase tracking-wide lining-nums shadow-sm border border-pink-700">
                        {(stats.comprasPendientes || 0)} To Quote
                    </span>
                )}

                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-gmc-gris-oscuro group-hover:text-pink-600 transition-colors">Personal Shopper</h3>
                    <p className="text-xs text-gray-500 mt-1 font-medium">Manage client purchases and quotes.</p>
                  </div>
                  <div className="bg-pink-50 p-2 rounded-lg text-pink-600 group-hover:bg-pink-100 transition-colors border border-pink-100">
                    <ShoppingBag size={20} strokeWidth={2} />
                  </div>
                </div>
              </Link>

              {/* 🔥 NUEVA TARJETA: CATÁLOGO AMAZON 🔥 */}
              <Link href={`/${locale}/dashboard-admin/catalogo`} 
                className="group bg-white p-5 rounded-xl border border-gray-200 hover:border-yellow-500 hover:shadow-md transition-all cursor-pointer block relative">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-gmc-gris-oscuro group-hover:text-yellow-600 transition-colors">Amazon Catalog</h3>
                    <p className="text-xs text-gray-500 mt-1 font-medium">Manage Miami Locker catalog products.</p>
                  </div>
                  <div className="bg-yellow-50 p-2 rounded-lg text-yellow-600 group-hover:bg-yellow-100 transition-colors border border-yellow-100">
                    <ShoppingCart size={20} strokeWidth={2} />
                  </div>
                </div>
              </Link>

              <Link href={`/${locale}/dashboard-admin/tareas-buzon`} 
                className="group bg-white p-5 rounded-xl border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer block relative">
                
                {(stats.tareasBuzon || 0) > 0 && (
                    <span className="absolute top-4 right-4 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-full animate-pulse uppercase tracking-wide lining-nums shadow-sm border border-blue-700">
                        {(stats.tareasBuzon || 0)} Pending
                    </span>
                )}

                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-gmc-gris-oscuro group-hover:text-blue-600 transition-colors">Mailbox Tasks</h3>
                    <p className="text-xs text-gray-500 mt-1 font-medium">Scan PDFs and shred envelopes.</p>
                  </div>
                  <div className="bg-blue-50 p-2 rounded-lg text-blue-600 group-hover:bg-blue-100 transition-colors border border-blue-100">
                    <FileSearch size={20} strokeWidth={2} />
                  </div>
                </div>
              </Link>

              <Link href={`/${locale}/dashboard-admin/buzones-kyc`} 
                className="group bg-white p-5 rounded-xl border border-gray-200 hover:border-red-400 hover:shadow-md transition-all cursor-pointer block relative">
                
                {(stats.kycPendientes || 0) > 0 && (
                    <span className="absolute top-4 right-4 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-full animate-pulse uppercase tracking-wide lining-nums shadow-sm border border-red-700">
                        {(stats.kycPendientes || 0)} To Review
                    </span>
                )}

                <div className="flex items-start justify-between">
                  <div>
                   <h3 className="text-base font-bold text-gmc-gris-oscuro group-hover:text-red-600 transition-colors">Mailboxes & KYC</h3>
                   <p className="text-xs text-gray-500 mt-1 font-medium">Approve Form 1583 and assign Suites.</p>
                  </div>
                  <div className="bg-red-50 p-2 rounded-lg text-red-600 group-hover:bg-red-100 transition-colors border border-red-100">
                    <ShieldAlert size={20} strokeWidth={2} />
                  </div>
                </div>
              </Link>

              <Link href={`/${locale}/dashboard-admin/recepcion-buzones`} 
                className="group bg-white p-5 rounded-xl border border-gray-200 hover:border-cyan-500 hover:shadow-md transition-all cursor-pointer block">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-gmc-gris-oscuro group-hover:text-cyan-600 transition-colors">Warehouse Reception</h3>
                    <p className="text-xs text-gray-500 mt-1 font-medium">Scan mail and packages to PMB.</p>
                  </div>
                  <div className="bg-cyan-50 p-2 rounded-lg text-cyan-600 group-hover:bg-cyan-100 transition-colors border border-cyan-100">
                    <Mailbox size={20} strokeWidth={2} />
                  </div>
                </div>
              </Link>

              <Link href={`/${locale}/dashboard-admin/inventario-buzones`} 
                className="group bg-white p-5 rounded-xl border border-gray-200 hover:border-slate-600 hover:shadow-md transition-all cursor-pointer block">
              <div className="flex items-start justify-between gap-2">
  <div className="flex-1">
    <h3 className="text-base font-bold text-gmc-gris-oscuro group-hover:text-slate-700 transition-colors">Master Archive</h3>
    <p className="text-xs text-gray-500 mt-1 font-medium">Shredding control.</p>
  </div>
  <div className="bg-slate-100 p-2 rounded-lg text-slate-600 group-hover:bg-slate-200 transition-colors border border-slate-200 shrink-0">
    <Archive size={20} strokeWidth={2} />
  </div>
</div>
              </Link>
              
              <Link href={`/${locale}/dashboard-admin/crear-envio`} 
                className="group bg-white p-5 rounded-xl border border-gray-200 hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer block">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-gmc-gris-oscuro group-hover:text-indigo-600 transition-colors">	Create Shipment (Cargo)</h3>
                    <p className="text-xs text-gray-500 mt-1 font-medium">Register large package for client.</p>
                  </div>
                  <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600 group-hover:bg-indigo-100 transition-colors border border-indigo-100">
                    <PlusCircle size={20} strokeWidth={2} />
                  </div>
                </div>
              </Link>

              <Link href={`/${locale}/dashboard-admin/solicitudes-pickup`} 
                className="group bg-white p-5 rounded-xl border border-gray-200 hover:border-orange-400 hover:shadow-md transition-all cursor-pointer block relative">
                
                {stats.pickups > 0 && (
                    <span className="absolute top-4 right-4 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-full animate-pulse uppercase tracking-wide lining-nums">
                        {stats.pickups} Pending
                    </span>
                )}

                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-gmc-gris-oscuro group-hover:text-orange-600 transition-colors">Pickup Requests</h3>
                    <p className="text-xs text-gray-500 mt-1 font-medium">Manage paid pickups.</p>
                  </div>
                  <div className="bg-orange-50 p-2 rounded-lg text-orange-600 group-hover:bg-orange-100 transition-colors border border-orange-100">
                    <Car size={20} strokeWidth={2} />
                  </div>
                </div>
              </Link>

              <Link href={`/${locale}/dashboard-admin/consolidaciones`} 
                className="group bg-white p-5 rounded-xl border border-gray-200 hover:border-rose-500 hover:shadow-md transition-all cursor-pointer block relative">
                
                {stats.consolidaciones > 0 && (
                    <span className="absolute top-4 right-4 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full animate-pulse uppercase tracking-wide lining-nums">
                        {stats.consolidaciones} Pending
                    </span>
                )}

                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-gmc-gris-oscuro group-hover:text-rose-600 transition-colors">Consolidations</h3>
                    <p className="text-xs text-gray-500 mt-1 font-medium">Consolidation requests.</p>
                  </div>
                  <div className="bg-rose-50 p-2 rounded-lg text-rose-600 group-hover:bg-rose-100 transition-colors border border-rose-100 shrink-0">
                    <Layers size={20} strokeWidth={2} />
                  </div>
                </div>
              </Link>

              <Link href={`/${locale}/dashboard-admin/pagos-almacenaje`} 
                className="group bg-white p-5 rounded-xl border border-gray-200 hover:border-amber-500 hover:shadow-md transition-all cursor-pointer block">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-gmc-gris-oscuro group-hover:text-amber-600 transition-colors">Storage Control</h3>
                    <p className="text-xs text-gray-500 mt-1 font-medium">View income for exceeded storage time.</p>
                  </div>
                  <div className="bg-amber-50 p-2 rounded-lg text-amber-600 group-hover:bg-amber-100 transition-colors border border-amber-100">
                    <Container size={20} strokeWidth={2} />
                  </div>
                </div>
              </Link>

              {/* 🔥 ACTUALIZADO: TARJETA DE CLIENTES CON GLOBO ROJO 🔥 */}
              <Link href={`/${locale}/dashboard-admin/clientes`} 
                className="group bg-white p-5 rounded-xl border border-gray-200 hover:border-purple-500 hover:shadow-md transition-all cursor-pointer block relative">
                
                {(stats.facturasClientes || 0) > 0 && (
                    <span className="absolute top-4 right-4 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full animate-pulse uppercase tracking-wide lining-nums shadow-sm">
                        {(stats.facturasClientes || 0)} TO REVIEW
                    </span>
                )}

                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-gmc-gris-oscuro group-hover:text-purple-600 transition-colors">Client Database</h3>
                    <p className="text-xs text-gray-500 mt-1 font-medium">View list and accounts.</p>
                  </div>
                  <div className="bg-purple-50 p-2 rounded-lg text-purple-600 group-hover:bg-purple-100 transition-colors border border-purple-100">
                    <Users size={20} strokeWidth={2} />
                  </div>
                </div>
                            </Link>

              {/* 🔥 FACEBOOK LEADS CRM */}
              <Link href={`/${locale}/dashboard-admin/leads`}
                className="group bg-white p-5 rounded-xl border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer block">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-gmc-gris-oscuro group-hover:text-blue-600 transition-colors">Facebook Leads</h3>
                    <p className="text-xs text-gray-500 mt-1 font-medium">Manage ad campaign leads.</p>
                  </div>
                  <div className="bg-blue-50 p-2 rounded-lg text-blue-600 group-hover:bg-blue-100 transition-colors border border-blue-100">
                    <UserPlus size={20} strokeWidth={2} />
                  </div>
                </div>
              </Link>

              <Link href={`/${locale}/dashboard-admin/historial-envios`}
                className="group bg-white p-5 rounded-xl border border-gray-200 hover:border-teal-500 hover:shadow-md transition-all cursor-pointer block">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-gmc-gris-oscuro group-hover:text-teal-600 transition-colors">	Global History</h3>
                    <p className="text-xs text-gray-500 mt-1 font-medium">View all shipments.</p>
                  </div>
                  <div className="bg-teal-50 p-2 rounded-lg text-teal-600 group-hover:bg-teal-100 transition-colors border border-teal-100">
                    <ClipboardList size={20} strokeWidth={2} />
                  </div>
                </div>
              </Link>

               <Link href={`/${locale}/dashboard-admin/monitor-envios`} 
                className="group bg-white p-5 rounded-xl border border-gray-200 hover:border-green-500 hover:shadow-md transition-all cursor-pointer block">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-gmc-gris-oscuro group-hover:text-green-600 transition-colors">Live Monitor</h3>
                    <p className="text-xs text-gray-500 mt-1 font-medium">Dispatch control.</p>
                  </div>
                  <div className="bg-green-50 p-2 rounded-lg text-green-600 group-hover:bg-green-100 transition-colors border border-green-100">
                    <Truck size={20} strokeWidth={2} />
                  </div>
                </div>
              </Link>
            </div>

           <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
<h3 
    className="font-bold text-gmc-gris-oscuro mb-4 uppercase text-xs tracking-wider flex items-center justify-between gap-2 cursor-pointer md:cursor-default"
    onClick={() => setActivityExpanded(!activityExpanded)}
>
    <span className="flex items-center gap-2">
        <Activity size={14} className="text-gmc-dorado-principal" /> Activity Log
    </span>
    <span className="md:hidden text-gray-400"><ChevronDown size={16} /></span>
</h3>
<div className={`${activityExpanded ? 'block' : 'hidden'} md:block`}>
        {activities.length === 0 ? (
            <div className="text-sm text-gray-400 text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200 font-medium">
                No recent activity recorded today.
            </div>
        ) : (
            <div className="space-y-2">
                {activities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                        <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                            activity.color === 'blue' ? 'bg-blue-500' :
                            activity.color === 'green' ? 'bg-green-500' :
                            activity.color === 'purple' ? 'bg-purple-500' : 'bg-gray-400'
                        }`} />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-700 truncate">{activity.title}</p>
                            <p className="text-xs text-gray-400 truncate">{activity.subtitle}</p>
                        </div>
                        <span className="text-[10px] text-gray-400 shrink-0">
                            {new Date(activity.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                ))}
            </div>
        )}
    </div>
</div>
</div>

          {/* 4. MAPA DE DRIVERS EN VIVO */}
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-gmc-gris-oscuro flex items-center gap-2 uppercase tracking-wide">
              <MapPin size={20} className="text-gmc-dorado-principal" /> Live Drivers
            </h2>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1 h-[400px] flex flex-col relative overflow-hidden">
              <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm px-3 py-1 rounded shadow-sm border text-[10px] font-bold text-gmc-gris-oscuro uppercase tracking-widest">
                ● Live View
              </div>
              <div className="w-full h-full bg-blue-50 rounded-lg flex flex-col items-center justify-center text-blue-300 relative">
                 <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>
                 <MapPin size={48} className="mb-2 text-blue-500 animate-bounce" />
                 <p className="text-gray-500 font-bold text-sm">Loading...</p>
                 <p className="text-xs text-gray-400 mt-1 text-center px-6 font-medium">
                   Connecting geolocation...
                 </p>
              </div>
              <div className="p-4 border-t border-gray-100">
                <button className="w-full bg-gmc-gris-oscuro text-white py-3 rounded-lg text-xs font-bold hover:bg-black transition-colors flex items-center justify-center gap-2 uppercase tracking-wide">
                  <TrendingUp size={14} /> View Today's Routes
                </button>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-3">
                   <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Active Drivers</span>
                   <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase">Online</span>
                </div>
                <div className="space-y-2">
                   <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-gray-100">
                      <div className="w-8 h-8 rounded-full bg-gmc-gris-oscuro text-gmc-dorado-principal flex items-center justify-center text-xs font-bold shadow-sm">CP</div>
                      <div>
                        <p className="text-sm font-bold text-gmc-gris-oscuro">Main Driver</p>
                        <p className="text-xs text-gray-500 font-medium">On route: Miami Gardens</p>
                      </div>
                   </div>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}