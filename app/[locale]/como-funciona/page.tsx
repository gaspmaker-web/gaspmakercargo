import ComoFuncionaClient from './ComoFuncionaClient';

// 👇 ESTA LÍNEA ES LA QUE SOLUCIONA EL BUILD DE VERCEL
// Obliga al servidor a generar esta página dinámicamente, evitando errores estáticos.
export const dynamic = 'force-dynamic';

export default function HowItWorksPage() {
  return <ComoFuncionaClient />;
}