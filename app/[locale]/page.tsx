import React from 'react';

// Forzamos a que sea estático para que no piense mucho
export const dynamic = 'force-static';

export default function HomePage() {
  return (
    <div style={{ padding: '50px', textAlign: 'center', backgroundColor: '#f0f0f0', height: '100vh' }}>
      <h1 style={{ color: '#333' }}>GaspMakerCargo</h1>
      <p>Sitio en mantenimiento. Volvemos pronto.</p>
    </div>
  );
}