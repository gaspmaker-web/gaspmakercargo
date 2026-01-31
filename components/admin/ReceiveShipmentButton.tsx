'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Loader2, Play } from 'lucide-react';

// 🔥 MODIFICADO: Agregamos prop 'countryName' para mostrar el país
export default function ReceiveShipmentButton({ 
    shipmentId, 
    currentStatus,
    countryName = "Destino" // Valor por defecto si no viene el país
}: { 
    shipmentId: string, 
    currentStatus: string,
    countryName?: string
}) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleReceive = async () => {
        // 🔥 MODIFICADO: Confirmación visual con el nombre del país
        if(!confirm(`¿Confirmas que recibiste esta caja consolidada físicamente en ${countryName} y sale a reparto?`)) return;
        
        setLoading(true);
        try {
            // 🔥 MODIFICADO: Apuntamos a 'update-status' para activar al Driver
            const res = await fetch('/api/admin/packages/update-status', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ 
                    packageId: shipmentId,
                    newStatus: 'EN_REPARTO' // 👈 ESTO ACTIVA AL DRIVER
                })
            });

            if (res.ok) {
                alert(`✅ Recibido en ${countryName}. Estado: EN REPARTO`);
                router.refresh();
            } else {
                alert("Hubo un error al actualizar.");
            }
        } catch (error) {
            console.error(error);
            alert("Error de conexión");
        } finally {
            setLoading(false);
        }
    };

    // Si ya fue recibido (Agregamos 'COMPLETADO' por seguridad)
    if (currentStatus === 'EN_ALMACEN_DESTINO' || currentStatus === 'EN_REPARTO' || currentStatus === 'ENTREGADO' || currentStatus === 'COMPLETADO') {
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
            {/* 🔥 MODIFICADO: Muestra el país en el botón */}
            RECIBIR EN {countryName.toUpperCase()} (SACAR A REPARTO)
        </button>
    );
}