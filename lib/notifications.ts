import { Resend } from 'resend';
import prisma from "@/lib/prisma"; // 👈 IMPORTANTE: Agregamos Prisma para la Base de Datos

const resend = new Resend(process.env.RESEND_API_KEY);
const EMAIL_FROM = 'Gasp Maker Cargo <onboarding@resend.dev>'; 

// =============================================================================
// 🔔 PARTE 1: NOTIFICACIONES DE CAMPANA (BASE DE DATOS)
// =============================================================================

export async function sendNotification({
  userId,
  title,
  message,
  href,
  type = "INFO"
}: {
  userId: string;
  title: string;
  message: string;
  href?: string;
  type?: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
}) {
  try {
    if (!userId) return;
    
    // Guardamos en la tabla Notification para que salga en la campana
    await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        href,
        type
      }
    });
  } catch (error) {
    console.error("Error guardando notificación en DB:", error);
  }
}

// =============================================================================
// 📧 PARTE 2: NOTIFICACIONES DE EMAIL (RESEND)
// =============================================================================

// --- PLANTILLA HTML UNIFICADA ---
const baseTemplate = (title: string, bodyContent: string, ctaLink?: string, ctaText?: string) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Helvetica', 'Arial', sans-serif; color: #333; line-height: 1.6; background-color: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background-color: #1f2937; color: #D97706; padding: 30px; text-align: center; }
    .logo { font-size: 24px; font-weight: bold; letter-spacing: 2px; text-decoration: none; color: #D97706; }
    .content { padding: 40px 30px; }
    .h1 { color: #111827; font-size: 22px; margin-top: 0; }
    .info-box { background: #f9fafb; border-left: 5px solid #D97706; padding: 20px; margin: 25px 0; border-radius: 4px; }
    .info-row { margin-bottom: 8px; font-size: 14px; }
    .label { font-weight: bold; color: #6b7280; text-transform: uppercase; font-size: 11px; }
    .value { color: #111827; font-weight: 600; font-size: 15px; }
    .btn { display: inline-block; background-color: #D97706; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; text-align: center; }
    .footer { background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">GASP MAKER CARGO</div>
    </div>
    <div class="content">
      <h1 class="h1">${title}</h1>
      ${bodyContent}
      ${ctaLink ? `<div style="text-align: center;"><a href="${ctaLink}" class="btn">${ctaText || 'Ver Detalles'}</a></div>` : ''}
    </div>
    <div class="footer">
      <p>Gasp Maker LLC • 1861 NW 22nd St, Miami, FL 33142</p>
      <p>Este es un mensaje automático, por favor no responder.</p>
    </div>
  </div>
</body>
</html>
`;

// --- FUNCIONES PARA CADA EVENTO ---

export const sendPaymentReceiptEmail = async (
    email: string, 
    name: string, 
    serviceType: string, 
    amount: number, 
    orderId: string,
    details?: string
) => {
  const html = baseTemplate(
    `¡Pago Exitoso! ✅`,
    `<p>Hola <strong>${name}</strong>,</p>
     <p>Hemos procesado tu pago correctamente. Aquí está el comprobante de tu transacción:</p>
     <div class="info-box">
        <div class="info-row"><span class="label">Orden ID:</span><br><span class="value">#${orderId.slice(0, 8).toUpperCase()}</span></div>
        <div class="info-row"><span class="label">Servicio:</span><br><span class="value">${serviceType}</span></div>
        <div class="info-row"><span class="label">Detalle:</span><br><span class="value">${details || 'Estándar'}</span></div>
        <div class="info-row" style="margin-top: 15px;"><span class="label">Total Pagado:</span><br><span class="value" style="color: #059669; font-size: 18px;">$${amount.toFixed(2)} USD</span></div>
     </div>
     <p>Gracias por confiar en nuestros servicios logísticos.</p>`,
    `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard-cliente/historial-solicitudes`,
    "Ver Historial"
  );

  try {
    const data = await resend.emails.send({ 
        from: EMAIL_FROM, 
        to: email, 
        subject: `🧾 Recibo de Pago - ${serviceType}`, 
        html 
    });
    return data; 
  } catch (error) {
    console.error("❌ Error interno enviando email:", error);
    return { error };
  }
};

export const sendPackageReceivedEmail = async (email: string, name: string, tracking: string, weight: number) => {
  const html = baseTemplate(
    `¡Llegó tu Paquete! 📦`,
    `<p>Hola <strong>${name}</strong>,</p>
     <p>Confirmamos la recepción de un nuevo paquete en tu casillero de Miami.</p>
     <div class="info-box">
       <div class="info-row"><span class="label">Tracking / Guía:</span><br><span class="value">${tracking}</span></div>
       <div class="info-row"><span class="label">Peso Registrado:</span><br><span class="value">${weight} lbs</span></div>
       <div class="info-row"><span class="label">Ubicación:</span><br><span class="value">Bodega Miami (MIA-01)</span></div>
     </div>
     <p>Por favor ingresa a tu cuenta para subir la factura (Invoice) o solicitar el envío.</p>`,
    `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard-cliente`,
    "Gestionar Paquete"
  );

  try {
    const data = await resend.emails.send({ from: EMAIL_FROM, to: email, subject: '📦 Paquete Recibido en Almacén', html });
    return data;
  } catch (error) { return { error }; }
};

export const sendShippedEmail = async (email: string, name: string, trackingGMC: string, carrier: string) => {
  const html = baseTemplate(
    `¡Tu Carga va en Camino! ✈️`,
    `<p>Hola <strong>${name}</strong>,</p>
     <p>Excelentes noticias. Tu envío ha sido procesado y está en ruta hacia su destino.</p>
     <div class="info-box">
       <div class="info-row"><span class="label">Guía GMC:</span><br><span class="value">${trackingGMC}</span></div>
       <div class="info-row"><span class="label">Transportista:</span><br><span class="value">${carrier}</span></div>
       <div class="info-row"><span class="label">Estado:</span><br><span class="value">En Tránsito Internacional</span></div>
     </div>`,
    `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard-cliente/rastreo/${trackingGMC}`,
    "Rastrear Envío"
  );

  try {
    const data = await resend.emails.send({ from: EMAIL_FROM, to: email, subject: '✈️ Tu envío está en camino', html });
    return data;
  } catch (error) { return { error }; }
};

export const sendConsolidationRequestEmail = async (email: string, name: string, packageCount: number, trackingId: string) => {
    const html = baseTemplate(
      `Solicitud de Consolidación Recibida 🔄`,
      `<p>Hola <strong>${name}</strong>,</p>
       <p>Hemos recibido tu orden para consolidar tus paquetes.</p>
       <div class="info-box">
         <div class="info-row"><span class="label">ID Solicitud:</span><br><span class="value">${trackingId}</span></div>
         <div class="info-row"><span class="label">Paquetes a agrupar:</span><br><span class="value">${packageCount} paquetes</span></div>
         <div class="info-row"><span class="label">Estado Actual:</span><br><span class="value" style="color:#d97706;">Procesando en Almacén</span></div>
       </div>
       <p>Te notificaremos cuando el re-empaque esté listo y pesado para el pago final.</p>`,
      `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard-cliente`,
      "Ver Estado"
    );
  
    try {
      const data = await resend.emails.send({ from: EMAIL_FROM, to: email, subject: '🔄 Solicitud de Consolidación', html });
      return data;
    } catch (error) { return { error }; }
};

export const sendShipmentDispatchedEmail = async (
    email: string,
    name: string,
    gmcId: string,
    courier: string,
    tracking: string
  ) => {
    const html = baseTemplate(
      `¡Tu Paquete ha sido Despachado! ✈️`,
      `<p>Hola <strong>${name}</strong>,</p>
       <p>Tu paquete ha salido de nuestro almacén y va camino a su destino.</p>
       <div class="info-box">
         <div class="info-row"><span class="label">ID Interno:</span><br><span class="value">${gmcId}</span></div>
         <div class="info-row"><span class="label">Courier:</span><br><span class="value">${courier}</span></div>
         <div class="info-row"><span class="label">Tracking Oficial:</span><br><span class="value" style="font-family:monospace; font-size:16px;">${tracking}</span></div>
       </div>
       <p>Puedes rastrearlo directamente con el courier o desde tu panel.</p>`,
      `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard-cliente/en-transito`,
      "Ver en Dashboard"
    );
  
    try {
      const data = await resend.emails.send({ from: EMAIL_FROM, to: email, subject: '✈️ Paquete Despachado', html });
      return data;
    } catch (error) { return { error }; }
};

// COMPATIBILIDAD Y ENTREGA FINAL

export const sendPackageDispatchedEmail = async (email: string, tracking: string) => {
    console.log(`📧 [Resend] Simulando despacho rápido: ${tracking} -> ${email}`);
    return true;
};

export const sendPackageDeliveredEmail = async (email: string, tracking: string) => {
    const html = baseTemplate(
      `¡Paquete Entregado! 📬`,
      `<p>Buenas noticias, tu paquete <strong>${tracking}</strong> ha sido entregado en tu dirección.</p>
       <p>Puedes ver la foto de evidencia y la firma en tu historial.</p>
       <div class="info-box">
         <div class="info-row"><span class="label">Estado:</span><br><span class="value" style="color:green;">ENTREGADO EXITOSAMENTE</span></div>
       </div>`,
      `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard-cliente/en-destino`,
      "Ver Prueba de Entrega"
    );
  
    try {
      const data = await resend.emails.send({ from: EMAIL_FROM, to: email, subject: '📬 Paquete Entregado', html });
      return data;
    } catch (error) { return { error }; }
};

export const sendPickupReadyEmail = async (email: string, tracking: string) => {
    console.log(`📧 [Resend] Pickup listo para ${tracking}`);
    return true;
};