import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Truck, MapPin, Calendar, Package, Container, Phone, 
  CheckCircle, Clock, DollarSign, Scale, Ruler, Eye, Search, AlertCircle 
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PickupRequestsPage({ params, searchParams }: { params: { locale: string }, searchParams: { q?: string } }) {
  const session = await auth();

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'WAREHOUSE')) {
    redirect('/login-cliente');
  }

  // Lógica de Búsqueda
  const query = searchParams.q || "";
  const whereClause = query ? {
    OR: [
        { user: { name: { contains: query, mode: 'insensitive' } } },
        { user: { suiteNo: { contains: query, mode: 'insensitive' } } },
        { id: { contains: query, mode: 'insensitive' } }
    ]
  } : {};

  const requests = await prisma.pickupRequest.findMany({
    where: whereClause as any,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: { name: true, email: true, suiteNo: true }
      }
    }
  });

  // Helpers
  const getServiceIcon = (type: string) => {
    switch (type) {
        case 'STORAGE': return <Container className="text-orange-600" size={20} />;
        case 'DELIVERY': return <MapPin className="text-green-600" size={20} />;
        default: return <Truck className="text-blue-600" size={20} />;
    }
  };

  const getServiceLabel = (type: string) => {
    switch (type) {
        case 'STORAGE': return 'Storage / Almacén';
        case 'DELIVERY': return 'Delivery Local';
        default: return 'Envío Internacional';
    }
  };

  // 🔴 LÓGICA CORREGIDA PARA ESTADOS 🔴
  const getStatusBadge = (status: string) => {
      const s = status?.toUpperCase() || 'PENDIENTE';

      // 1. ESTADOS FINALES (VERDE)
      if (s === 'ENTREGADO' || s === 'COMPLETADO') {
          return (
            <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold flex items-center justify-center gap-1 border border-green-200">
                <CheckCircle size={12}/> ENTREGADO
            </span>
          );
      }

      // 2. ESTADOS ACTIVOS / EN RUTA (AZUL - PULSANDO)
      if (s === 'EN_REPARTO' || s === 'EN_CAMINO' || s === 'OUT_FOR_DELIVERY') {
          return (
            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold flex items-center justify-center gap-1 border border-blue-200 animate-pulse">
                <Truck size={12}/> EN RUTA
            </span>
          );
      }

      // 3. ESTADOS PAGADOS / ASIGNADOS (MORADO)
      if (s === 'PAGADO' || s === 'ACEPTADO') {
          return (
            <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-bold flex items-center justify-center gap-1 border border-purple-200">
                <CheckCircle size={12}/> PAGADO
            </span>
          );
      }

      // 4. DEFECTO / PENDIENTE (AMARILLO)
      return (
        <span className="bg-yellow-50 text-yellow-700 px-2 py-1 rounded text-xs font-bold flex items-center justify-center gap-1 border border-yellow-200">
            <Clock size={12}/> PENDIENTE
        </span>
      );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-montserrat">
      <div className="max-w-7xl mx-auto">
        
        {/* Header con Buscador */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <Link href={`/${params.locale}/dashboard-admin`} className="text-gray-400 hover:text-gmc-dorado-principal">
                        <ArrowLeft size={24} />
                    </Link>
                    <h1 className="text-3xl font-bold text-gmc-gris-oscuro font-garamond">
                        Gestión de Transporte
                    </h1>
                </div>
                <p className="text-gray-500 ml-8 mb-4">Monitor de Pick-ups, Deliveries y Storage.</p>
                
                {/* BUSCADOR */}
                <form className="ml-8 flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        <input 
                            name="q" 
                            defaultValue={query} 
                            placeholder="Buscar cliente, suite o ID..." 
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-64"
                        />
                    </div>
                    <button type="submit" className="bg-gmc-gris-oscuro text-white px-4 py-2 rounded-lg font-bold hover:bg-black">
                        Buscar
                    </button>
                </form>
            </div>
            
            <div className="bg-white px-6 py-3 rounded-xl shadow-sm border border-gray-200 flex flex-col items-end">
                <span className="text-xs text-gray-400 uppercase font-bold">Solicitudes Totales</span>
                <span className="font-bold text-2xl text-gmc-gris-oscuro">{requests.length}</span>
            </div>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold border-b border-gray-200">
                        <tr>
                            <th className="p-4">Servicio</th>
                            <th className="p-4">Cliente</th>
                            <th className="p-4">Ruta (A &rarr; B)</th>
                            <th className="p-4">Carga / Detalles</th>
                            <th className="p-4 text-center">Pago</th>
                            <th className="p-4 text-center">Estado</th>
                            <th className="p-4 text-right">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                        {requests.length === 0 ? (
                            <tr><td colSpan={7} className="p-10 text-center text-gray-400">No se encontraron solicitudes.</td></tr>
                        ) : (
                            requests.map((req) => (
                                <tr key={req.id} className="hover:bg-blue-50/20 transition-colors group">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-gray-50 rounded-lg border border-gray-200 group-hover:bg-white transition-colors">
                                                {getServiceIcon(req.serviceType)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gmc-gris-oscuro">{getServiceLabel(req.serviceType)}</p>
                                                <p className="text-xs text-gray-400 font-mono">#{req.id.slice(0,6).toUpperCase()}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <p className="font-bold text-gray-700">{req.user.name || 'Usuario'}</p>
                                        <span className="inline-block bg-blue-50 text-blue-700 text-[10px] px-2 py-0.5 rounded font-bold border border-blue-100">
                                            {req.user.suiteNo}
                                        </span>
                                    </td>
                                    <td className="p-4 max-w-xs">
                                        <div className="space-y-1 text-xs">
                                            <p className="text-gray-600 truncate" title={req.originAddress}>A: {req.originAddress}</p>
                                            <p className="text-gray-600 truncate" title={req.dropOffAddress || 'Almacén'}>B: {req.dropOffAddress || 'Almacén'}</p>
                                        </div>
                                    </td>
                                    <td className="p-4 text-xs text-gray-500 italic truncate max-w-[150px]">{req.description}</td>
                                    <td className="p-4 text-center font-bold">${req.totalPaid?.toFixed(2)}</td>
                                    
                                    {/* ESTADO CORREGIDO */}
                                    <td className="p-4 text-center">{getStatusBadge(req.status)}</td>
                                    
                                    <td className="p-4 text-right">
                                        <Link 
                                            href={`/${params.locale}/dashboard-admin/solicitudes-pickup/${req.id}`}
                                            className="inline-flex items-center gap-1 text-sm font-bold text-gmc-dorado-principal hover:text-black hover:underline transition-colors"
                                        >
                                            <Eye size={16}/> Ver
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>

      </div>
    </div>
  );
}