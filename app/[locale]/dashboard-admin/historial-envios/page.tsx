import prisma from '@/lib/prisma';
import Link from 'next/link';
import { 
  ArrowLeft, Search, FileText, CheckCircle, MapPin, 
  ExternalLink, Package as PackageIcon, Truck, UploadCloud, FileCheck, Layers
} from 'lucide-react';
// 🔥 Importamos tu componente universal
import ScanUploadForm from '../solicitudes-escaneo/ScanUploadForm';

export const dynamic = 'force-dynamic';

// 🔥 FUNCIÓN DE PAÍS: Extrae BB, TT, etc. de la dirección de entrega
const getDestinationCode = (pkg: any) => {
    const address = pkg.shippingAddress;
    const userCountry = pkg.user?.country || pkg.user?.countryCode || 'INTL';
    if (!address) return userCountry;
    const matchBeforeTel = address.match(/([A-Z]{2})\s*\|\s*Tel:/i);
    if (matchBeforeTel && matchBeforeTel[1]) return matchBeforeTel[1].toUpperCase();
    const matchEnd = address.match(/,\s*([A-Z]{2})\s*(?:\||$)/);
    if (matchEnd && matchEnd[1]) return matchEnd[1].toUpperCase();
    return userCountry;
};

export default async function HistorialEnviosPage({
  searchParams,
}: {
  searchParams?: { q?: string };
}) {
  const query = searchParams?.q || '';

  // 1. BUSCAMOS TODAS LAS CONSOLIDACIONES PAGADAS
  const enviosConsolidados = await prisma.consolidatedShipment.findMany({
    where: {
      status: { in: ['ENVIADO', 'ENTREGADO', 'DELIVERED', 'COMPLETADO', 'EN_REPARTO', 'OUT_FOR_DELIVERY'] },
      OR: query ? [
        { user: { name: { contains: query, mode: 'insensitive' } } },
        { gmcShipmentNumber: { contains: query, mode: 'insensitive' } }
      ] : undefined
    },
    include: { user: true },
  });

  // 2. BUSCAMOS TODOS LOS PAQUETES
  const enviosPaquetes = await prisma.package.findMany({
    where: {
      status: { in: ['ENVIADO', 'ENTREGADO', 'DELIVERED', 'COMPLETADO', 'EN_REPARTO', 'OUT_FOR_DELIVERY'] }, 
      OR: query ? [
        { user: { name: { contains: query, mode: 'insensitive' } } },
        { gmcTrackingNumber: { contains: query, mode: 'insensitive' } },
        { finalTrackingNumber: { contains: query, mode: 'insensitive' } }
      ] : undefined
    },
    include: { user: true },
  });

  // 3. UNIFICAMOS TODO Y DEFINIMOS LAS RUTAS CORRECTAS
  const enviosUnificados = [
    ...enviosPaquetes.map(p => ({
      id: p.id,
      tracking: p.gmcTrackingNumber,
      status: p.status,
      updatedAt: p.updatedAt,
      user: p.user,
      destino: getDestinationCode(p),
      servicio: p.courierService || 'Estándar',
      hasSignature: !!p.deliverySignature,
      awbUrl: p.awbDocumentUrl,
      isConsolidated: false,
      detailsHref: `/dashboard-admin/paquetes/${p.id}`
    })),
    ...enviosConsolidados.map(c => ({
      id: c.id,
      tracking: c.gmcShipmentNumber,
      status: c.status,
      updatedAt: c.updatedAt,
      user: c.user,
      destino: getDestinationCode(c),
      servicio: c.courierService || 'Consolidación Master',
      hasSignature: false,
      awbUrl: c.awbDocumentUrl,
      isConsolidated: true,
      detailsHref: `/dashboard-admin/shipments/${c.id}`
    }))
  ].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        
        <div className="mb-8">
            <Link href="/dashboard-admin" className="inline-flex items-center text-gray-500 hover:text-blue-600 transition-colors font-medium text-sm mb-2">
                <ArrowLeft size={18} className="mr-2" /> Volver al Panel
            </Link>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <FileText className="text-blue-600" /> Historial Global de Envíos
                    </h1>
                </div>
                <form className="relative">
                    <input name="q" type="text" placeholder="Buscar..." defaultValue={query} className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-72 shadow-sm" />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                </form>
            </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4">TRACKING / ID</th>
                            <th className="px-6 py-4">CLIENTE / DESTINO</th>
                            <th className="px-6 py-4">ESTADO ACTUAL</th>
                            <th className="px-6 py-4 text-center">DOCS ADUANA (AWB)</th>
                            <th className="px-6 py-4 text-center">PRUEBA DE ENTREGA (POD)</th>
                            <th className="px-6 py-4 text-right">ACTUALIZACIÓN</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {enviosUnificados.map((envio) => {
                            const isDelivered = envio.status.toUpperCase().includes('ENTREGADO') || envio.status.toUpperCase() === 'DELIVERED';
                            return (
                                <tr key={envio.id} className="hover:bg-blue-50/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${envio.isConsolidated ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'}`}>
                                                {envio.isConsolidated ? <Layers size={18}/> : <PackageIcon size={18}/>}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-800 font-mono">
                                                    <Link 
                                                        href={envio.detailsHref}
                                                        className="hover:text-blue-600 hover:underline transition-colors"
                                                    >
                                                        {envio.tracking}
                                                    </Link>
                                                    {envio.isConsolidated && <span className="ml-2 text-[9px] bg-purple-200 text-purple-800 px-1.5 py-0.5 rounded uppercase font-bold tracking-tighter">MASTER</span>}
                                                </div>
                                                <div className="text-[11px] text-gray-400 leading-tight">{envio.servicio}</div>
                                            </div>
                                        </div>
                                    </td>
                                    
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{envio.user?.name}</div>
                                        <div className="text-[11px] text-blue-600 font-bold mt-1 flex items-center gap-1 uppercase"><MapPin size={10}/> {envio.destino}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${isDelivered ? 'bg-green-100 text-green-700 border-green-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
                                            {envio.status.replace(/_/g, ' ')}
                                        </span>
                                    </td>

                                    {/* 🔥 INTEGRAMOS EL COMPONENTE SCANUPLOADFORM AQUÍ */}
                                    <td className="px-6 py-4 text-center">
                                        {envio.awbUrl ? (
                                            <a href={envio.awbUrl} target="_blank" className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-[10px] font-bold border border-blue-200 hover:bg-blue-100 transition-all">
                                                <FileCheck size={14}/> VER AWB
                                            </a>
                                        ) : (
                                            <ScanUploadForm 
                                                id={envio.id} 
                                                type={envio.isConsolidated ? 'CONSOLIDATED' : 'PACKAGE'} 
                                            />
                                        )}
                                    </td>

                                    <td className="px-6 py-4 text-center">
                                        {isDelivered ? (
                                            <Link href={`/rastreo/${envio.tracking}?from=admin`} className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold border ${envio.hasSignature ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                                {envio.hasSignature ? 'VER FIRMA & FOTO' : 'VER FOTO'} <ExternalLink size={12}/>
                                            </Link>
                                        ) : <span className="text-[10px] text-gray-400 italic">--</span>}
                                    </td>
                                    <td className="px-6 py-4 text-right text-gray-500 text-[10px]">
                                        <div className="font-bold">{new Date(envio.updatedAt).toLocaleDateString()}</div>
                                        <div className="opacity-60">{new Date(envio.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
}