import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(req: Request) {
  try {
    const session = await auth();
    // Verificamos que sea empleado/admin
    if (!session?.user?.role || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const suite = searchParams.get('suite');

    if (!suite) return NextResponse.json({ error: 'Suite requerida' }, { status: 400 });

    // Limpiamos el texto por si escanean con letras (Ej: US-76826 -> 76826)
    const cleanSuite = suite.replace(/\D/g, '');

    const user = await prisma.user.findUnique({
      where: { suiteNo: cleanSuite },
      include: {
        mailboxSubscription: {
          // 🔥 MAGIA: Le pedimos a la BD que traiga también a las personas autorizadas
          include: {
            additionalRecipients: true
          }
        },
      }
    });

    if (!user || !user.mailboxSubscription) {
        return NextResponse.json({ error: 'PMB no encontrado' }, { status: 404 });
    }

    const subscription = user.mailboxSubscription;

    // 🔥 INTELIGENCIA: CALCULAMOS EL ESTADO EFECTIVO
    // ¿Hay algún familiar o socio comercial activo?
    const hasActiveAdditional = subscription.additionalRecipients?.some(
      (person) => person.status === 'ACTIVE'
    ) || false;

    // Si el titular no está activo, pero un familiar sí, el buzón entero se vuelve operativo
    let effectiveStatus = subscription.status;
    if (effectiveStatus !== 'ACTIVE' && hasActiveAdditional) {
      effectiveStatus = 'ACTIVE';
    }

    // El guardián ahora evalúa el estado efectivo, no solo el del titular
    if (effectiveStatus !== 'ACTIVE') {
        return NextResponse.json({ error: 'Buzón inactivo o suspendido' }, { status: 400 });
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      suiteNo: user.suiteNo,
      status: effectiveStatus // Le pasamos el estado efectivo al Frontend
    });

  } catch (error) {
    console.error("Error buscando buzón:", error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}