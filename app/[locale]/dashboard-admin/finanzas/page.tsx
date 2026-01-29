import React from 'react';
import { prisma } from '@/lib/prisma';
import { 
  DollarSign, 
  TrendingUp, 
  CreditCard, 
  Calendar, 
  Download,
  Search,
  Filter,
  AlertCircle
} from 'lucide-react';

// Función auxiliar para formatear dinero
const formatCurrency = (amount: number | null) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount || 0);
};

// Función auxiliar para formatear fecha
const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date);
};

export default async function FinanzasPage() {
  
  // ==============================================================================
  // 1. CONSULTAS DE AGREGACIÓN (SUMAS TOTALES REALES)
  // Usamos .aggregate() para que la BD sume todo el historial sin limites.
  // ==============================================================================
  
  const [packageStats, consolidationStats, pickupStats] = await Promise.all([
    // Estadísticas de Paquetes
    prisma.package.aggregate({
      _sum: {
        shippingTotalPaid: true, // Lo que ya entró (Ingreso)
        storageDebt: true,       // Lo que deben de almacén (Deuda)
        shippingSubtotal: true   // El costo total del servicio
      },
      _count: { id: true }
    }),
    // Estadísticas de Consolidaciones
    prisma.consolidatedShipment.aggregate({
      _sum: {
        totalAmount: true,       // Asumimos que esto es el total facturado
        // Si tienes un campo de "pagado" en consolidaciones, úsalo aquí. 
        // Por ahora asumiremos que totalAmount es lo esperado.
      },
      _count: { id: true }
    }),
    // Estadísticas de Pickups
    prisma.pickupRequest.aggregate({
      _sum: {
        totalPaid: true,
        subtotal: true
      },
      _count: { id: true }
    })
  ]);

  // ==============================================================================
  // 2. CÁLCULOS FINANCIEROS (KPIs)
  // ==============================================================================

  // A. INGRESOS REALES (Lo que ya entró al banco)
  const incomePackages = packageStats._sum.shippingTotalPaid || 0;
  const incomeConsolidations = consolidationStats._sum.totalAmount || 0; // Ajustar si tienes campo 'paid'
  const incomePickups = pickupStats._sum.totalPaid || 0;
  
  const totalIncome = incomePackages + incomeConsolidations + incomePickups;

  // B. CUENTAS POR COBRAR (Dinero en la calle)
  // 1. Deuda de Almacenaje (Explícita en tu Schema)
  const debtStorage = packageStats._sum.storageDebt || 0;
  
  // 2. Deuda de Envíos (Subtotal - Pagado)
  // Solo contamos deuda si el subtotal es mayor a lo pagado
  const subtotalPackages = packageStats._sum.shippingSubtotal || 0;
  const debtShipping = Math.max(0, subtotalPackages - incomePackages);
  
  const debtPickups = Math.max(0, (pickupStats._sum.subtotal || 0) - incomePickups);

  const totalReceivable = debtStorage + debtShipping + debtPickups;

  // C. TICKET PROMEDIO
  const totalTransactionsCount = packageStats._count.id + consolidationStats._count.id + pickupStats._count.id;
  const averageTicket = totalTransactionsCount > 0 ? totalIncome / totalTransactionsCount : 0;


  // ==============================================================================
  // 3. CONSULTA DE ÚLTIMAS TRANSACCIONES (PARA LA TABLA)
  // Traemos los últimos 20 movimientos mezclados
  // ==============================================================================
  const [packages, consolidations, pickups] = await Promise.all([
    prisma.package.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { user: true }
    }),
    prisma.consolidatedShipment.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { user: true }
    }),
    prisma.pickupRequest.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { user: true }
    })
  ]);

  // Normalizamos los datos para la tabla
  const recentTransactions = [
    ...packages.map(p => ({
      id: p.gmcTrackingNumber,
      type: 'Paquete',
      date: p.createdAt,
      amount: p.shippingTotalPaid || 0,
      debt: p.storageDebt + ((p.shippingSubtotal || 0) - (p.shippingTotalPaid || 0)), // Deuda específica de este item
      status: p.status,
      client: p.user.name || p.user.email,
    })),
    ...consolidations.map(c => ({
      id: c.gmcShipmentNumber,
      type: 'Consolidación',
      date: c.createdAt,
      amount: c.totalAmount || 0,
      debt: 0, // Ajustar según lógica de consolidación
      status: c.status,
      client: c.user.name || c.user.email,
    })),
    ...pickups.map(pk => ({
      id: pk.id.substring(0, 8).toUpperCase(),
      type: 'Pickup',
      date: pk.createdAt,
      amount: pk.totalPaid || 0,
      debt: (pk.subtotal || 0) - (pk.totalPaid || 0),
      status: pk.status,
      client: pk.user.name || pk.user.email,
    }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 20);


  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gmc-gris-oscuro font-garamond">
            Finanzas y Facturación
          </h1>
          <p className="text-gray-500 mt-1">
            Métricas calculadas en tiempo real desde la base de datos.
          </p>
        </div>
        <button className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors shadow-sm font-medium text-sm">
          <Download size={18} />
          <span>Exportar Reporte</span>
        </button>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* INGRESOS TOTALES */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Ingresos Totales</p>
            <h3 className="text-3xl font-bold text-gmc-verde-oscuro mt-2">{formatCurrency(totalIncome)}</h3>
            <span className="text-xs text-green-600 mt-1 block">
              Procesados exitosamente
            </span>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <DollarSign className="text-green-600" size={24} />
          </div>
        </div>

        {/* POR COBRAR (DEUDA + STORAGE) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Por Cobrar (Deuda)</p>
            <h3 className="text-3xl font-bold text-red-500 mt-2">{formatCurrency(totalReceivable)}</h3>
            
            {/* Desglose pequeño */}
            <div className="mt-2 text-xs text-gray-500 space-y-1">
               <p className="flex justify-between w-full gap-4">
                 <span>Almacenaje:</span> 
                 <span className="font-bold text-red-400">{formatCurrency(debtStorage)}</span>
               </p>
               <p className="flex justify-between w-full gap-4">
                 <span>Envíos:</span> 
                 <span className="font-bold text-red-400">{formatCurrency(debtShipping + debtPickups)}</span>
               </p>
            </div>

          </div>
          <div className="p-3 bg-red-50 rounded-lg">
            <AlertCircle className="text-red-500" size={24} />
          </div>
        </div>

        {/* TICKET PROMEDIO */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Ticket Promedio</p>
            <h3 className="text-3xl font-bold text-blue-600 mt-2">{formatCurrency(averageTicket)}</h3>
            <span className="text-xs text-gray-400 mt-1 block">
              Sobre {totalTransactionsCount} operaciones
            </span>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <CreditCard className="text-blue-600" size={24} />
          </div>
        </div>
      </div>

      {/* Tabla de Movimientos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800">Actividad Reciente</h3>
          {/* Aquí irían los filtros de búsqueda */}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 text-xs text-gray-500 font-semibold uppercase tracking-wider text-left">
              <tr>
                <th className="px-6 py-4">ID / Tracking</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Concepto</th>
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4">Pagado</th>
                <th className="px-6 py-4">Deuda</th>
                <th className="px-6 py-4">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {recentTransactions.length === 0 ? (
                 <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-400">Sin datos registrados</td></tr>
              ) : (
                recentTransactions.map((tx, i) => (
                  <tr key={`${tx.id}-${i}`} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-medium text-gray-900">{tx.id}</td>
                    <td className="px-6 py-4 text-gray-600">{tx.client}</td>
                    <td className="px-6 py-4 text-xs font-medium text-gray-500">{tx.type}</td>
                    <td className="px-6 py-4 text-gray-500">{formatDate(tx.date)}</td>
                    
                    {/* Columna Pagado */}
                    <td className="px-6 py-4 font-bold text-gmc-verde-oscuro">
                        {formatCurrency(tx.amount)}
                    </td>
                    
                    {/* Columna Deuda (Alerta visual) */}
                    <td className="px-6 py-4 font-bold">
                        {tx.debt > 0 ? (
                            <span className="text-red-500 bg-red-50 px-2 py-1 rounded text-xs">
                                {formatCurrency(tx.debt)}
                            </span>
                        ) : (
                            <span className="text-gray-300">-</span>
                        )}
                    </td>

                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-gray-100 rounded-full text-xs font-bold text-gray-600">
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}