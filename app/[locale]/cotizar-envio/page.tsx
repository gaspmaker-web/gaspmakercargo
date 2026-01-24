import CalculadoraClient from './CalculadoraClient';

// 🛑 ESTA ES LA LÍNEA QUE VERCEL ESTÁ IGNORANDO POR CULPA DEL "USE CLIENT"
// Al quitar "use client" de este archivo, Vercel obedecerá esta orden.
export const dynamic = 'force-dynamic';

export default function Page() {
  return <CalculadoraClient />;
}