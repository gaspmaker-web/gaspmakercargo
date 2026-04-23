import React from 'react';
import ExportButton from './ExportButton';
import { prisma } from '@/lib/prisma';
import { 
  DollarSign, 
  TrendingUp, 
  CreditCard, 
  Calendar, 
  Download,
  AlertCircle,
  Mail,
  Package,
  CheckCircle,
  Truck // 🔥 NUEVO ICONO PARA LOS PICKUPS
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
  // 1. CONSULTAS DE AGREGACIÓN (CARGA TRADICIONAL Y PICKUPS)
  // ==============================================================================
  
  const [packageStats, consolidationStats, pickupStats] = await Promise.all([
    prisma.package.aggregate({
      // 🔥 FILTRO ANTI-CLONES: Ignorar los paquetes que ya pertenecen a un Pickup o Consolidación
      where: { consolidatedShipmentId: null }, 
      _sum: {
        shippingTotalPaid: true, 
        storageDebt: true,       
        shippingSubtotal: true   
      },
      _count: { id: true }
    }),
    prisma.consolidatedShipment.aggregate({
      _sum: {
        totalAmount: true,       
      },
      _count: { id: true }
    }),
    prisma.pickupRequest.aggregate({
      _sum: {
        totalPaid: true,
        subtotal: true
      },
      _count: { id: true }
    })
  ]);

// ==============================================================================
  // 2. INGRESOS DEL BUZÓN VIRTUAL (LECTURA EXACTA DE TRANSACCIONES Y SERVICIOS)
  // ==============================================================================
  let incomeBuzonSuscripciones = 0;
  let incomeBuzonServicios = 0;

  try {
      // 🔥 LECTURA REAL Y EXACTA DE SUPABASE (Tabla MailboxTransaction)
      // Buscamos todas las transacciones completadas del buzón
      const allBuzonTxs = await prisma.mailboxTransaction.findMany({
          where: { status: 'COMPLETADO' }
      });

      // Separamos el dinero según la descripción del cobro
      allBuzonTxs.forEach(tx => {
          const desc = tx.description.toUpperCase();
          // Si es un pago de plan o upgrade, va a Suscripciones
          if (desc.includes('PLAN') || desc.includes('UPGRADE') || desc.includes('MENSUALIDAD')) {
              incomeBuzonSuscripciones += tx.amount;
          } 
          // Si es un servicio manual, va a Scan & Shredding
          else if (desc.includes('ESCANEO') || desc.includes('TRITURA') || desc.includes('SHREDDING') || desc.includes('SCAN')) {
              incomeBuzonServicios += tx.amount;
          } 
          // Cualquier otra cosa por defecto
          else {
              incomeBuzonServicios += tx.amount;
          }
      });
      
  } catch (error) {
      console.error("Error leyendo transacciones del Buzón Virtual:", error);
  }

  const totalIncomeBuzon = incomeBuzonSuscripciones + incomeBuzonServicios;

  // ==============================================================================
  // 3. CÁLCULOS FINANCIEROS GLOBALES
  // ==============================================================================

  // A. INGRESOS DE CARGA Y PICKUPS (SEPARADOS)
  const incomePackages = packageStats._sum.shippingTotalPaid || 0;
  const incomeConsolidations = consolidationStats._sum.totalAmount || 0; 
  const incomePickups = pickupStats._sum.totalPaid || 0;
  
  // 🔥 AQUÍ ESTÁ LA VARIABLE QUE FALTABA: Sumamos paquetes y consolidaciones (sin pickups)
  const totalIncomeCarga = incomePackages + incomeConsolidations;

  // B. INGRESO GLOBAL DE LA EMPRESA
  const grandTotalIncome = totalIncomeCarga + incomePickups + totalIncomeBuzon;

  // C. CUENTAS POR COBRAR (Deuda)
  const debtStorage = packageStats._sum.storageDebt || 0;
  const subtotalPackages = packageStats._sum.shippingSubtotal || 0;
  const debtShipping = Math.max(0, subtotalPackages - incomePackages);
  const debtPickups = Math.max(0, (pickupStats._sum.subtotal || 0) - incomePickups);

  const totalReceivable = debtStorage + debtShipping + debtPickups;


  // ==============================================================================
  // 4. CONSULTA DE ÚLTIMAS TRANSACCIONES (TABLA)
  // ==============================================================================
  const [packages, consolidations, pickups, mailboxTxs] = await Promise.all([
    prisma.package.findMany({
      // 🔥 FILTRO VISUAL ANTI-CLONES: Oculta los paquetes que pertenecen a una Consolidación o Pickup
      where: { consolidatedShipmentId: null },
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
    }),

    // 🔥 NUEVO: Leemos directamente los Recibos (Transactions) para la tabla
    prisma.mailboxTransaction.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { user: true }
    })
  ]);

  type TransactionType = {
    id: string;
    type: string;
    date: Date;
    amount: number;
    debt: number;
    status: string;
    client: string;
    description?: string | null;
  };

  const recentTransactions: TransactionType[] = [
    ...packages.map(p => {
        const isDocument = p.courier === 'Buzón Virtual' || (p.carrierTrackingNumber || '').startsWith('DOC-');
        const calculatedDebt = isDocument ? 0 : p.storageDebt + ((p.shippingSubtotal || 0) - (p.shippingTotalPaid || 0));
        return {
          id: p.gmcTrackingNumber,
          type: isDocument ? 'Documento (Buzón)' : 'Paquete',
          date: p.createdAt,
          amount: p.shippingTotalPaid || 0,
          debt: Math.max(0, calculatedDebt), 
          status: p.status,
          client: p.user.name || p.user.email,
        };
    }),
    ...consolidations.map(c => ({
      id: c.gmcShipmentNumber,
      type: 'Consolidación',
      date: c.createdAt,
      amount: c.totalAmount || 0,
      debt: 0, 
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
    })),
    // 🔥 NUEVO: Mapeamos los recibos reales (Transacciones) a la tabla
    ...mailboxTxs.map(tx => ({
      id: tx.stripePaymentId ? `STRIPE-${tx.stripePaymentId.substring(0,8)}` : `TX-${tx.id.substring(0, 6).toUpperCase()}`,
      type: 'Pago Buzón Virtual',
      date: tx.createdAt,
      amount: tx.amount, // Aquí leerá los $7.99 o $14.99 exactos
      debt: 0,
      status: tx.status,
      client: tx.user?.name || tx.user?.email || 'N/A',
      description: tx.description // Ej: "UPGRADE A PREMIUM"
    }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 30);


  return (
    <div className="space-y-8 pb-20">
      
     {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gmc-gris-oscuro font-garamond">
            Finanzas y Facturación
          </h1>
          <p className="text-gray-500 mt-1">
            Métricas de Carga Tradicional y Buzón Virtual en tiempo real.
          </p>
        </div>
        {/* 🔥 AQUÍ INYECTAMOS EL NUEVO BOTÓN EXPORTADOR 🔥 */}
        <ExportButton transactions={recentTransactions} />
      </div>

     {/* KPI CARDS (5 Columnas) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-4">
        
        {/* 1. INGRESOS GLOBALES EMPRESA */}
        <div className="bg-gradient-to-br from-gmc-gris-oscuro to-gray-800 p-5 rounded-2xl shadow-lg border border-gray-700 flex flex-col justify-between text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20"><TrendingUp size={48} /></div>
          <div className="relative z-10">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Global (GMC)</p>
            <h3 className="text-2xl md:text-3xl font-bold text-gmc-dorado-principal mt-1">{formatCurrency(grandTotalIncome)}</h3>
            <span className="text-[10px] text-gray-300 mt-2 flex items-center gap-1">
              <CheckCircle className="text-green-400" size={12}/> Facturación Neta
            </span>
          </div>
        </div>

        {/* 2. INGRESOS CARGA (Tradicional) */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Carga Tradicional</p>
            <div className="p-2 bg-blue-50 rounded-lg"><Package className="text-blue-600" size={16} /></div>
          </div>
          <div>
            <h3 className="text-xl md:text-2xl font-bold text-gray-800">{formatCurrency(totalIncomeCarga)}</h3>
            <span className="text-[10px] text-gray-500 mt-1 block font-medium">Cajas y Envíos</span>
          </div>
        </div>

        {/* 3. NUEVA: PICKUPS A DOMICILIO */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-orange-100 flex flex-col justify-between relative overflow-hidden group hover:border-orange-200 transition-colors">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] font-bold text-orange-500 uppercase tracking-wider">Pickups Domicilio</p>
            <div className="p-2 bg-orange-50 rounded-lg group-hover:bg-orange-100 transition-colors"><Truck className="text-orange-600" size={16} /></div>
          </div>
          <div>
            <h3 className="text-xl md:text-2xl font-bold text-gray-800">{formatCurrency(incomePickups)}</h3>
            <span className="text-[10px] text-gray-500 mt-1 block font-medium">Recogidas a clientes</span>
          </div>
        </div>

        {/* 4. INGRESOS BUZÓN VIRTUAL */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-purple-100 flex flex-col justify-between relative overflow-hidden group hover:border-purple-200 transition-colors">
          <div className="absolute top-0 right-0 w-1 h-full bg-purple-500"></div>
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] font-bold text-purple-500 uppercase tracking-wider">Buzón Virtual</p>
            <div className="p-2 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors"><Mail className="text-purple-600" size={16} /></div>
          </div>
          <div>
            <h3 className="text-xl md:text-2xl font-bold text-gray-800">{formatCurrency(totalIncomeBuzon)}</h3>
            <div className="mt-2 space-y-1">
               <p className="flex justify-between text-[10px] text-gray-500">
                 <span>Planes:</span> <span className="font-bold text-purple-600">{formatCurrency(incomeBuzonSuscripciones)}</span>
               </p>
               <p className="flex justify-between text-[10px] text-gray-500">
                 <span>Servicios:</span> <span className="font-bold text-purple-600">{formatCurrency(incomeBuzonServicios)}</span>
               </p>
            </div>
          </div>
        </div>

        {/* 5. POR COBRAR (DEUDA) */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-red-100 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Por Cobrar</p>
            <div className="p-2 bg-red-50 rounded-lg"><AlertCircle className="text-red-500" size={16} /></div>
          </div>
          <div>
            <h3 className="text-xl md:text-2xl font-bold text-red-600">{formatCurrency(totalReceivable)}</h3>
            <div className="mt-2 space-y-1">
               <p className="flex justify-between text-[10px] text-gray-500">
                 <span>Almacenaje:</span> <span className="font-bold text-red-400">{formatCurrency(debtStorage)}</span>
               </p>
               <p className="flex justify-between text-[10px] text-gray-500">
                 <span>Fletes/Carga:</span> <span className="font-bold text-red-400">{formatCurrency(debtShipping + debtPickups)}</span>
               </p>
            </div>
          </div>
        </div>

      </div>

      {/* Tabla de Movimientos */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
             <CreditCard size={20} className="text-gray-400"/> Actividad Financiera Reciente
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white text-xs text-gray-400 font-bold uppercase tracking-wider text-left border-b border-gray-100">
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
            <tbody className="divide-y divide-gray-50 text-sm">
              {recentTransactions.length === 0 ? (
                 <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-400">Sin datos registrados</td></tr>
              ) : (
                recentTransactions.map((tx, i) => (
                  <tr key={`${tx.id}-${i}`} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-gray-700 text-xs">{tx.id || 'N/A'}</td>
                    <td className="px-6 py-4 text-gray-600 font-medium">{tx.client}</td>
                    <td className="px-6 py-4">
                        <div className="flex flex-col">
                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase w-fit ${
                                tx.type.includes('Buzón') ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 
                                tx.type.includes('Documento') ? 'bg-purple-50 text-purple-600 border border-purple-100' : 
                                tx.type === 'Consolidación' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 
                                'bg-gray-100 text-gray-600'
                            }`}>
                                {tx.type}
                            </span>
                            {/* Mostramos la descripción exacta si es un pago de buzón (Ej: UPGRADE A PREMIUM) */}
                            {tx.description && (
                                <span className="text-[10px] text-gray-500 mt-1 font-medium">{tx.description}</span>
                            )}
                        </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">{formatDate(tx.date)}</td>
                    
                    {/* Columna Pagado */}
                    <td className="px-6 py-4 font-bold text-green-600">
                        {formatCurrency(tx.amount)}
                    </td>
                    
                    {/* Columna Deuda */}
                    <td className="px-6 py-4 font-bold">
                        {tx.debt > 0 ? (
                            <span className="text-red-500 bg-red-50 px-2 py-1 rounded border border-red-100 text-xs">
                                {formatCurrency(tx.debt)}
                            </span>
                        ) : (
                            <span className="text-gray-300">-</span>
                        )}
                    </td>

                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-gray-50 rounded border border-gray-200 text-[10px] font-bold text-gray-500 uppercase">
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