'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react'; 
import { 
  Package, Users, Truck, MapPin, PlusCircle, Layers, 
  Activity, DollarSign, ClipboardList, Car, Loader2, TrendingUp 
} from 'lucide-react';

export default function AdminDashboardClient({ locale }: { locale: string }) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState({
    usuarios: 0,
    paquetes: 0,
    consolidaciones: 0,
    pickups: 0,
    entregasHoy: 0,
    nuevosClientes: 0,
    ventas: 0
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
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 font-montserrat">
        <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin text-gmc-gris-oscuro mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Cargando panel...</p>
        </div>
      </div>
    );
  }

  return (
    // 🔥 APLICANDO EL MÉTODO DE TESTIMONIOS: font-montserrat en el padre
    <div className="min-h-screen bg-gray-50 p-6 font-montserrat">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* ENCABEZADO */}
        <div className="flex justify-between items-end border-b pb-4 border-gray-200">
          <div>
            <h1 className="text-3xl font-bold text-gmc-gris-oscuro tracking-tight uppercase">
              Panel de Control de Operaciones
            </h1>
            <p className="text-gray-500 mt-1 text-sm font-medium">
              Bienvenido, <span className="font-bold text-gmc-dorado-principal uppercase">{session?.user?.name || 'Admin'}</span>. 
              Rol: <span className="text-[10px] bg-gmc-gris-oscuro text-white px-2 py-0.5 rounded uppercase ml-1 tracking-wider">{(session?.user as any)?.role || '...'}</span>
            </p>
          </div>
          <div className="text-right">
             <p className="text-xs font-bold text-gray-400 uppercase tracking-widest lining-nums">
                {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
             </p>
          </div>
        </div>

        {/* 1. SECCIÓN DE ESTADÍSTICAS (KPIs) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <Link href={`/${locale}/dashboard-admin/paquetes`} className="block group">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center hover:shadow-md hover:border-blue-200 transition-all cursor-pointer">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Paquetes Activos</p>
                
                {/* 🔥 EL SECRETO: 'lining-nums' hace que los números se alineen rectos */}
                <h3 className="text-4xl font-extrabold text-gmc-gris-oscuro tracking-tight font-montserrat lining-nums group-hover:text-blue-600 transition-colors">
                    {stats.paquetes}
                </h3>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
                <Package size={24} strokeWidth={2.5} />
              </div>
            </div>
          </Link>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Entregas Hoy</p>
              {/* 🔥 lining-nums aplicado aquí */}
              <h3 className="text-4xl font-extrabold text-gmc-gris-oscuro tracking-tight font-montserrat lining-nums">
                  {stats.entregasHoy || 0}
              </h3> 
            </div>
            <div className="p-3 bg-green-50 text-green-600 rounded-lg">
              <Truck size={24} strokeWidth={2.5} />
            </div>
          </div>

          <Link href={`/${locale}/dashboard-admin/clientes`} className="block group">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center hover:shadow-md hover:border-purple-200 transition-all cursor-pointer">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Nuevos Clientes</p>
                {/* 🔥 lining-nums aplicado aquí */}
                <h3 className="text-4xl font-extrabold text-gmc-gris-oscuro tracking-tight font-montserrat lining-nums group-hover:text-purple-600 transition-colors">
                    {stats.usuarios}
                </h3>
              </div>
              <div className="p-3 bg-purple-50 text-purple-600 rounded-lg group-hover:bg-purple-100 transition-colors">
                <Users size={24} strokeWidth={2.5} />
              </div>
            </div>
          </Link>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center border-b-4 border-b-gmc-dorado-principal">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Ventas (Semana)</p>
              {/* 🔥 lining-nums aplicado aquí */}
              <h3 className="text-4xl font-extrabold text-gmc-gris-oscuro tracking-tight font-montserrat lining-nums">
                  ${(stats.ventas || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="p-3 bg-yellow-50 text-yellow-600 rounded-lg">
              <DollarSign size={24} strokeWidth={2.5} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* 2. ACCIONES DISPONIBLES */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-lg font-bold text-gmc-gris-oscuro flex items-center gap-2 uppercase tracking-wide">
              <Activity size={20} className="text-gmc-dorado-principal" /> Acciones Rápidas
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <Link href={`/${locale}/dashboard-admin/solicitudes-pickup`} 
                className="group bg-white p-5 rounded-xl border border-gray-200 hover:border-orange-400 hover:shadow-md transition-all cursor-pointer block relative">
                
                {stats.pickups > 0 && (
                    <span className="absolute top-4 right-4 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-full animate-pulse uppercase tracking-wide lining-nums">
                        {stats.pickups} Pendientes
                    </span>
                )}

                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-gmc-gris-oscuro group-hover:text-orange-600 transition-colors">Solicitudes de Pickup</h3>
                    <p className="text-xs text-gray-500 mt-1 font-medium">Gestionar recolecciones pagadas.</p>
                  </div>
                  <div className="bg-orange-50 p-2 rounded-lg text-orange-600 group-hover:bg-orange-100 transition-colors">
                    <Car size={20} strokeWidth={2} />
                  </div>
                </div>
              </Link>
              
              <Link href={`/${locale}/dashboard-admin/crear-envio`} 
                className="group bg-white p-5 rounded-xl border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer block">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-gmc-gris-oscuro group-hover:text-blue-600 transition-colors">Crear Envío</h3>
                    <p className="text-xs text-gray-500 mt-1 font-medium">Registrar un nuevo pedido.</p>
                  </div>
                  <div className="bg-blue-50 p-2 rounded-lg text-blue-600 group-hover:bg-blue-100 transition-colors">
                    <PlusCircle size={20} strokeWidth={2} />
                  </div>
                </div>
              </Link>

              <Link href={`/${locale}/dashboard-admin/consolidaciones`} 
                className="group bg-white p-5 rounded-xl border border-gray-200 hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer block relative">
                
                {stats.consolidaciones > 0 && (
                    <span className="absolute top-4 right-4 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full animate-pulse uppercase tracking-wide lining-nums">
                        {stats.consolidaciones} Pendientes
                    </span>
                )}

                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-gmc-gris-oscuro group-hover:text-indigo-600 transition-colors">Consolidaciones</h3>
                    <p className="text-xs text-gray-500 mt-1 font-medium">Ver solicitudes de agrupación.</p>
                  </div>
                  <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600 group-hover:bg-indigo-100 transition-colors">
                    <Layers size={20} strokeWidth={2} />
                  </div>
                </div>
              </Link>

              <Link href={`/${locale}/dashboard-admin/clientes`} 
                className="group bg-white p-5 rounded-xl border border-gray-200 hover:border-purple-500 hover:shadow-md transition-all cursor-pointer block">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-gmc-gris-oscuro group-hover:text-purple-600 transition-colors">Base de Clientes</h3>
                    <p className="text-xs text-gray-500 mt-1 font-medium">Ver listado y cuentas.</p>
                  </div>
                  <div className="bg-purple-50 p-2 rounded-lg text-purple-600 group-hover:bg-purple-100 transition-colors">
                    <Users size={20} strokeWidth={2} />
                  </div>
                </div>
              </Link>

              <Link href={`/${locale}/dashboard-admin/historial-envios`} 
                className="group bg-white p-5 rounded-xl border border-gray-200 hover:border-teal-500 hover:shadow-md transition-all cursor-pointer block">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-gmc-gris-oscuro group-hover:text-teal-600 transition-colors">Historial Global</h3>
                    <p className="text-xs text-gray-500 mt-1 font-medium">Consulta todos los envíos.</p>
                  </div>
                  <div className="bg-teal-50 p-2 rounded-lg text-teal-600 group-hover:bg-teal-100 transition-colors">
                    <ClipboardList size={20} strokeWidth={2} />
                  </div>
                </div>
              </Link>

               <Link href={`/${locale}/dashboard-admin/monitor-envios`} 
                className="group bg-white p-5 rounded-xl border border-gray-200 hover:border-green-500 hover:shadow-md transition-all cursor-pointer block">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-gmc-gris-oscuro group-hover:text-green-600 transition-colors">Monitor en Vivo</h3>
                    <p className="text-xs text-gray-500 mt-1 font-medium">Control de despachos.</p>
                  </div>
                  <div className="bg-green-50 p-2 rounded-lg text-green-600 group-hover:bg-green-100 transition-colors">
                    <Truck size={20} strokeWidth={2} />
                  </div>
                </div>
              </Link>
            </div>

             <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
                <h3 className="font-bold text-gmc-gris-oscuro mb-4 uppercase text-xs tracking-wider">Log de Actividad</h3>
                <div className="text-sm text-gray-400 text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200 font-medium">
                  No hay actividad reciente registrada hoy.
                </div>
             </div>
          </div>

          {/* 4. MAPA DE DRIVERS EN VIVO */}
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-gmc-gris-oscuro flex items-center gap-2 uppercase tracking-wide">
              <MapPin size={20} className="text-gmc-dorado-principal" /> Drivers en Vivo
            </h2>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1 h-[400px] flex flex-col relative overflow-hidden">
              <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm px-3 py-1 rounded shadow-sm border text-[10px] font-bold text-gmc-gris-oscuro uppercase tracking-widest">
                ● Live View
              </div>
              <div className="w-full h-full bg-blue-50 rounded-lg flex flex-col items-center justify-center text-blue-300 relative">
                 <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>
                 <MapPin size={48} className="mb-2 text-blue-500 animate-bounce" />
                 <p className="text-gray-500 font-bold text-sm">Cargando...</p>
                 <p className="text-xs text-gray-400 mt-1 text-center px-6 font-medium">
                   Conectando geolocalización...
                 </p>
              </div>
              <div className="p-4 border-t border-gray-100">
                <button className="w-full bg-gmc-gris-oscuro text-white py-3 rounded-lg text-xs font-bold hover:bg-black transition-colors flex items-center justify-center gap-2 uppercase tracking-wide">
                  <TrendingUp size={14} /> Ver Rutas de Hoy
                </button>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-3">
                   <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Drivers Activos</span>
                   <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase">Online</span>
                </div>
                <div className="space-y-2">
                   <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-gray-100">
                      <div className="w-8 h-8 rounded-full bg-gmc-gris-oscuro text-gmc-dorado-principal flex items-center justify-center text-xs font-bold shadow-sm">CP</div>
                      <div>
                        <p className="text-sm font-bold text-gmc-gris-oscuro">Chofer Principal</p>
                        <p className="text-xs text-gray-500 font-medium">En ruta: Miami Gardens</p>
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