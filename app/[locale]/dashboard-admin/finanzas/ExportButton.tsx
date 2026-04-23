"use client";

import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';

export default function ExportButton({ transactions }: { transactions: any[] }) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    setIsExporting(true);

    try {
      // 1. Cabeceras del Excel
      const headers = ['ID/Tracking', 'Cliente', 'Concepto', 'Descripción', 'Fecha', 'Pagado (USD)', 'Deuda (USD)', 'Estado'];

      // 2. Formatear las filas para Excel
      const rows = transactions.map(tx => {
        const dateStr = new Date(tx.date).toLocaleDateString('es-ES');
        return [
          `"${tx.id || ''}"`,
          `"${(tx.client || '').replace(/"/g, '""')}"`, // Evita que comillas en el nombre rompan el archivo
          `"${tx.type || ''}"`,
          `"${(tx.description || '').replace(/"/g, '""')}"`,
          `"${dateStr}"`,
          `${tx.amount || 0}`, // Números limpios para que Excel pueda sumarlos
          `${tx.debt || 0}`,
          `"${tx.status || ''}"`
        ].join(',');
      });

      // 3. Unir todo (el '\uFEFF' es un truco para que Excel lea los acentos y las ñ correctamente)
      const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');

      // 4. Forzar la descarga
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `GMC_Finanzas_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error("Error exportando CSV:", error);
      alert("Error al armar el reporte de Excel.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors shadow-sm font-medium text-sm disabled:opacity-50"
    >
      {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
      <span>{isExporting ? 'Exportando...' : 'Exportar Reporte'}</span>
    </button>
  );
}