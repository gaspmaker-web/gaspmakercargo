"use client";

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { ShippingLabel, LabelData } from '@/components/ShippingLabel';

function PrintLabelContent() {
  const searchParams = useSearchParams();
  const [isReady, setIsReady] = useState(false);

  // 1. Detectar Formato
  const formatParam = searchParams.get('format');
  const isMini = formatParam === '30334' || formatParam === 'mini';
  const format: '4x6' | '30334' = isMini ? '30334' : '4x6';

  // 2. Medidas
  const widthCss = isMini ? '2.25in' : '4in';
  const heightCss = isMini ? '1.25in' : '6in';

  // 3. Datos
  const data: LabelData = {
    tracking: searchParams.get('tracking') || '',
    clientName: searchParams.get('clientName') || '',
    suite: searchParams.get('suite') || '',
    weight: parseFloat(searchParams.get('weight') || '0'),
    countryCode: searchParams.get('countryCode') || '',
    date: searchParams.get('date') || '',
    description: searchParams.get('description') || '',
    format: format,
  };

  useEffect(() => {
    setIsReady(true);
    const timer = setTimeout(() => {
      window.print();
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  if (!isReady) return <div className="p-4">Cargando...</div>;

  return (
    <>
      {/* Usamos una CLASE en lugar de estilos en línea para poder anularla al imprimir */}
      <div id="print-root" className="screen-layout">
        <ShippingLabel data={data} />
      </div>
      
      <style jsx global>{`
        /* --- REGLAS BASE --- */
        @page {
          size: ${widthCss} ${heightCss};
          margin: 0;
        }

        html, body {
          margin: 0;
          padding: 0;
          background-color: white;
        }

        /* --- VISTA EN PANTALLA (Tu monitor) --- */
        @media screen {
          /* Solo en pantalla usamos flex y altura completa para centrarlo */
          .screen-layout {
            display: flex;
            justify-content: center;
            align-items: flex-start; /* Alineado arriba para evitar problemas */
            padding-top: 20px;
            min-height: 100vh; /* Esto es lo que causaba las 5 páginas, aquí solo afecta a pantalla */
            background-color: #f0f0f0;
          }
        }

        /* --- VISTA DE IMPRESIÓN (La impresora) --- */
        @media print {
          /* 1. Ocultamos todo */
          body * {
            visibility: hidden;
            height: 0; /* Colapsamos alturas */
          }

          /* 2. Mostramos solo la etiqueta */
          #print-root, #print-root * {
            visibility: visible;
            height: auto; /* Restauramos altura natural */
          }

          /* 3. Posicionamiento ABSOLUTO y ESTRICTO */
          #print-root {
            position: absolute;
            top: 0;
            left: 0;
            width: ${widthCss} !important;
            height: ${heightCss} !important;
            
            /* 🔥 ESTAS 3 LINEAS SON LA CLAVE PARA 1 SOLA PÁGINA: */
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important; /* Corta cualquier cosa que sobre */
            
            display: block !important; /* Quitamos el flex que centra */
          }
        }
      `}</style>
    </>
  );
}

export default function PrintLabelPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <PrintLabelContent />
    </Suspense>
  );
}