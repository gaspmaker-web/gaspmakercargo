"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Package, Truck, ArrowRight, CheckCircle, Scale, Box } from 'lucide-react';

interface ProcessConsolidationClientProps {
  consolidation: any; // Tipado laxo para simplificar, idealmente usar Prisma types
}

export default function ProcessConsolidationClient({ consolidation }: ProcessConsolidationClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    weight: 0,
    length: 0,
    width: 0,
    height: 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/admin/consolidate-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consolidationId: consolidation.id,
          finalWeight: formData.weight,
          finalDimensions: {
            length: formData.length,
            width: formData.width,
            height: formData.height
          }
        }),
      });

      if (!res.ok) throw new Error('Error al procesar');

      router.push('/dashboard-admin/consolidaciones'); // Volver a la lista
      router.refresh();
    } catch (error) {
      console.error(error);
      alert('Error al confirmar la consolidación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
      
      {/* Resumen de Paquetes */}
      <div className="mb-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
        <h3 className="font-bold text-blue-800 flex items-center gap-2 mb-3">
          <Package size={20} /> Contenido del Envío ({consolidation.packages.length} paquetes)
        </h3>
        <ul className="space-y-2">
          {consolidation.packages.map((pkg: any) => (
            <li key={pkg.id} className="text-sm text-blue-700 flex justify-between bg-white/50 p-2 rounded border border-blue-100">
              <span>{pkg.gmcTrackingNumber} - {pkg.description}</span>
              <span className="font-mono">{pkg.weightLbs} lbs</span>
            </li>
          ))}
        </ul>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <h3 className="font-bold text-gmc-gris-oscuro text-lg border-b pb-2">Datos Finales del Paquete Consolidado</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Peso Final */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <Scale size={16} /> Peso Total (Lbs)
            </label>
            <input
              type="number"
              step="0.01"
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gmc-dorado-principal outline-none text-lg font-mono"
              value={formData.weight}
              onChange={(e) => setFormData({...formData, weight: parseFloat(e.target.value)})}
            />
          </div>

          {/* Dimensiones */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <Box size={16} /> Dimensiones (L x W x H)
            </label>
            <div className="flex gap-2">
              <input type="number" placeholder="L" className="w-full p-3 border border-gray-300 rounded-lg" onChange={(e) => setFormData({...formData, length: parseFloat(e.target.value)})}/>
              <input type="number" placeholder="W" className="w-full p-3 border border-gray-300 rounded-lg" onChange={(e) => setFormData({...formData, width: parseFloat(e.target.value)})}/>
              <input type="number" placeholder="H" className="w-full p-3 border border-gray-300 rounded-lg" onChange={(e) => setFormData({...formData, height: parseFloat(e.target.value)})}/>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-gmc-gris-oscuro text-white font-bold rounded-xl hover:bg-black transition-all shadow-lg flex items-center gap-2 disabled:opacity-70"
          >
            {loading ? 'Procesando...' : <><CheckCircle size={20} /> Confirmar y Generar Etiqueta</>}
          </button>
        </div>
      </form>
    </div>
  );
}