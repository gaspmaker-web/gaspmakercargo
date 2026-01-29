"use client";

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { ShippingLabel, LabelData } from '@/components/ShippingLabel';

function PrintLabelContent() {
  const searchParams = useSearchParams();
  const [isReady, setIsReady] = useState(false);

  // Leemos el formato (4x6 o 30334)
  const formatParam = searchParams.get('format');
  const format: '4x6' | '30334' = (formatParam === '30334') ? '30334' : '4x6';

  // Reconstruimos los datos del paquete desde la URL
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

  // Definimos el tamaño de la hoja CSS para que la impresora lo detecte
  const pageSizeCss = format === '30334' ? '2.25in 1.25in' : '4in 6in';

  useEffect(() => {
    setIsReady(true);
    // Esperamos un momento breve para asegurar que el código de barras se renderizó
    const timer = setTimeout(() => {
      window.print();
      // Opcional: window.close(); // Si quieres que se cierre sola después de imprimir
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (!isReady) return <div style={{ padding: 20, fontFamily: 'sans-serif' }}>Generando etiqueta...</div>;

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'flex-start', 
      minHeight: '100vh',
      margin: 0,
      padding: 0
    }}>
      <ShippingLabel data={data} />
      
      <style jsx global>{`
        @page {
          size: ${pageSizeCss};
          margin: 0;
        }
        body {
          margin: 0;
          padding: 0;
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