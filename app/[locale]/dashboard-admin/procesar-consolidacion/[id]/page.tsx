import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import ProcessConsolidationClient from '@/components/admin/ProcessConsolidationClient';

// 👇 ESTA LÍNEA ES LA CLAVE DEL ÉXITO
// Le dice a Vercel: "Esta página depende de datos en vivo, no la construyas estáticamente".
export const dynamic = 'force-dynamic';

export default async function ProcessConsolidationPage({ params }: { params: { id: string } }) {
  const session = await auth();

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'WAREHOUSE')) {
    redirect('/login-cliente');
  }

  // Buscar la consolidación específica
  const consolidation = await prisma.consolidatedShipment.findUnique({
    where: { id: params.id },
    include: {
      user: true,
      packages: true
    }
  });

  if (!consolidation) return notFound();

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-montserrat">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gmc-gris-oscuro mb-6 font-garamond">
          Finalizar Consolidación #{consolidation.gmcShipmentNumber}
        </h1>
        
        {/* Componente Cliente para manejar el formulario final */}
        <ProcessConsolidationClient consolidation={consolidation} />
      </div>
    </div>
  );
}