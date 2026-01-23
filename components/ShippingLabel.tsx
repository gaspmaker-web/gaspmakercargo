"use client";

import React from 'react';
import Barcode from 'react-barcode';

export interface LabelData {
  tracking: string;
  clientName: string;
  suite: string;
  weight: number;
  countryCode: string;
  date: string;
  description: string;
  format?: '4x6' | '30334'; // <--- NUEVO CAMPO: Para saber qué diseño pintar
}

interface ShippingLabelProps {
  data: LabelData;
}

export const ShippingLabel = React.forwardRef<HTMLDivElement, ShippingLabelProps>(
  ({ data }, ref) => {
    const isSmall = data.format === '30334';

    // --- DISEÑO PEQUEÑO (DYMO 30334: 2-1/4" x 1-1/4") ---
    if (isSmall) {
      return (
        <div ref={ref} style={{
          width: '2.25in', // 2-1/4 pulgadas
          height: '1.25in', // 1-1/4 pulgadas
          padding: '0.05in',
          backgroundColor: 'white',
          color: 'black',
          fontFamily: 'Arial, sans-serif',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          boxSizing: 'border-box'
        }}>
          <p style={{ fontSize: '9px', fontWeight: 'bold', margin: 0 }}>GMC MIAMI</p>
          
          {/* Código de barras ajustado para tamaño mini */}
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <Barcode 
              value={data.tracking} 
              width={1.3}      // Barras más finas
              height={30}      // Menos altura
              fontSize={9}     // Texto más pequeño
              format="CODE128" 
              margin={2}
              displayValue={true}
            />
          </div>
          
          <div style={{ fontSize: '8px', textAlign: 'center', lineHeight: 1, marginTop: '-2px' }}>
             <strong>{data.suite}</strong> - {data.countryCode}
          </div>
        </div>
      );
    }

    // --- DISEÑO ESTÁNDAR (4" x 6") ---
    return (
      <div ref={ref} style={{ 
          width: '4in', 
          height: '6in', 
          padding: '0.2in', 
          backgroundColor: 'white', 
          color: 'black',
          fontFamily: 'Arial, sans-serif',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          border: '1px solid #eee',
          boxSizing: 'border-box',
          overflow: 'hidden',
          pageBreakAfter: 'avoid'
        }}>
          {/* HEADER */}
          <div style={{ borderBottom: '2px solid black', paddingBottom: '10px', marginBottom: '10px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, lineHeight: 1 }}>GASP MAKER CARGO</h1>
            <p style={{ fontSize: '12px', margin: 0 }}>Miami Warehouse Center</p>
          </div>

          {/* DESTINATARIO */}
          <div style={{ flexGrow: 1 }}>
            <p style={{ fontSize: '10px', textTransform: 'uppercase', color: '#555', margin: 0 }}>SHIP TO:</p>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: '5px 0', lineHeight: 1.1 }}>{data.clientName}</h2>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '2px 0' }}>STE: {data.suite}</h3>
            <p style={{ fontSize: '14px', marginTop: '2px', fontWeight: 'bold' }}>{data.countryCode.toUpperCase()}</p>
          </div>

          {/* DETALLES */}
          <div style={{ borderTop: '2px solid black', borderBottom: '2px solid black', padding: '8px 0', margin: '5px 0', display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '10px', fontWeight: 'bold', margin: 0 }}>WEIGHT:</p>
              <p style={{ fontSize: '14px', margin: 0 }}>{data.weight} LBS</p>
            </div>
            <div>
              <p style={{ fontSize: '10px', fontWeight: 'bold', margin: 0 }}>DATE:</p>
              <p style={{ fontSize: '14px', margin: 0 }}>{data.date}</p>
            </div>
          </div>

          {/* CÓDIGO DE BARRAS */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 'auto', paddingTop: '5px' }}>
            <p style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '0', margin: 0 }}>INTERNAL TRACKING #</p>
            <Barcode 
              value={data.tracking} 
              width={1.8} 
              height={50} 
              fontSize={14}
              format="CODE128" 
              margin={5}
            />
          </div>
      </div>
    );
  }
);

ShippingLabel.displayName = "ShippingLabel";