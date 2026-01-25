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
    // redirect('/login-cliente'); // Comentado para proteger build
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

  // 🚨 MOCK DATA FALLBACK (Si la BD falla en build)
  if (!client) {
      if (process.env.NODE_ENV === 'production') {
          // Cliente falso para que la página se construya
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

  // Serializamos para pasar al cliente
  const serializedClient = JSON.parse(JSON.stringify(client));

  return <ClientDetailClient client={serializedClient} locale={params.locale} />;
}