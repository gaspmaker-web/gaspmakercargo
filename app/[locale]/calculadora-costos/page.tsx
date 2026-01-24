import CalculadoraClient from './CalculadoraClient';

// 👇 AQUÍ SÍ FUNCIONA LA MAGIA
// Al estar separado, Next.js obedece esto y no intenta compilar el formulario estáticamente.
export const dynamic = 'force-dynamic';

export default function CalculatorPage() {
    return <CalculadoraClient />;
}