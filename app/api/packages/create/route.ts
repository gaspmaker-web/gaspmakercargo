import { NextResponse } from 'next/server';

// 👇 VACUNA 1: Forzar modo dinámico (Vital para creación de datos)
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // 👇 VACUNA 2: Imports dentro de la función (Lazy Loading)
    const prisma = (await import('@/lib/prisma')).default;
    const { auth } = await import('@/auth');
    const { generateGmcTracking } = await import('@/lib/utils');
    
    // 🔥 IMPORTAMOS NOTIFICACIONES Y EL HELPER DE TRADUCCIÓN
    const { sendPackageReceivedEmail, sendNotification, getT } = await import('@/lib/notifications');

    // 1. Verificar permisos
    const session = await auth();
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'WAREHOUSE')) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    // 2. Recibir datos del Admin
    const body = await req.json();
    const { 
      userId, 
      countryCode, 
      carrierTrackingNumber, 
      description, 
      weightLbs, 
      lengthIn, 
      widthIn, 
      heightIn, 
      photoUrlMiami,
      declaredValue,
      invoiceUrl,
      customsItems 
    } = body;

    // Validaciones
    if (!carrierTrackingNumber || !weightLbs) {
      return NextResponse.json({ message: "Faltan datos obligatorios (Tracking o Peso)" }, { status: 400 });
    }

    // --- LÓGICA DE CONEXIÓN CON PRE-ALERTA ---
    
    const existingPackage = await prisma.package.findFirst({
      where: {
        carrierTrackingNumber: carrierTrackingNumber,
        status: 'PRE_ALERTA' 
      }
    });

    if (existingPackage) {
      // --- CASO 1: ES UNA PRE-ALERTA (ACTUALIZAR) ---
      const updatedPackage = await prisma.package.update({
        where: { id: existingPackage.id },
        data: {
          status: 'RECIBIDO_MIAMI', 
          weightLbs,                
          lengthIn,
          widthIn,
          heightIn,
          photoUrlMiami: photoUrlMiami || null, 
          invoiceUrl: invoiceUrl || existingPackage.invoiceUrl,
          declaredValue: declaredValue ? parseFloat(declaredValue) : existingPackage.declaredValue,
          customsItems: customsItems || existingPackage.customsItems,
        },
        include: { user: true } 
      });

      // 🔔 NOTIFICAR AL CLIENTE (PRE-ALERTA PROCESADA)
      if (updatedPackage.user?.email) {
          const userLang = (updatedPackage.user as any).language || 'en';
          const t = getT(userLang);

          await sendPackageReceivedEmail(
              updatedPackage.user.email,
              updatedPackage.user.name || 'Cliente',
              updatedPackage.carrierTrackingNumber,
              updatedPackage.weightLbs || 0,
              userLang 
          );
          
          await sendNotification({
              userId: updatedPackage.userId,
              title: t.notifPreAlertTitle, 
              message: t.notifPreAlertBody.replace('{TRACKING}', updatedPackage.carrierTrackingNumber),
              type: "SUCCESS",
              // 🔥 CORRECCIÓN AQUÍ: Mandamos al detalle del paquete actualizado
              href: `/dashboard-cliente/paquetes/${updatedPackage.id}`
          });
      }

      return NextResponse.json({ 
          message: "Paquete pre-alertado recibido correctamente.", 
          package: updatedPackage,
          gmcTrackingNumber: updatedPackage.gmcTrackingNumber 
      }, { status: 200 });

    } else {
      // --- CASO 2: ES UN PAQUETE NUEVO (CREAR) ---
      if (!userId) {
         return NextResponse.json({ message: "Para paquetes nuevos, debes seleccionar un cliente." }, { status: 400 });
      }

      const trackingCountry = countryCode || 'US';
      const gmcTracking = generateGmcTracking(trackingCountry);

      const newPackage = await prisma.package.create({
        data: {
          userId,
          carrierTrackingNumber,
          gmcTrackingNumber: gmcTracking,
          description: description || "Paquete recibido en Miami",
          weightLbs,
          lengthIn,
          widthIn,
          heightIn,
          status: 'RECIBIDO_MIAMI',
          photoUrlMiami: photoUrlMiami || null,
          invoiceUrl: invoiceUrl || null,
          customsItems: customsItems || null,
          declaredValue: declaredValue ? parseFloat(declaredValue) : 0
        },
        include: { user: true } 
      });

      // 🔔 NOTIFICAR AL CLIENTE (PAQUETE NUEVO)
      if (newPackage.user?.email) {
          const userLang = (newPackage.user as any).language || 'en';
          const t = getT(userLang);

          await sendPackageReceivedEmail(
              newPackage.user.email,
              newPackage.user.name || 'Cliente',
              newPackage.carrierTrackingNumber,
              newPackage.weightLbs || 0,
              userLang
          );
          
          await sendNotification({
              userId: newPackage.userId,
              title: t.notifPkgNewTitle, 
              message: t.notifPkgNewBody.replace('{TRACKING}', newPackage.carrierTrackingNumber),
              type: "INFO",
              // 🔥 CORRECCIÓN AQUÍ: Mandamos al detalle del nuevo paquete
              href: `/dashboard-cliente/paquetes/${newPackage.id}`
          });
      }

      return NextResponse.json(newPackage, { status: 201 });
    }

  } catch (error: any) {
    console.error("Error procesando paquete:", error);
    if (error.code === 'P2002') {
        return NextResponse.json({ message: "Este paquete ya fue registrado anteriormente." }, { status: 409 });
    }
    return NextResponse.json({ message: "Error interno." }, { status: 500 });
  }
}