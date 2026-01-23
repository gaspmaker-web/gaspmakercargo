"use client";

import React, { useRef, useEffect, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Printer, Loader2 } from 'lucide-react';
import PickupReceipt from '@/components/dashboard/PickupReceipt';

interface PrintPickupReceiptProps {
  data: any; // Los datos de la orden
}

export default function PrintPickupReceipt({ data }: PrintPickupReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);

  // Aseguramos que el componente esté montado antes de permitir imprimir
  useEffect(() => {
    setIsReady(true);
  }, []);

  // 🚨 CORRECCIÓN: Agregamos 'as any' al final del objeto para silenciar el error de TypeScript
  const handlePrint = useReactToPrint({
    content: () => receiptRef.current,
    documentTitle: `GMC-Order-${data.id}`,
    pageStyle: `
      @page {
        size: auto;
        margin: 0mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
        }
      }
    `
  } as any);

  return (
    <>
      {/* Botón de Descarga */}
      <button 
        onClick={handlePrint} 
        disabled={!isReady}
        className="flex items-center gap-2 bg-gmc-gris-oscuro text-white px-6 py-3 rounded-xl font-bold hover:bg-black transition-all shadow-md disabled:opacity-50"
      >
        {!isReady ? <Loader2 className="animate-spin" size={20}/> : <Printer size={20}/>} 
        Descargar Recibo PDF
      </button>

      {/* --- CORRECCIÓN CRÍTICA --- */}
      {/* En lugar de 'display: none', lo sacamos de la pantalla. */}
      {/* Así el navegador lo renderiza y la impresora lo detecta. */}
      <div style={{ position: 'absolute', top: '-10000px', left: '-10000px' }}>
        <div ref={receiptRef}>
            <PickupReceipt data={data} />
        </div>
      </div>
    </>
  );
}