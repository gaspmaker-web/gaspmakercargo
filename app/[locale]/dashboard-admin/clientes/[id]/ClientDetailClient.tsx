"use client";

import Link from 'next/link';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Package, 
  FileText, 
  AlertCircle, 
  ExternalLink, 
  Image as ImageIcon,
  AlertTriangle,
  Edit
} from 'lucide-react';

export default function ClientDetailClient({ client, locale }: { client: any, locale: string }) {
  return (
    <div className="min-h-screen bg-gray-50 p-6 font-montserrat">
      <div className="max-w-6xl mx-auto">
        
        <div className="mb-6">
          {/* 🔥 CORREGIDO: Apunta a 'clientes' en lugar de 'usuarios' */}
          <Link 
            href={`/${locale}/dashboard-admin/clientes`}
            className="inline-flex items-center text-gray-500 hover:text-gmc-dorado-principal transition-colors font-bold"
          >
            <ArrowLeft size={20} className="mr-2" /> Volver a la lista
          </Link>
        </div>

        {/* Tarjeta Cliente */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8 flex flex-col md:flex-row justify-between gap-6">
            <div className="flex items-start gap-4">
                <div className="h-16 w-16 bg-gmc-gris-oscuro text-gmc-dorado-principal rounded-full flex items-center justify-center text-2xl font-bold shadow-md">
                    {client.name?.[0] || 'C'}
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gmc-gris-oscuro font-garamond">{client.name}</h1>
                    <span className="bg-gmc-dorado-principal/20 text-gmc-gris-oscuro px-3 py-1 rounded-full text-xs font-bold border border-gmc-dorado-principal">Suite: {client.suiteNo}</span>
                </div>
            </div>
            <div className="space-y-2 text-sm text-gray-600 min-w-[250px]">
                <div className="flex items-center gap-2"><Mail size={16} className="text-gmc-dorado-principal"/> {client.email}</div>
                <div className="flex items-center gap-2"><Phone size={16} className="text-gmc-dorado-principal"/> {client.phone || 'No registrado'}</div>
                <div className="flex items-center gap-2"><MapPin size={16} className="text-gmc-dorado-principal"/> {client.countryCode || 'N/A'}</div>
            </div>
        </div>

        {/* Tabla */}
        <h2 className="text-xl font-bold text-gmc-gris-oscuro mb-4 flex items-center gap-2">
            <Package className="text-gmc-dorado-principal" /> Paquetes e Invoices
        </h2>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {client.packages.length === 0 ? (
                <div className="p-10 text-center text-gray-400">Este cliente no tiene paquetes registrados.</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold">
                            <tr>
                                <th className="p-4 border-b">Tracking</th>
                                <th className="p-4 border-b">Descripción</th>
                                <th className="p-4 border-b">Estado</th>
                                <th className="p-4 border-b text-center">Documento</th>
                                <th className="p-4 border-b text-center">Valor</th>
                                <th className="p-4 border-b text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {client.packages.map((pkg: any) => {
                                const hasInvoice = !!pkg.invoiceUrl;
                                const isPdf = pkg.invoiceUrl?.toLowerCase().includes('pdf');
                                // Identificamos si el servidor marcó este paquete como "Huérfano de precio"
                                const needsPrice = pkg.needsPriceUpdate;

                                return (
                                    <tr 
                                        key={pkg.id} 
                                        className={`transition-colors ${needsPrice ? 'bg-red-50/40 hover:bg-red-50/80' : 'hover:bg-gray-50'}`}
                                    >
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1.5 items-start">
                                                <span className="font-mono font-bold text-gmc-gris-oscuro">
                                                    {pkg.gmcTrackingNumber}
                                                </span>
                                                {/* 🔥 ALERTA VISUAL DE PRECIO FALTANTE */}
                                                {needsPrice && (
                                                    <span className="bg-red-500 text-white text-[9px] px-2 py-0.5 rounded-full font-bold animate-pulse flex items-center gap-1 shadow-sm uppercase tracking-wider">
                                                        <AlertTriangle size={10} /> Falta Precio
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        
                                        <td className="p-4 text-sm text-gray-600">{pkg.description || '-'}</td>
                                        
                                        <td className="p-4">
                                            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                                                {pkg.status.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        
                                        <td className="p-4 text-center">
                                            {hasInvoice ? (
                                                <a 
                                                    href={pkg.invoiceUrl!} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border shadow-sm ${
                                                        needsPrice 
                                                            ? 'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200' 
                                                            : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200'
                                                    }`}
                                                >
                                                    {isPdf ? <FileText size={14} /> : <ImageIcon size={14} />}
                                                    {isPdf ? "Ver PDF" : "Ver Imagen"}
                                                    <ExternalLink size={12} className="opacity-50"/>
                                                </a>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-gray-400 text-xs bg-gray-100 px-2 py-1 rounded border border-gray-200">
                                                    <AlertCircle size={12} /> Pendiente
                                                </span>
                                            )}
                                        </td>

                                        {/* 🔥 NUEVA COLUMNA: MUESTRA EL VALOR DECLARADO */}
                                        <td className="p-4 text-center">
                                            <span className={`font-mono font-bold text-sm ${needsPrice ? 'text-red-500' : 'text-gray-600'}`}>
                                                ${(pkg.declaredValue || 0).toFixed(2)}
                                            </span>
                                        </td>

                                        {/* 🔥 ACCIÓN RÁPIDA: IR A EDITAR EL PAQUETE */}
                                        <td className="p-4 text-right">
                                            <Link 
                                                href={`/${locale}/dashboard-admin/paquetes/${pkg.id}`}
                                                className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg transition-all border ${
                                                    needsPrice 
                                                        ? 'bg-red-600 text-white hover:bg-red-700 border-red-700 shadow-md'
                                                        : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-200'
                                                }`}
                                            >
                                                <Edit size={14} /> {needsPrice ? 'Poner Precio' : 'Editar'}
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}