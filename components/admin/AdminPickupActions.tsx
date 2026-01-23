'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PackageCheck, Loader2, AlertCircle, Scale, Layers } from 'lucide-react';

interface Props {
  pickupId: string;
  status: string;
  serviceType?: string;
}

export default function AdminPickupActions({ pickupId, status, serviceType = 'SHIPPING' }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);

  // 1. Detectar si es Delivery Local
  const isDelivery = serviceType?.toUpperCase() === 'DELIVERY';

  // 2. 🔥 CORRECCIÓN: Agregar 'ENTREGADO' a los estados permitidos
  const canReceive = (status === 'COMPLETADO' || status === 'EN_CAMINO' || status === 'ENTREGADO') && !isDelivery;

  // Manejo de Estados:

  // A. Si ya se procesó, mensaje verde de éxito
  if (status === 'PROCESADO') {
      return (
        <div className="bg-green-50 text-green-700 p-4 rounded-xl border border-green-200 flex items-center gap-3 mt-6">
            <PackageCheck size={20} />
            <span className="text-sm font-bold">Esta solicitud ya fue convertida a Paquete(s).</span>
        </div>
      );
  }

  // B. Si es Delivery Local, ocultamos todo (no requiere recepción)
  if (isDelivery) {
      return null;
  }

  // C. Si no está listo para recibir (y no es delivery), mensaje de espera
  if (!canReceive) {
    return (
      <div className="bg-orange-50 text-orange-700 p-4 rounded-xl border border-orange-200 flex items-center gap-3 mt-6">
        <AlertCircle size={20} />
        <span className="text-sm font-medium">
            Esperando llegada a almacén... (Estado actual: {status})
        </span>
      </div>
    );
  }

  // D. Formulario de Recepción (Solo si es Shipping y el chofer ya llegó)
  const handleReceive = async () => {
    const confirmed = window.confirm(
      `¿Confirmas la recepción de ${quantity} bulto(s)?\n\nSe generarán ${quantity} recibos separados y el Pickup se marcará como PROCESADO.`
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      const res = await fetch('/api/admin/convert-pickup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            pickupId, 
            quantity: Number(quantity) 
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Error al procesar');

      if (quantity === 1) {
          alert(`✅ Recibo generado: ${data.trackingNumbers[0]}. Redirigiendo a medición...`);
          router.push(`/dashboard-admin/paquetes?q=${data.trackingNumbers[0]}`); 
      } else {
          alert(`✅ ${quantity} Recibos generados correctamente.`);
          router.push('/dashboard-admin/paquetes'); 
      }
      
      router.refresh();

    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 mt-6 animate-fadeIn">
      <h3 className="text-lg font-bold text-gray-800 mb-4 font-garamond flex items-center gap-2">
        <Scale className="text-gmc-dorado-principal" /> Recepción en Almacén
      </h3>
      
      <p className="text-sm text-gray-500 mb-4">
        Ingresa cuántos bultos físicos entregó el chofer para esta solicitud.
      </p>

      <div className="mb-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
        <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Cantidad de Piezas/Bolsas</label>
        <div className="flex items-center gap-3">
            <input 
                type="number" 
                min="1" 
                max="20"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-20 p-2 border border-gray-300 rounded-lg text-center font-bold text-xl focus:ring-2 focus:ring-gmc-dorado-principal outline-none"
            />
            <span className="text-sm text-gray-500 leading-tight">
                Se crearán {quantity} registros <br/> independientes.
            </span>
        </div>
      </div>

      <button
        onClick={handleReceive}
        disabled={loading || quantity < 1}
        className="w-full bg-gmc-gris-oscuro text-white font-bold py-4 rounded-xl hover:bg-black transition-all flex items-center justify-center gap-3 shadow-md active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin" /> Procesando...
          </>
        ) : (
          <>
            {quantity > 1 ? <Layers size={24}/> : <PackageCheck size={24} />} 
            Generar {quantity} {quantity > 1 ? 'Recibos' : 'Recibo'}
          </>
        )}
      </button>
    </div>
  );
}