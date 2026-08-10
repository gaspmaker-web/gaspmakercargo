'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);

const formatDate = (date: string) =>
  new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(date));

interface Transaction {
  id: string;
  type: string;
  date: string;
  amount: number;
  debt: number;
  status: string;
  client: string;
  description?: string | null;
}

interface FinanzasTableProps {
  grandTotal: number;
}

export default function FinanzasTable({ grandTotal }: FinanzasTableProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totals, setTotals] = useState({ carga: 0, pickups: 0, buzon: 0, deuda: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const limit = 25;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        type,
        search,
      });
      const res = await fetch(`/api/admin/finanzas?${params}`);
      const data = await res.json();
      setTransactions(data.transactions || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
      setTotals(data.totals || { carga: 0, pickups: 0, buzon: 0, deuda: 0 });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [page, type, search]);

  useEffect(() => {
    const timer = setTimeout(fetchData, 300);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const typeColors: Record<string, string> = {
    'Paquete': 'bg-gray-100 text-gray-600',
    'Consolidación': 'bg-blue-50 text-blue-600 border border-blue-100',
    'Buzón Virtual': 'bg-indigo-50 text-indigo-600 border border-indigo-100',
    'Pickup': 'bg-orange-50 text-orange-600 border border-orange-100',
    'Almacenaje': 'bg-amber-50 text-amber-600 border border-amber-100',
  };
const translateType = (type: string): string => {
  const map: Record<string, string> = {
    'Paquete': 'Package',
    'Consolidación': 'Consolidation',
    'Buzón Virtual': 'Virtual Mailbox',
    'Pickup': 'Pickup',
    'Almacenaje': 'Storage Fee',
    'Storage Fee': 'Storage Fee',
  };
  return map[type] || type;
};

const translateStatus = (status: string): string => {
  const map: Record<string, string> = {
    'PAGADO': 'PAID',
    'COMPLETADO': 'COMPLETED',
    'PROCESADO': 'PROCESSED',
    'SOLICITUD_CONSOLIDACION': 'CONSOLIDATION REQUEST',
    'PENDIENTE_PAGO': 'PENDING PAYMENT',
    'ENVIADO': 'SHIPPED',
    'RECIBIDO_MIAMI': 'RECEIVED MIAMI',
    'PENDIENTE': 'PENDING',
    'EN_ALMACEN': 'IN WAREHOUSE',
    'EN_TRANSITO': 'IN TRANSIT',
    'EN_REPARTO': 'OUT FOR DELIVERY',
    'ENTREGADO': 'DELIVERED',
    'LISTO_PARA_ENVIO': 'READY TO SHIP',
  };
  return map[status] || status;
};

return (
  <div className="space-y-4">
      {/* KPIs dinámicos por filtro */}
     <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
     <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Global Total</p>
    <p className="text-xl font-bold text-gray-800">{formatCurrency(grandTotal)}</p>
    <p className="text-[10px] text-gray-400 mt-1">All services</p>
    </div>
    <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1">Traditional Cargo</p>
    <p className="text-xl font-bold text-gray-800">{formatCurrency(totals.carga)}</p>
    </div>
    <div className="bg-white p-4 rounded-xl border border-orange-100 shadow-sm">
    <p className="text-[10px] font-bold text-orange-400 uppercase tracking-wider mb-1">Pickups</p>
    <p className="text-xl font-bold text-gray-800">{formatCurrency(totals.pickups)}</p>
     </div>
     <div className="bg-white p-4 rounded-xl border border-purple-100 shadow-sm">
    <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wider mb-1">Virtual Mailbox</p>
    <p className="text-xl font-bold text-gray-800">{formatCurrency(totals.buzon)}</p>
     </div>
     <div className="bg-white p-4 rounded-xl border border-red-100 shadow-sm">
    <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1">Outstanding</p>
    <p className="text-xl font-bold text-red-600">{formatCurrency(totals.deuda)}</p>
      </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header con filtros */}
      <div className="p-6 border-b border-gray-100 bg-gray-50/50">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <h3 className="text-lg font-bold text-gray-800">
         Complete History
        <span className="ml-2 text-sm font-normal text-gray-400">({total} records)</span>
          </h3>
          <div className="flex gap-2 w-full sm:w-auto">
            {/* Búsqueda */}
            <div className="relative flex-1 sm:w-48">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search client..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            {/* Filtro tipo */}
            <div className="relative">
              <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={type}
                onChange={e => { setType(e.target.value); setPage(1); }}
                className="pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
              >
             <option value="all">All</option>
             <option value="package">Packages</option>
             <option value="consolidation">Consolidations</option>
             <option value="pickup">Pickups</option>
             <option value="storage">Storage Fee</option>
             <option value="mailbox">Virtual Mailbox</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white text-xs text-gray-400 font-bold uppercase tracking-wider text-left border-b border-gray-100">
            <tr>
             <th className="px-6 py-4">ID / Tracking</th>
             <th className="px-6 py-4">Client</th>
             <th className="px-6 py-4">Concept</th>
             <th className="px-6 py-4">Date</th>
             <th className="px-6 py-4">Paid</th>
             <th className="px-6 py-4">Debt</th>
             <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 text-sm">
            {loading ? (
              <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-400">Loading...</td></tr>
            ) : transactions.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-400">No results</td></tr>
            ) : (
              transactions.map((tx, i) => (
                <tr key={`${tx.id}-${i}`} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-gray-700 text-xs">{tx.id || 'N/A'}</td>
                  <td className="px-6 py-4 text-gray-600 font-medium">{tx.client}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase w-fit ${typeColors[tx.type] || 'bg-gray-100 text-gray-600'}`}>
                        {translateType(tx.type)}
                      </span>
                      {tx.description && (
                        <span className="text-[10px] text-gray-400">{tx.description}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs">{formatDate(tx.date)}</td>
                  <td className="px-6 py-4 font-bold text-green-600">{formatCurrency(tx.amount)}</td>
                  <td className="px-6 py-4 font-bold">
                    {tx.debt > 0 ? (
                      <span className="text-red-500 bg-red-50 px-2 py-1 rounded border border-red-100 text-xs">
                        {formatCurrency(tx.debt)}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-gray-50 rounded border border-gray-200 text-[10px] font-bold text-gray-500 uppercase">
                      {translateStatus(tx.status)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-400">
            Page {page} of {totalPages} — {total} total records
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
)}
    </div>
    </div>
  );
}