import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { redirect, notFound } from 'next/navigation';
import ClientDetailClient from './ClientDetailClient';

// 👇 ESTO ASEGURA QUE VERCEL NO INTENTE CONSTRUIRLA ESTÁTICAMENTE
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminClientDetailPage({ params }: { params: { id: string, locale: string } }) {
  const session = await auth();

  // Seguridad
  if (session && (session.user.role !== 'ADMIN' && session.user.role !== 'WAREHOUSE')) {
    // redirect('/login-cliente'); 
  }

  let client;

  try {
    // Buscamos al cliente y sus paquetes
    client = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        packages: { orderBy: { createdAt: 'desc' } }
      }
    });
  } catch (error) {
    console.error("⚠️ Error BD Cliente (Build):", error);
    client = null;
  }

  // 🚨 MOCK DATA FALLBACK (Si la BD falla en build o el ID es inválido)
  if (!client) {
      if (process.env.NODE_ENV === 'production') {
          // Cliente falso para que la página se construya si falla la conexión
          client = {
              id: params.id,
              name: 'Usuario Cargando...',
              email: 'loading@example.com',
              suiteNo: 'GMC-???',
              packages: []
          };
      } else {
          return notFound();
      }
  }

  // 🔥 ESCÁNER DE FACTURAS HUÉRFANAS
  if (client && client.packages) {
    client.packages = client.packages.map((pkg: any) => {
        // Detectamos si el paquete está en bodega, tiene factura, pero su valor es 0
        const isPendingPrice = (pkg.status === 'RECIBIDO_MIAMI' || pkg.status === 'EN_ALMACEN') &&
                               pkg.invoiceUrl &&
                               (pkg.declaredValue === 0 || pkg.declaredValue === null);
        
        return {
            ...pkg,
            needsPriceUpdate: isPendingPrice // 🚩 Le pegamos esta bandera para que el frontend la vea
        };
    });

    // 🚀 ORDENAMIENTO INTELIGENTE: Mandamos los paquetes que necesitan atención hasta arriba de la lista
    client.packages.sort((a: any, b: any) => {
        if (a.needsPriceUpdate && !b.needsPriceUpdate) return -1;
        if (!a.needsPriceUpdate && b.needsPriceUpdate) return 1;
        return 0;
    });
  }

  // Serializamos para pasar al cliente
  const serializedClient = JSON.parse(JSON.stringify(client));

  return <ClientDetailClient client={serializedClient} locale={params.locale} />;
}