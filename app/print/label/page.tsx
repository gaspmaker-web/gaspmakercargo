"use client";

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { ShippingLabel, LabelData } from '@/components/ShippingLabel';

function PrintLabelContent() {
  const searchParams = useSearchParams();
  const [isReady, setIsReady] = useState(false);

  // 1. LÓGICA DE MEDIDAS EXACTAS
  const formatParam = searchParams.get('format');
  
  // Si la URL dice format=30334 (o mini), usamos las medidas pequeñas.
  // Si no dice nada, usamos 4x6.
  const isMini = formatParam === '30334' || formatParam === 'mini';
  
  const format: '4x6' | '30334' = isMini ? '30334' : '4x6';

  // 🔥 AQUÍ ESTÁN LAS MEDIDAS QUE ME PEDISTE:
  const widthCss = isMini ? '2.25in' : '4in';
  const heightCss = isMini ? '1.25in' : '6in';

  // 2. Reconstrucción de datos
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

  if (!isReady) return <div style={{ padding: 20 }}>Cargando etiqueta...</div>;

  return (
    // 3. Contenedor Principal (ID print-root para aislarlo)
    <div id="print-root" style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'flex-start', 
      minHeight: '100vh',
      margin: 0,
      padding: 0,
      backgroundColor: 'white'
    }}>
      <ShippingLabel data={data} />
      
      {/* 4. ESTILOS GLOBALES DINÁMICOS */}
      <style jsx global>{`
        /* Configuración para la Impresora */
        @page {
          /* Aquí se inyectan tus variables: 4in 6in O 2.25in 1.25in */
          size: ${widthCss} ${heightCss}; 
          margin: 0; 
        }

        html, body {
          margin: 0 !important;
          padding: 0 !important;
          width: 100%;
          height: 100%;
          background-color: white !important;
        }

        /* Bloqueo para IMPRESIÓN */
        @media print {
            body * {
                visibility: hidden; /* Oculta todo lo demás */
            }
            
            #print-root, #print-root * {
                visibility: visible; /* Muestra solo la etiqueta */
            }

            #print-root {
                position: absolute;
                left: 0;
                top: 0;
                /* Fuerza las medidas exactas al imprimir */
                width: ${widthCss} !important;
                height: ${heightCss} !important;
                margin: 0 !important;
                padding: 0 !important;
                overflow: hidden !important; /* Corta cualquier sobrante */
            }
        }
      `}</style>
    </div>
  );
}

export default function PrintLabelPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <PrintLabelContent />
    </Suspense>
  );
}