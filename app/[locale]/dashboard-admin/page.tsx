// 🛡️ MODO PRUEBA DE VIDA: SI ESTO FALLA, EL PROBLEMA NO ES ESTA PÁGINA
export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <div className="p-20 text-center bg-red-100 text-red-800 font-bold text-3xl">
      SI VES ESTO, VERCEL YA FUNCIONA.
      <br />
      (El problema estaba en el Client Component)
    </div>
  );
}