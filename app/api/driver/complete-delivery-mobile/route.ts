import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

export const dynamic = 'force-dynamic';

async function getDriverFromToken(req: Request) {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'secret');
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as any;
  } catch { return null; }
}

export async function POST(req: Request) {
  try {
    const driver = await getDriverFromToken(req);
    if (!driver) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const prisma = (await import("@/lib/prisma")).default;
    const body = await req.json();
    const { packageId, photoUrl, signatureBase64 } = body;

    if (!packageId || !photoUrl) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    try {
      const updatedPickup = await prisma.pickupRequest.update({
        where: { id: packageId },
        data: { status: 'ENTREGADO', photoDeliveryUrl: photoUrl, signatureUrl: signatureBase64 || null, updatedAt: new Date() },
        include: { user: true },
      });
      await notifyClient(updatedPickup.user.id, "Delivery Local", packageId);
      return NextResponse.json({ success: true, data: updatedPickup });
    } catch (e: any) { if (e.code !== 'P2025') throw e; }

    try {
      const updatedShipment = await prisma.consolidatedShipment.update({
        where: { id: packageId },
        data: { status: 'ENTREGADO', updatedAt: new Date() },
        include: { user: true },
      });
      await prisma.package.updateMany({
        where: { consolidatedShipmentId: packageId },
        data: { status: 'ENTREGADO', deliveryPhotoUrl: photoUrl, deliverySignature: signatureBase64 || null, updatedAt: new Date() },
      });
      await notifyClient(updatedShipment.user.id, "Consolidación", updatedShipment.gmcShipmentNumber);
      return NextResponse.json({ success: true, data: updatedShipment });
    } catch (e: any) { if (e.code !== 'P2025') throw e; }

    try {
      const updatedPackage = await prisma.package.update({
        where: { id: packageId },
        data: { status: 'ENTREGADO', deliveryPhotoUrl: photoUrl, deliverySignature: signatureBase64 || null, updatedAt: new Date() },
        include: { user: true },
      });
      await notifyClient(updatedPackage.user.id, "Paquete", updatedPackage.gmcTrackingNumber);
      return NextResponse.json({ success: true, data: updatedPackage });
    } catch (e: any) {
      if (e.code === 'P2025') return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 });
      throw e;
    }

  } catch (error) {
    console.error("Error complete-delivery-mobile:", error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

async function notifyClient(userId: string, type: string, refId: string) {
  try {
    const { sendNotification } = await import("@/lib/notifications");
    await sendNotification({ userId, title: JSON.stringify({ key: "deliveryCompletedTitle" }), message: JSON.stringify({ key: "deliveryCompletedDesc", type }), href: "/dashboard-cliente/historial-solicitudes", type: "SUCCESS" });
  } catch {}
}
