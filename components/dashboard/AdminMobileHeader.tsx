'use client';

import { useRouter, usePathname } from 'next/navigation';
import { ArrowLeft, Bell } from 'lucide-react';
import Link from 'next/link';

const PAGE_TITLES: Record<string, string> = {
  'paquetes': 'Packages',
  'consolidaciones': 'Consolidations',
  'clientes': 'Clients',
  'finanzas': 'Finances',
  'configuracion': 'Settings',
  'leads': 'Facebook Leads',
  'compras': 'Personal Shopper',
  'referidos': 'Referral Control',
  'catalogo': 'Amazon Catalog',
  'crear-envio': 'Create Shipment',
  'pay-and-go': 'Pay & Go',
  'historial-envios': 'Global History',
  'monitor-envios': 'Live Monitor',
  'buzones-kyc': 'KYC Approvals',
  'tareas-buzon': 'Mailbox Tasks',
  'recepcion-buzones': 'Warehouse Reception',
  'inventario-buzones': 'Physical Inventory',
  'pagos-almacenaje': 'Storage Control',
  'solicitudes-pickup': 'Pickup Requests',
  'shipments': 'Shipments',
};

export default function AdminMobileHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const segments = pathname.split('/');
  const lastSegment = segments[segments.length - 1];
  const isDashboardHome = lastSegment === 'dashboard-admin';

  // Obtener locale
  const validLocales = ['es', 'en', 'fr', 'pt'];
  const locale = validLocales.includes(segments[1]) ? segments[1] : 'es';

  const title = PAGE_TITLES[lastSegment] || 'Dashboard';

  return (
    <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-100 h-14 flex items-center px-4 shadow-sm">
      
      {/* Izquierda — volver o logo */}
      {isDashboardHome ? (
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-gmc-gris-oscuro font-garamond">GaspMaker</span>
        </div>
      ) : (
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-gray-600 hover:text-gmc-gris-oscuro font-bold text-sm"
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
      )}

      {/* Centro — título */}
      {!isDashboardHome && (
        <span className="absolute left-1/2 -translate-x-1/2 text-sm font-bold text-gmc-gris-oscuro truncate max-w-[180px]">
          {title}
        </span>
      )}

      {/* Derecha — notificaciones */}
      <div className="ml-auto flex items-center gap-2">
        <Link
          href={`/${locale}/dashboard-admin/paquetes?filter=pagados`}
          className="relative p-2 rounded-full bg-gray-50 text-gray-500 hover:bg-gray-100"
        >
          <Bell size={18} />
        </Link>
      </div>
    </div>
  );
}