"use client";

import React, { useRef, useEffect, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Printer, Loader2 } from 'lucide-react';
import PickupReceipt from '@/components/dashboard/PickupReceipt';

interface PrintPickupReceiptProps {
  data: any; 
}

export default function PrintPickupReceipt({ data }: PrintPickupReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, []);

  // 🚨 CORRECCIÓN: Agregamos 'as any' para evitar que TypeScript reclame por la propiedad 'content'
  const handlePrint = useReactToPrint({
    content: () => receiptRef.current,
    documentTitle: `GMC-Order-${data.id}`,
    removeAfterPrint: true,
    pageStyle: `
      @page {
        size: A4;
        margin: 0;
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
      <button 
        onClick={handlePrint} 
        disabled={!isReady}
        className="flex items-center gap-2 bg-gmc-gris-oscuro text-white px-6 py-3 rounded-xl font-bold hover:bg-black transition-all shadow-md disabled:opacity-50"
      >
        {!isReady ? <Loader2 className="animate-spin" size={20}/> : <Printer size={20}/>} 
        Descargar Recibo PDF
      </button>

      {/* TRUCO: Posicionamiento absoluto fuera de pantalla con ANCHO FIJO.
         Si no le damos ancho, al estar fuera de pantalla puede renderizarse con ancho 0.
      */}
      <div style={{ position: 'absolute', top: '-10000px', left: '-10000px', width: '210mm', minHeight: '297mm' }}>
        <div ref={receiptRef}>
            <PickupReceipt data={data} />
        </div>
      </div>
    </>
  );
}