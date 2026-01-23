"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle } from 'lucide-react';

export default function AcceptTaskButton({ taskId }: { taskId: string }) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleAccept = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/driver/accept-task', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ taskId })
            });
            
            if (res.ok) {
                // Éxito: Recargamos para que la tarea pase de "Nuevas" a "Mi Ruta"
                router.refresh(); 
            } else {
                const data = await res.json();
                alert(data.error || "Esta tarea ya no está disponible.");
                router.refresh(); // Alguien más la ganó, refrescamos para quitarla
            }
        } catch (error) {
            console.error("Error al aceptar tarea:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button 
            onClick={handleAccept}
            disabled={loading}
            className="w-full mt-auto bg-black text-white py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-gmc-dorado-principal hover:text-black transition-all active:scale-95 flex justify-center items-center gap-2"
        >
            {loading ? (
                <>
                    <Loader2 className="animate-spin" size={16}/>
                    <span>Procesando...</span>
                </>
            ) : (
                <>
                    <CheckCircle size={16}/>
                    ACEPTAR VIAJE
                </>
            )}
        </button>
    );
}