'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Loader2, Play } from 'lucide-react';

export default function ReceiveShipmentButton({ shipmentId, currentStatus }: { shipmentId: string, currentStatus: string }) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleReceive = async () => {
        if(!confirm("¿Confirmas que recibiste esta caja consolidada en el almacén de destino?")) return;
        
        setLoading(true);
        try {
            // 🔥 CORRECCIÓN: Apuntamos a la API que SÍ existe: /api/admin/packages/dispatch
            const res = await fetch('/api/admin/packages/dispatch', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ 
                    packageId: shipmentId, 
                    type: 'CONSOLIDATION',
                    action: 'RECEIVE_IN_DESTINATION' // 👈 Esta es la clave para que la API sepa qué hacer
                })
            });

            if (res.ok) {
                alert("✅ Consolidación recibida. Estado: EN REPARTO");
                router.refresh();
            } else {
                try {
                    const data = await res.json();
                    alert("Error: " + (data.message || "Hubo un error al actualizar."));
                } catch (e) {
                    alert("Hubo un error al actualizar (Error de servidor).");
                }
            }
        } catch (error) {
            console.error(error);
            alert("Error de conexión. Verifica que la ruta /api/admin/packages/dispatch exista.");
        } finally {
            setLoading(false);
        }
    };

    // Si ya fue recibido
    if (currentStatus === 'EN_ALMACEN_DESTINO' || currentStatus === 'EN_REPARTO' || currentStatus === 'ENTREGADO') {
        return (
            <button disabled className="bg-green-100 text-green-800 px-6 py-3 rounded-lg font-bold flex items-center gap-2 cursor-not-allowed opacity-80">
                <CheckCircle size={20} /> YA RECIBIDO / EN RUTA
            </button>
        );
    }

    return (
        <button 
            onClick={handleReceive}
            disabled={loading}
            className="bg-gmc-dorado-principal hover:bg-yellow-500 text-white px-6 py-3 rounded-lg font-bold shadow-md transition-all flex items-center gap-2"
        >
            {loading ? <Loader2 className="animate-spin" /> : <Play size={20} fill="currentColor" />}
            RECIBIR (SACAR A REPARTO)
        </button>
    );
}