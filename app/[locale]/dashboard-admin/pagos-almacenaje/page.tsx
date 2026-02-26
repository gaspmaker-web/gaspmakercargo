import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Container, DollarSign, CheckCircle, 
  Clock, Search, Calendar, User
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function StorageFeesPage({ params, searchParams }: { params: { locale: string }, searchParams: { q?: string } }) {
  const session = await auth();

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'WAREHOUSE')) {
    redirect('/login-cliente');
  }

  // Lógica de Búsqueda
  const query = searchParams.q || "";
  
  // 🛡️ FILTRO ESTRICTO: Solo mostramos Pagos de Almacenaje (STORAGE y STORAGE_FEE)
  const baseWhereClause = {
    serviceType: { in: ['STORAGE', 'STORAGE_FEE'] }
  };

  const searchWhereClause = query ? {
    OR: [
        { user: { name: { contains: query, mode: 'insensitive' } } },
        { user: { suiteNo: { contains: query, mode: 'insensitive' } } },
        { id: { contains: query, mode: 'insensitive' } }
    ]
  } : {};

  const finalWhereClause = {
      ...baseWhereClause,
      ...(query ? searchWhereClause : {}) 
  };

  const storagePayments = await prisma.pickupRequest.findMany({
    where: finalWhereClause as any,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: { name: true, email: true, suiteNo: true }
      }
    }
  });

  // Calculamos el total de dinero recaudado en almacenaje
  const totalRevenue = storagePayments.reduce((acc, curr) => acc + (curr.totalPaid || 0), 0);

  // 🔴 LÓGICA DE ESTADOS 🔴
  const getStatusBadge = (status: string) => {
      const s = status?.toUpperCase() || 'PENDIENTE';

      if (s === 'PAGADO' || s === 'COMPLETADO') {
          return (
            <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold flex items-center justify-center gap-1 border border-green-200">
                <CheckCircle size={12}/> PAGADO
            </span>
          );
      }
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
                        Control de Almacenaje
                    </h1>
                </div>
                <p className="text-gray-500 ml-8 mb-4">Monitor de cobros por tiempo excedido en bodega.</p>
                
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
            
            <div className="flex gap-4">
                <div className="bg-white px-6 py-3 rounded-xl shadow-sm border border-gray-200 flex flex-col items-end">
                    <span className="text-xs text-gray-400 uppercase font-bold">Cobros Totales</span>
                    <span className="font-bold text-2xl text-gmc-gris-oscuro">{storagePayments.length}</span>
                </div>
                <div className="bg-white px-6 py-3 rounded-xl shadow-sm border border-green-200 flex flex-col items-end bg-green-50/30">
                    <span className="text-xs text-green-600 uppercase font-bold">Ingresos Estimados</span>
                    <span className="font-bold text-2xl text-green-700">${totalRevenue.toFixed(2)}</span>
                </div>
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
                            <th className="p-4">Fecha de Cobro</th>
                            <th className="p-4">Concepto</th>
                            <th className="p-4 text-center">Monto</th>
                            <th className="p-4 text-center">Estado</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                        {storagePayments.length === 0 ? (
                            <tr><td colSpan={6} className="p-10 text-center text-gray-400">No hay pagos de almacenaje registrados.</td></tr>
                        ) : (
                            storagePayments.map((payment) => (
                                <tr key={payment.id} className="hover:bg-orange-50/20 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-orange-50 rounded-lg border border-orange-100">
                                                <Container className="text-orange-600" size={20} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-orange-700">Storage Fee</p>
                                                <p className="text-xs text-gray-400 font-mono">#{payment.id.slice(0,6).toUpperCase()}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <User size={14} className="text-gray-400"/>
                                            <p className="font-bold text-gray-700">{payment.user.name || 'Usuario'}</p>
                                        </div>
                                        <span className="inline-block mt-1 bg-blue-50 text-blue-700 text-[10px] px-2 py-0.5 rounded font-bold border border-blue-100">
                                            {payment.user.suiteNo}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Calendar size={14} className="text-gmc-dorado-principal"/>
                                            {new Date(payment.createdAt).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="p-4 text-xs text-gray-500 italic max-w-[200px] truncate">
                                        {payment.description || 'Cobro por almacenamiento prolongado'}
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="font-bold text-green-600 flex items-center justify-center gap-1">
                                            <DollarSign size={14}/>
                                            {payment.totalPaid?.toFixed(2) || '0.00'}
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        {getStatusBadge(payment.status)}
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