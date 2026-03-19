import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Container, DollarSign, CheckCircle, 
  Clock, Search, Calendar, User, AlertTriangle, Box
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function StorageFeesPage({ params, searchParams }: { params: { locale: string }, searchParams: { q?: string } }) {
  const session = await auth();

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'WAREHOUSE')) {
    redirect('/login-cliente');
  }

  // Lógica de Búsqueda
  const query = searchParams.q || "";
  
  // 🔥 LA REGLA DE NEGOCIO: 30 Días Gratis
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  // 🛡️ 1. OBTENER FACTURAS DE ALMACENAJE (Historial)
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

  const storagePayments = await prisma.pickupRequest.findMany({
    where: { ...baseWhereClause, ...(query ? searchWhereClause : {}) } as any,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: { name: true, email: true, suiteNo: true }
      }
    }
  });

  // 🛡️ 2. OBTENER PAQUETES MOROSOS (La magia de los 30 días)
  const searchWhereClausePackage = query ? {
    OR: [
        { user: { name: { contains: query, mode: 'insensitive' } } },
        { user: { suiteNo: { contains: query, mode: 'insensitive' } } },
        { gmcTrackingNumber: { contains: query, mode: 'insensitive' } }
    ]
  } : {};

  const packagesInDebt = await prisma.package.findMany({
    where: {
      AND: [
        {
          OR: [
            { storageDebt: { gt: 0 } }, // 1. Atrapa si ya tiene deuda manual
            { status: { contains: 'BLOCK', mode: 'insensitive' } }, // 2. Atrapa si alguien lo bloqueó a mano
            { createdAt: { lt: thirtyDaysAgo } } // 3. 🔥 ATRAPA TODO PAQUETE CON MÁS DE 30 DÍAS
          ]
        },
        // Filtro de seguridad: Excluir los que ya no están en bodega
        { status: { notIn: ['ENTREGADO', 'DELIVERED', 'COMPLETADO', 'ENVIADO', 'SHIPPED'] } },
        ...(query ? [searchWhereClausePackage] : [])
      ]
    },
    orderBy: { createdAt: 'asc' }, // Los más viejos primero
    include: { user: { select: { name: true, email: true, suiteNo: true } } }
  });

  // =========================================================================
  // 3. UNIFICAR Y CALCULAR DEUDAS DINÁMICAS
  // =========================================================================
  
  const formattedPayments = storagePayments.map(p => ({
    id: p.id,
    type: 'INVOICE',
    title: 'Storage Fee',
    identifier: p.id.slice(0, 8).toUpperCase(),
    user: p.user,
    date: p.createdAt,
    description: p.description || 'Cobro por almacenamiento prolongado',
    amount: p.totalPaid || p.subtotal || 0,
    status: p.status, 
    icon: <Container className="text-orange-600" size={20} />,
    bgIcon: 'bg-orange-50 border-orange-100'
  }));

  const formattedDebts = packagesInDebt.map(p => {
    // Calculamos cuántos días exactos lleva en bodega
    const msPerDay = 1000 * 60 * 60 * 24;
    const daysInWarehouse = Math.floor((new Date().getTime() - new Date(p.createdAt).getTime()) / msPerDay);
    
    // Calculamos la deuda real usando tu regla de negocio
    let calculatedDebt = p.storageDebt || 0;
    
    if (calculatedDebt === 0 && daysInWarehouse > 30) {
        // Obtenemos dimensiones o usamos 10x10x10 por defecto si están vacías
        const length = p.lengthIn || 10;
        const width = p.widthIn || 10;
        const height = p.heightIn || 10;
        
        // Convertimos a Pies Cúbicos (ft³)
        const volumeFt3 = (length * width * height) / 1728;
        
        // $2.25 USD por ft³ por cada mes de retraso
        const monthsOverdue = Math.ceil((daysInWarehouse - 30) / 30);
        calculatedDebt = monthsOverdue * 2.25 * volumeFt3;
    }

    return {
      id: p.id,
      type: 'PACKAGE',
      title: 'Paquete Vencido',
      identifier: p.gmcTrackingNumber,
      user: p.user,
      date: p.createdAt, // Fecha de ingreso real
      description: `Lleva ${daysInWarehouse} días en bodega (Límite: 30 días)`,
      amount: calculatedDebt, 
      status: 'DEUDA_ACTIVA',
      icon: <Box className="text-red-600" size={20} />,
      bgIcon: 'bg-red-50 border-red-100'
    };
  });

  // Unimos y ordenamos
  const allRecords = [...formattedDebts, ...formattedPayments].sort((a, b) => {
      // Priorizamos mostrar la deuda activa arriba del historial
      if (a.status === 'DEUDA_ACTIVA' && b.status !== 'DEUDA_ACTIVA') return -1;
      if (a.status !== 'DEUDA_ACTIVA' && b.status === 'DEUDA_ACTIVA') return 1;
      return b.date.getTime() - a.date.getTime();
  });

  // Calculamos Estadísticas Totales
  const totalRevenue = storagePayments.reduce((acc, curr) => acc + (curr.totalPaid || 0), 0);
  const totalActiveDebt = formattedDebts.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  // 🔴 LÓGICA DE ESTADOS 🔴
  const getStatusBadge = (status: string) => {
      const s = status?.toUpperCase() || 'PENDIENTE';

      if (s === 'DEUDA_ACTIVA') {
          return (
            <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold flex items-center justify-center gap-1 border border-red-200 animate-pulse">
                <AlertTriangle size={12}/> DEUDA ACTIVA
            </span>
          );
      }
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
                <div className="bg-white px-6 py-3 rounded-xl shadow-sm border border-red-200 flex flex-col items-end bg-red-50/50">
                    <span className="text-xs text-red-600 uppercase font-bold flex items-center gap-1"><AlertTriangle size={12}/> Deuda Activa</span>
                    <span className="font-bold text-2xl text-red-700">${totalActiveDebt.toFixed(2)}</span>
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
                            <th className="p-4">Fecha (Ingreso/Cobro)</th>
                            <th className="p-4">Concepto</th>
                            <th className="p-4 text-center">Monto</th>
                            <th className="p-4 text-center">Estado</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                        {allRecords.length === 0 ? (
                            <tr><td colSpan={6} className="p-10 text-center text-gray-400">No hay pagos ni deudas de almacenaje registradas.</td></tr>
                        ) : (
                            allRecords.map((record) => (
                                <tr key={record.id} className={`transition-colors ${record.status === 'DEUDA_ACTIVA' ? 'bg-red-50/30 hover:bg-red-50' : 'hover:bg-orange-50/20'}`}>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg border ${record.bgIcon}`}>
                                                {record.icon}
                                            </div>
                                            <div>
                                                <p className={`font-bold ${record.status === 'DEUDA_ACTIVA' ? 'text-red-700' : 'text-orange-700'}`}>
                                                    {record.title}
                                                </p>
                                                <p className="text-xs text-gray-400 font-mono">#{record.identifier}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <User size={14} className="text-gray-400"/>
                                            <p className="font-bold text-gray-700">{record.user.name || 'Usuario'}</p>
                                        </div>
                                        <span className="inline-block mt-1 bg-blue-50 text-blue-700 text-[10px] px-2 py-0.5 rounded font-bold border border-blue-100">
                                            {record.user.suiteNo}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Calendar size={14} className="text-gmc-dorado-principal"/>
                                            {new Date(record.date).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="p-4 text-xs font-bold text-gray-500 max-w-[200px] truncate">
                                        {record.description}
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className={`font-bold flex items-center justify-center gap-1 ${record.status === 'DEUDA_ACTIVA' ? 'text-red-600' : 'text-green-600'}`}>
                                            <DollarSign size={14}/>
                                            {record.amount?.toFixed(2) || '0.00'}
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        {getStatusBadge(record.status)}
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