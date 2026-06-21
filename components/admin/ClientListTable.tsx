import React from 'react';
import Link from 'next/link';
import { Eye, User, UploadCloud } from 'lucide-react'; // 1. Agregamos UploadCloud

// Definimos la interfaz incluyendo el contador opcional
interface Client {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: Date;
  suiteNo: string | null;
  pendingInvoicesCount?: number; // 2. Nueva propiedad opcional
}

interface ClientListTableProps {
  clients: Client[];
  locale: string;
}

export default function ClientListTable({ clients, locale }: ClientListTableProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          
          {/* Cabecera */}
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Nombre</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Fecha Registro</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Rol</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Acciones</th>
            </tr>
          </thead>

          {/* Cuerpo */}
          <tbody className="divide-y divide-gray-100">
            {clients.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-400">
                  No se encontraron clientes.
                </td>
              </tr>
            ) : (
              clients.map((client) => (
                <tr key={client.id} className="hover:bg-blue-50/50 transition-colors group">
                  
                  {/* Nombre + Suite + Badge de Alerta */}
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold group-hover:bg-white group-hover:text-gmc-dorado-principal transition-colors">
                         {client.name ? client.name[0].toUpperCase() : <User size={18}/>}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gmc-gris-oscuro">{client.name || 'Sin Nombre'}</p>
                          
                          {/* 3. 🔥 BADGE DE ALERTA DINÁMICO */}
                          {client.pendingInvoicesCount && client.pendingInvoicesCount > 0 && (
                            <span className="bg-red-500 text-white text-[9px] px-2 py-0.5 rounded-full font-bold animate-pulse flex items-center gap-0.5">
                              <UploadCloud size={10} /> {client.pendingInvoicesCount}
                            </span>
                          )}
                        </div>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200">
                          {client.suiteNo || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="p-4 text-sm text-gray-600 font-medium">
                    {client.email}
                  </td>

                  {/* Fecha */}
                  <td className="p-4 text-sm text-gray-500">
                    {new Date(client.createdAt).toLocaleDateString()}
                  </td>

                  {/* Rol */}
                  <td className="p-4">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                      client.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                      client.role === 'WAREHOUSE' ? 'bg-orange-100 text-orange-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {client.role}
                    </span>
                  </td>

                  {/* Botón Acción */}
                  <td className="p-4 text-center">
                    <Link 
                      href={`/${locale}/dashboard-admin/clientes/${client.id}`}
                      className="inline-flex items-center gap-2 text-sm font-bold text-gmc-dorado-principal hover:text-gmc-gris-oscuro hover:underline transition-all"
                    >
                      <Eye size={18} /> Ver Detalles
                    </Link>
                  </td>

                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}