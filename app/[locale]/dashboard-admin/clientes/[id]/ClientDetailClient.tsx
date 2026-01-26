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
  Image as ImageIcon 
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
                                <th className="p-4 border-b text-right">Peso</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {client.packages.map((pkg: any) => {
                                const hasInvoice = !!pkg.invoiceUrl;
                                const isPdf = pkg.invoiceUrl?.toLowerCase().includes('pdf');

                                return (
                                    <tr key={pkg.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4 font-mono font-bold text-gmc-gris-oscuro">{pkg.gmcTrackingNumber}</td>
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
                                                    className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors border border-blue-200 shadow-sm"
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

                                        <td className="p-4 text-right font-mono text-sm">{pkg.weightLbs} Lbs</td>
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