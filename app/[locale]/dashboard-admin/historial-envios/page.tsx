import prisma from '@/lib/prisma';
import Link from 'next/link';
import { 
  ArrowLeft, Search, FileText, CheckCircle, MapPin, 
  Calendar, ExternalLink, User, Package as PackageIcon, Truck
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function HistorialEnviosPage({
  searchParams,
}: {
  searchParams?: { q?: string };
}) {
  const query = searchParams?.q || '';

  // 1. BÚSQUEDA GLOBAL (Warehouse -> Cliente)
  // Buscamos paquetes que ya han salido del almacén (ENVIADO) o ya llegaron (ENTREGADO)
  const envios = await prisma.package.findMany({
    where: {
      status: { in: ['ENVIADO', 'ENTREGADO', 'DELIVERED', 'COMPLETADO', 'EN_REPARTO', 'OUT_FOR_DELIVERY'] }, 
      OR: query ? [
        { user: { name: { contains: query, mode: 'insensitive' } } },
        { gmcTrackingNumber: { contains: query, mode: 'insensitive' } },
        { finalTrackingNumber: { contains: query, mode: 'insensitive' } }
      ] : undefined
    },
    include: { user: true },
    orderBy: { updatedAt: 'desc' }
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER RESTAURADO */}
        <div className="mb-8">
            <Link 
                href="/dashboard-admin" 
                className="inline-flex items-center text-gray-500 hover:text-blue-600 transition-colors font-medium text-sm mb-2"
            >
                <ArrowLeft size={18} className="mr-2" />
                Volver al Panel
            </Link>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <FileText className="text-blue-600" />
                        Historial Global de Envíos
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Registro completo de salidas: Desde Almacén hasta la Firma del Cliente.
                    </p>
                </div>
                
                <form className="relative">
                    <input 
                        name="q"
                        type="text" 
                        placeholder="Buscar cliente, tracking..." 
                        defaultValue={query}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-72 shadow-sm"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                </form>
            </div>
        </div>

        {/* TABLA UNIFICADA */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-bold border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4">Tracking / ID</th>
                            <th className="px-6 py-4">Cliente / Destino</th>
                            <th className="px-6 py-4">Estado Actual</th>
                            <th className="px-6 py-4 text-center">Prueba de Entrega (POD)</th>
                            <th className="px-6 py-4 text-right">Última Actualización</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {envios.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                                    No se encontraron envíos registrados.
                                </td>
                            </tr>
                        ) : (
                            envios.map((pkg) => {
                                const destino = pkg.user?.country || pkg.user?.countryCode || 'INTL';
                                const statusUpper = pkg.status.toUpperCase();
                                const isDelivered = statusUpper === 'ENTREGADO' || statusUpper === 'DELIVERED' || statusUpper === 'COMPLETADO';
                                const hasSignature = !!pkg.deliverySignature;

                                return (
                                    <tr key={pkg.id} className="hover:bg-blue-50/30 transition-colors group">
                                        
                                        {/* TRACKING */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                                                    <PackageIcon size={18}/>
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-800 font-mono">{pkg.gmcTrackingNumber}</div>
                                                    <div className="text-xs text-gray-400">{pkg.courierService || 'Estándar'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        
                                        {/* CLIENTE */}
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{pkg.user?.name}</div>
                                            <div className="text-xs text-blue-600 font-bold mt-1 flex items-center gap-1">
                                                <MapPin size={10}/> {destino}
                                            </div>
                                        </td>

                                        {/* ESTADO */}
                                        <td className="px-6 py-4">
                                             {isDelivered ? (
                                                <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold border border-green-200">
                                                    <CheckCircle size={12}/> ENTREGADO
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold border border-blue-200">
                                                    <Truck size={12}/> EN TRÁNSITO
                                                </span>
                                            )}
                                        </td>

                                        {/* EVIDENCIA (POD) - SOLUCIÓN AL ERROR DE REDIRECCIÓN */}
                                        <td className="px-6 py-4 text-center">
                                            {isDelivered ? (
                                                <Link 
                                                    // ⭐ CLAVE: Agregamos '?from=admin' para que el botón "Atrás" sepa volver AQUÍ
                                                    href={`/rastreo/${pkg.gmcTrackingNumber}?from=admin`}
                                                    // -----------------------------------------------------------------------
                                                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-all active:scale-95 ${
                                                        hasSignature 
                                                        ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 shadow-sm' 
                                                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                                                    }`}
                                                >
                                                    {hasSignature ? 'VER FIRMA & FOTO' : 'VER FOTO'}
                                                    <ExternalLink size={12}/>
                                                </Link>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">--</span>
                                            )}
                                        </td>

                                        {/* FECHA */}
                                        <td className="px-6 py-4 text-right text-gray-500 text-xs">
                                            {new Date(pkg.updatedAt).toLocaleDateString()}
                                            <div className="text-[10px] opacity-60">{new Date(pkg.updatedAt).toLocaleTimeString()}</div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
}