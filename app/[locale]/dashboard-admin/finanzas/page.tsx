import React from 'react';
import ExportButton from './ExportButton';
import FinanzasTable from './FinanzasTable';
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

// 🔥 LA REGLA DE NEGOCIO: 30 Días Gratis
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // ==============================================================================
  // 1. CONSULTAS DE AGREGACIÓN Y PAQUETES MOROSOS
  // ==============================================================================
  
  const [packageStats, packagesInDebt, consolidationStats, pickupStats] = await Promise.all([
    // A. Ingresos de fletes (filtramos los hijos para no duplicar dinero)
    prisma.package.aggregate({
      where: { consolidatedShipmentId: null }, 
      _sum: { shippingTotalPaid: true, shippingSubtotal: true },
      _count: { id: true }
    }),
    // B. 🔥 TRAEMOS LOS PAQUETES MOROSOS PARA CALCULAR LA DEUDA EN VIVO
    prisma.package.findMany({
      where: {
        AND: [
          {
            OR: [
              { storageDebt: { gt: 0 } },
              { status: { contains: 'BLOCK', mode: 'insensitive' } },
              { createdAt: { lt: thirtyDaysAgo } } 
            ]
          },
          { status: { notIn: ['ENTREGADO', 'DELIVERED', 'COMPLETADO', 'ENVIADO', 'SHIPPED'] } }
        ]
      },
      select: { createdAt: true, storageDebt: true, lengthIn: true, widthIn: true, heightIn: true }
    }),
    // C. Consolidaciones
    prisma.consolidatedShipment.aggregate({
      _sum: { totalAmount: true },
      _count: { id: true }
    }),
    // D. Pickups
    prisma.pickupRequest.aggregate({
      _sum: { totalPaid: true, subtotal: true },
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
  
  // 🔥 CÁLCULO DE ALMACENAJE "AL VUELO" (Igual que en Control de Almacenaje)
  let calculatedStorageDebt = 0;
  const msPerDay = 1000 * 60 * 60 * 24;

  packagesInDebt.forEach(p => {
    let debt = p.storageDebt || 0;
    const daysInWarehouse = Math.floor((new Date().getTime() - new Date(p.createdAt).getTime()) / msPerDay);
    
    if (debt === 0 && daysInWarehouse > 30) {
        const length = p.lengthIn || 10;
        const width = p.widthIn || 10;
        const height = p.heightIn || 10;
        const volumeFt3 = (length * width * height) / 1728;
        const monthsOverdue = Math.ceil((daysInWarehouse - 30) / 30);
        debt = monthsOverdue * 2.25 * volumeFt3;
    }
    calculatedStorageDebt += debt;
  });

  const debtStorage = calculatedStorageDebt; // 🔴 La variable final que va a la tarjeta roja
  
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
      // 🔥 MEJORA VISUAL: Si es un cobro de almacenaje, que diga "Almacenaje"
      type: pk.serviceType === 'STORAGE' || pk.serviceType === 'STORAGE_FEE' ? 'Almacenaje' : 'Pickup',
      date: pk.createdAt,
      amount: pk.totalPaid || 0,
      // Usamos Math.max para que la deuda nunca salga negativa
      debt: Math.max(0, (pk.subtotal || 0) - (pk.totalPaid || 0)),
      status: pk.status,
      client: pk.user?.name || pk.user?.email || 'N/A',
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

{/* Tabla con paginación y filtros */}
      <FinanzasTable grandTotal={grandTotalIncome} />

    </div>
  );
}