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
}, []);

const handlePrint = () => {
  window.print();
};

const handleDownloadPDF = async () => {
  const { jsPDF } = await import('jspdf');
  const html2canvas = (await import('html2canvas')).default;
  const element = document.getElementById('label-content');
  if (!element) return;

  const canvas = await html2canvas(element, { scale: 3 });
  const imgData = canvas.toDataURL('image/png');

  const isSmall = format === '30334';
  const pdfWidth = isSmall ? 57.15 : 101.6;
  const pdfHeight = isSmall ? 31.75 : 152.4;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [pdfWidth, pdfHeight],
  });

  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
  pdf.save(`label-${data.tracking}.pdf`);
};

if (!isReady) return <div style={{ padding: 20, fontFamily: 'sans-serif' }}>Generando etiqueta...</div>;

return (
  <div style={{ 
    display: 'flex', 
    flexDirection: 'column',
    justifyContent: 'center', 
    alignItems: 'center', 
    minHeight: '100vh',
    margin: 0,
    padding: '20px',
    background: '#f5f5f5'
  }}>
    <div id="label-content">
      <ShippingLabel data={data} />
    </div>

    <div className="no-print" style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
      <button
        onClick={handlePrint}
        style={{ padding: '12px 24px', background: '#000', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer' }}
      >
        🖨️ Imprimir
      </button>
      <button
        onClick={handleDownloadPDF}
        style={{ padding: '12px 24px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer' }}
      >
        📥 Descargar PDF
      </button>
    </div>
    
    <style jsx global>{`
      @page {
        size: ${pageSizeCss};
        margin: 0;
      }
      body {
        margin: 0;
        padding: 0;
      }
      .no-print { display: flex; }
      @media print { .no-print { display: none !important; } }
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