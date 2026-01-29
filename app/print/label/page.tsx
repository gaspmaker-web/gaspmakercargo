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

  // 2. Medidas Exactas
  const widthCss = isMini ? '2.25in' : '4in';
  const heightCss = isMini ? '1.25in' : '6in';

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
      <div id="print-root" className="screen-layout">
        <ShippingLabel data={data} />
      </div>
      
      <style jsx global>{`
        /* --- REGLAS BASE --- */
        @page {
          size: ${widthCss} ${heightCss};
          margin: 0; /* IMPRESCINDIBLE: Elimina márgenes de impresora */
        }

        /* --- VISTA EN PANTALLA --- */
        @media screen {
          html, body {
            background-color: #f0f0f0;
            min-height: 100vh;
          }
          .screen-layout {
            display: flex;
            justify-content: center;
            align-items: flex-start;
            padding-top: 40px;
          }
        }

        /* --- VISTA DE IMPRESIÓN (LA SOLUCIÓN NUCLEAR) --- */
        @media print {
          /* 1. Resetear HTML y BODY para que no tengan altura fantasma */
          html, body {
            width: ${widthCss} !important;
            height: ${heightCss} !important;
            overflow: hidden !important; /* Corta cualquier exceso */
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          /* 2. Ocultar todo lo demás de forma agresiva */
          body * {
            visibility: hidden;
          }

          /* 3. Sacar la etiqueta del flujo normal usando FIXED */
          #print-root {
            visibility: visible !important;
            position: fixed !important; /* <--- ESTO ES LA CLAVE */
            top: 0 !important;
            left: 0 !important;
            z-index: 9999 !important;
            
            /* Forzar medidas exactas */
            width: ${widthCss} !important;
            height: ${heightCss} !important;
            
            margin: 0 !important;
            padding: 0 !important;
            
            /* Asegurar que el contenido interno también se vea */
            display: block !important;
          }
          
          /* Asegurar que los hijos del root también se vean */
          #print-root * {
            visibility: visible !important;
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