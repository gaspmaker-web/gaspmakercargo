"use client";

import { useState } from 'react';
import { Loader2, CheckCircle, PackageSearch, Handshake, Printer } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface MailItemPrint {
  id: string;
  ref: string | null;
  senderName: string | null;
  receivedAt: Date | string;
}

interface PickupActionProps {
  taskId: string;
  status: string;
  clientName: string;
  suiteNo: string;
  scheduledDate: string;
  scheduledTime: string;
  mailItems: MailItemPrint[];
}

export default function PickupActionButtons({ 
  taskId, 
  status, 
  clientName, 
  suiteNo, 
  scheduledDate, 
  scheduledTime,
  mailItems 
}: PickupActionProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAction = async (newStatus: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/mailbox/pickup/${taskId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) router.refresh();
    } catch (e) {
      alert("Error al actualizar la tarea");
    } finally {
      setLoading(false);
    }
  };

  // 🔥 FUNCIÓN ENTERPRISE: Genera una vista de impresión limpia en otra pestaña
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Por favor permite las ventanas emergentes (pop-ups) para imprimir.");
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Pick Sheet - Suite ${suiteNo}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 30px; color: #333; }
            .header { border-bottom: 2px solid #222b3c; padding-bottom: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: flex-end; }
            .title { margin: 0; font-size: 24px; color: #222b3c; text-transform: uppercase; font-weight: 900; }
            .company { color: #888; font-size: 12px; font-weight: bold; text-transform: uppercase; }
            .info-block { margin-bottom: 25px; background: #f9f9f9; padding: 15px; border-radius: 8px; border: 1px solid #ddd; }
            .info-block p { margin: 5px 0; font-size: 14px; }
            table { border-collapse: collapse; margin-bottom: 25px; width: 100%; }
            th, td { border: 1px solid #ccc; padding: 10px; text-align: left; font-size: 13px; }
            th { background-color: #222b3c; color: white; text-transform: uppercase; font-size: 11px; }
            .footer { text-align: center; font-size: 11px; color: #666; margin-top: 40px; border-top: 1px dashed #ccc; padding-top: 20px; }
            .checkbox { width: 16px; height: 16px; border: 1px solid #333; display: inline-block; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="title">Hoja de Preparación</h1>
              <p class="company">Gasp Maker Cargo - Inventario de Buzones</p>
            </div>
            <div>
              <p style="margin:0; font-weight:bold; font-size: 14px;">Fecha: ${new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div class="info-block">
            <p><strong>CLIENTE:</strong> ${clientName}</p>
            <p><strong>SUITE:</strong> <span style="font-size: 18px; font-weight: bold;">${suiteNo}</span></p>
            <p><strong>CITA PROGRAMADA:</strong> ${new Date(scheduledDate).toLocaleDateString()} a las ${scheduledTime}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 40px; text-align:center;">Listo</th>
                <th>Tracking / Ref Interna</th>
                <th>Remitente</th>
                <th>Fecha en Bodega</th>
              </tr>
            </thead>
            <tbody>
              ${mailItems.map(item => `
                <tr>
                  <td style="text-align:center;"><div class="checkbox"></div></td>
                  <td style="font-family: monospace; font-weight: bold;">${item.ref || 'S/N'}</td>
                  <td>${item.senderName || 'Desconocido'}</td>
                  <td>${new Date(item.receivedAt).toLocaleDateString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <p style="font-weight: bold; font-size: 14px;">Total de documentos a preparar: ${mailItems.length}</p>

          <div class="footer">
            Documento de uso interno. El empleado debe marcar la casilla "Listo" al encontrar cada sobre físico en la estantería.
            <br><br>Firma del Empleado: __________________________
          </div>
          
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="flex flex-wrap gap-2 w-full md:w-auto mt-4 md:mt-0">
      
      {/* Botón Imprimir (Siempre visible si está pendiente o listo) */}
      <button 
        onClick={handlePrint}
        className="flex-1 md:flex-none bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
      >
        <Printer size={14} /> Imprimir Hoja
      </button>

      {status === "PENDING" && (
        <button 
          onClick={() => handleAction("READY")}
          disabled={loading}
          className="flex-1 md:flex-none bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
        >
          {loading ? <Loader2 className="animate-spin" size={14}/> : <PackageSearch size={14}/>}
          Marcar como Preparado
        </button>
      )}

      {status === "READY" && (
        <button 
          onClick={() => handleAction("COMPLETED")}
          disabled={loading}
          className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md animate-pulse"
        >
          {loading ? <Loader2 className="animate-spin" size={14}/> : <Handshake size={14}/>}
          Confirmar Entrega ($0.00)
        </button>
      )}
    </div>
  );
}