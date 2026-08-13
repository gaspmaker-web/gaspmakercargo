"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

interface Props {
    shipmentId: string;
    currentStatus: string;
    countryName: string;
}

export default function ReceiveShipmentButton({ shipmentId, currentStatus, countryName }: Props) {
    const [loading, setLoading] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const router = useRouter();

    const handleReceive = async () => {
        setConfirming(false);
        setLoading(true);
        try {
            const res = await fetch('/api/admin/packages/update-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    packageId: shipmentId,
                    newStatus: 'EN_REPARTO'
                })
            });

            if (res.ok) {
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

    if (currentStatus === 'EN_ALMACEN_DESTINO' || currentStatus === 'EN_REPARTO' || currentStatus === 'ENTREGADO' || currentStatus === 'COMPLETADO') {
        return (
            <button disabled className="bg-green-100 text-green-800 px-6 py-3 rounded-lg font-bold flex items-center gap-2 cursor-not-allowed opacity-80">
                <CheckCircle size={20} /> YA RECIBIDO / EN RUTA
            </button>
        );
    }

    // ✅ Confirmación en React — sin confirm() nativo que bloquea el hilo
    if (confirming) {
        return (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle size={18} className="text-yellow-600 shrink-0" />
                <p className="text-sm font-bold text-yellow-800 flex-1">
                    Confirm that you received in {countryName} and it's out for delivery?
                </p>
                <button
                    onClick={handleReceive}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-green-700 transition"
                >
                    ✅ Sí, confirmar
                </button>
                <button
                    onClick={() => setConfirming(false)}
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-bold text-sm hover:bg-gray-300 transition"
                >
                    Cancelar
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={() => setConfirming(true)}
            disabled={loading}
            className="bg-gmc-dorado-principal hover:bg-yellow-500 text-white px-6 py-3 rounded-lg font-bold shadow-md transition-all flex items-center gap-2"
        >
            {loading ? <Loader2 className="animate-spin" /> : <Play size={20} fill="currentColor" />}
            {loading ? 'Procesando...' : 'RECIBIR (SACAR A REPARTO)'}
        </button>
    );
}