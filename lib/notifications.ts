import { Resend } from 'resend';
import prisma from "@/lib/prisma"; 

const resend = new Resend(process.env.RESEND_API_KEY);
const EMAIL_FROM = 'Gasp Maker Cargo <info@gaspmakercargo.com>';
const ADMIN_EMAIL = 'info@gaspmakercargo.com'; 

// =============================================================================
// 🌍 DICCIONARIO DE TRADUCCIONES (EN, ES, FR, PT)
// =============================================================================
// 🔥 CAMBIO CLAVE: Agregamos 'export' para usarlo en otras APIs
export const TRANSLATIONS: any = {
  en: {
    footer: "This is an automated message, please do not reply.",
    btnText: "View Details",
    paymentTitle: "Payment Successful! ✅",
    paymentBody: "We have processed your payment successfully. Here is your transaction receipt:",
    orderId: "Order ID",
    service: "Service",
    detail: "Details",
    total: "Total Paid",
    thanks: "Thank you for trusting our logistics services.",
    pkgReceivedTitle: "Package Received! 📦",
    pkgReceivedBody: "We confirm the receipt of a new package in your Miami locker.",
    tracking: "Tracking #",
    weight: "Registered Weight",
    location: "Location",
    pkgAction: "Please log in to upload your invoice or request shipping.",
    shippedTitle: "Your Cargo is on the Way! ✈️",
    shippedBody: "Great news. Your shipment has been processed and is en route to its destination.",
    carrier: "Carrier",
    statusTransit: "In International Transit",
    consolidationTitle: "Consolidation Request Received 🔄",
    consolidationBody: "We have received your request to consolidate your packages.",
    pkgCount: "Packages to group",
    statusProcessing: "Processing in Warehouse",
    consolidationNote: "We will notify you when repacking is complete and weighed for final payment.",
    dispatchedTitle: "Package Dispatched! ✈️",
    dispatchedBody: "Your package has left our warehouse and is on its way to its destination.",
    trackingOfficial: "Official Tracking",
    trackNote: "You can track it directly with the courier or from your dashboard.",
    deliveredTitle: "Package Delivered! 📬",
    deliveredBody: "Good news, your package has been delivered to your address.",
    statusDelivered: "SUCCESSFULLY DELIVERED",
    idInternal: "Internal ID",
    idRequest: "Request ID",
    status: "Status",
    // Textos para notificaciones de campana
    notifPkgNewTitle: "New Package in Miami",
    notifPkgNewBody: "We have received a package (Tracking: {TRACKING}).",
    notifPreAlertTitle: "Pre-Alert Received",
    notifPreAlertBody: "Your package with tracking {TRACKING} has arrived in Miami."
  },
  es: {
    footer: "Este es un mensaje automático, por favor no responder.",
    btnText: "Ver Detalles",
    paymentTitle: "¡Pago Exitoso! ✅",
    paymentBody: "Hemos procesado tu pago correctamente. Aquí está el comprobante de tu transacción:",
    orderId: "Orden ID",
    service: "Servicio",
    detail: "Detalle",
    total: "Total Pagado",
    thanks: "Gracias por confiar en nuestros servicios logísticos.",
    pkgReceivedTitle: "¡Llegó tu Paquete! 📦",
    pkgReceivedBody: "Confirmamos la recepción de un nuevo paquete en tu casillero de Miami.",
    tracking: "Tracking / Guía",
    weight: "Peso Registrado",
    location: "Ubicación",
    pkgAction: "Por favor ingresa a tu cuenta para subir la factura (Invoice) o solicitar el envío.",
    shippedTitle: "¡Tu Carga va en Camino! ✈️",
    shippedBody: "Excelentes noticias. Tu envío ha sido procesado y está en ruta hacia su destino.",
    carrier: "Transportista",
    statusTransit: "En Tránsito Internacional",
    consolidationTitle: "Solicitud de Consolidación Recibida 🔄",
    consolidationBody: "Hemos recibido tu orden para consolidar tus paquetes.",
    pkgCount: "Paquetes a agrupar",
    statusProcessing: "Procesando en Almacén",
    consolidationNote: "Te notificaremos cuando el re-empaque esté listo y pesado para el pago final.",
    dispatchedTitle: "¡Paquete Despachado! ✈️",
    dispatchedBody: "Tu paquete ha salido de nuestro almacén y va camino a su destino.",
    trackingOfficial: "Tracking Oficial",
    trackNote: "Puedes rastrearlo directamente con el courier o desde tu panel.",
    deliveredTitle: "¡Paquete Entregado! 📬",
    deliveredBody: "Buenas noticias, tu paquete ha sido entregado en tu dirección.",
    statusDelivered: "ENTREGADO EXITOSAMENTE",
    idInternal: "ID Interno",
    idRequest: "ID Solicitud",
    status: "Estado",
    // Textos para notificaciones de campana
    notifPkgNewTitle: "Nuevo Paquete en Miami",
    notifPkgNewBody: "Hemos recibido un paquete (Tracking: {TRACKING}).",
    notifPreAlertTitle: "Pre-Alerta Recibida",
    notifPreAlertBody: "Tu paquete con tracking {TRACKING} ha llegado a Miami."
  },
  fr: {
    footer: "Ceci est un message automatique, veuillez ne pas répondre.",
    btnText: "Voir les détails",
    paymentTitle: "Paiement Réussi ! ✅",
    paymentBody: "Nous avons traité votre paiement avec succès. Voici votre reçu de transaction :",
    orderId: "ID Commande",
    service: "Service",
    detail: "Détail",
    total: "Total Payé",
    thanks: "Merci de faire confiance à nos services logistiques.",
    pkgReceivedTitle: "Colis Reçu ! 📦",
    pkgReceivedBody: "Nous confirmons la réception d'un nouveau colis dans votre casier à Miami.",
    tracking: "Suivi / Tracking",
    weight: "Poids Enregistré",
    location: "Emplacement",
    pkgAction: "Veuillez vous connecter pour télécharger la facture ou demander l'expédition.",
    shippedTitle: "Votre cargaison est en route ! ✈️",
    shippedBody: "Bonnes nouvelles. Votre envoi a été traité et est en route vers sa destination.",
    carrier: "Transporteur",
    statusTransit: "En Transit International",
    consolidationTitle: "Demande de Consolidation Reçue 🔄",
    consolidationBody: "Nous avons reçu votre demande de regroupement de colis.",
    pkgCount: "Colis à regrouper",
    statusProcessing: "Traitement en Entrepôt",
    consolidationNote: "Nous vous informerons lorsque le reconditionnement sera terminé.",
    dispatchedTitle: "Colis Expédié ! ✈️",
    dispatchedBody: "Votre colis a quitté notre entrepôt et est en route vers sa destination.",
    trackingOfficial: "Suivi Officiel",
    trackNote: "Vous pouvez le suivre directement avec le transporteur ou depuis votre tableau de bord.",
    deliveredTitle: "Colis Livré ! 📬",
    deliveredBody: "Bonne nouvelle, votre colis a été livré à votre adresse.",
    statusDelivered: "LIVRÉ AVEC SUCCÈS",
    idInternal: "ID Interne",
    idRequest: "ID Demande",
    status: "Statut",
    // Textos para notificaciones de campana
    notifPkgNewTitle: "Nouveau Colis à Miami",
    notifPkgNewBody: "Nous avons reçu un colis (Suivi: {TRACKING}).",
    notifPreAlertTitle: "Pré-alerte Reçue",
    notifPreAlertBody: "Votre colis avec suivi {TRACKING} est arrivé à Miami."
  },
  pt: {
    footer: "Esta é uma mensagem automática, por favor não responda.",
    btnText: "Ver Detalhes",
    paymentTitle: "Pagamento com Sucesso! ✅",
    paymentBody: "Processamos seu pagamento com sucesso. Aqui está o recibo da sua transação:",
    orderId: "ID do Pedido",
    service: "Serviço",
    detail: "Detalhe",
    total: "Total Pago",
    thanks: "Obrigado por confiar em nossos serviços logísticos.",
    pkgReceivedTitle: "Pacote Recebido! 📦",
    pkgReceivedBody: "Confirmamos o recebimento de um novo pacote em seu armazém em Miami.",
    tracking: "Rastreamento",
    weight: "Peso Registrado",
    location: "Localização",
    pkgAction: "Por favor, faça login para enviar a fatura ou solicitar o envio.",
    shippedTitle: "Sua carga está a caminho! ✈️",
    shippedBody: "Ótimas notícias. Seu envio foi processado e está a caminho do destino.",
    carrier: "Transportadora",
    statusTransit: "Em Trânsito Internacional",
    consolidationTitle: "Solicitação de Consolidação Recebida 🔄",
    consolidationBody: "Recebemos seu pedido para consolidar seus pacotes.",
    pkgCount: "Pacotes para agrupar",
    statusProcessing: "Processando no Armazém",
    consolidationNote: "Notificaremos quando a reembalagem estiver pronta e pesada para pagamento final.",
    dispatchedTitle: "Pacote Despachado! ✈️",
    dispatchedBody: "Seu pacote saiu do nosso armazém e está a caminho do destino.",
    trackingOfficial: "Rastreamento Oficial",
    trackNote: "Você pode rastreá-lo diretamente com a transportadora ou pelo painel.",
    deliveredTitle: "Pacote Entregue! 📬",
    deliveredBody: "Boas notícias, seu pacote foi entregue em seu endereço.",
    statusDelivered: "ENTREGUE COM SUCESSO",
    idInternal: "ID Interno",
    idRequest: "ID Solicitação",
    status: "Estado",
    // Textos para notificaciones de campana
    notifPkgNewTitle: "Novo Pacote em Miami",
    notifPkgNewBody: "Recebemos um pacote (Rastreio: {TRACKING}).",
    notifPreAlertTitle: "Pré-alerta Recebido",
    notifPreAlertBody: "Seu pacote com rastreio {TRACKING} chegou a Miami."
  }
};

// 🔥 FUNCIÓN HELPER: Selección de Idioma (Default: Inglés)
// También la exportamos por si acaso
export const getT = (lang: string = 'en') => {
    const code = lang ? lang.split('-')[0].toLowerCase() : 'en'; 
    return TRANSLATIONS[code] || TRANSLATIONS['en']; // Si no existe, usa 'en'
};

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
    await prisma.notification.create({
      data: { userId, title, message, href, type }
    });
  } catch (error) {
    console.error("Error guardando notificación en DB:", error);
  }
}

// =============================================================================
// 📧 PARTE 2: PLANTILLA HTML BASE (ADAPTABLE)
// =============================================================================

const baseTemplate = (title: string, bodyContent: string, footerText: string, ctaLink?: string, ctaText?: string) => `
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
      ${ctaLink ? `<div style="text-align: center;"><a href="${ctaLink}" class="btn">${ctaText}</a></div>` : ''}
    </div>
    <div class="footer">
      <p>Gasp Maker LLC • 1861 NW 22nd St, Miami, FL 33142</p>
      <p>${footerText}</p>
    </div>
  </div>
</body>
</html>
`;

// =============================================================================
// 📧 PARTE 3: NOTIFICACIONES AL CLIENTE (MULTILINGÜE)
// =============================================================================

export const sendPaymentReceiptEmail = async (
    email: string, name: string, serviceType: string, amount: number, orderId: string, details?: string, 
    lang: string = 'en' // 👈 Default: Inglés
) => {
  const t = getT(lang);
  const html = baseTemplate(
    t.paymentTitle,
    `<p>Hola <strong>${name}</strong>,</p>
     <p>${t.paymentBody}</p>
     <div class="info-box">
        <div class="info-row"><span class="label">${t.orderId}:</span><br><span class="value">#${orderId.slice(0, 8).toUpperCase()}</span></div>
        <div class="info-row"><span class="label">${t.service}:</span><br><span class="value">${serviceType}</span></div>
        <div class="info-row"><span class="label">${t.detail}:</span><br><span class="value">${details || 'Standard'}</span></div>
        <div class="info-row" style="margin-top: 15px;"><span class="label">${t.total}:</span><br><span class="value" style="color: #059669; font-size: 18px;">$${amount.toFixed(2)} USD</span></div>
     </div>
     <p>${t.thanks}</p>`,
    t.footer,
    `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard-cliente/historial-solicitudes`, t.btnText
  );
  try { return await resend.emails.send({ from: EMAIL_FROM, to: email, subject: `🧾 ${t.paymentTitle}`, html }); } catch (e) { return { error: e }; }
};

export const sendPackageReceivedEmail = async (email: string, name: string, tracking: string, weight: number, lang: string = 'en') => {
  const t = getT(lang);
  const html = baseTemplate(
    t.pkgReceivedTitle,
    `<p>Hola <strong>${name}</strong>,</p>
     <p>${t.pkgReceivedBody}</p>
     <div class="info-box">
       <div class="info-row"><span class="label">${t.tracking}:</span><br><span class="value">${tracking}</span></div>
       <div class="info-row"><span class="label">${t.weight}:</span><br><span class="value">${weight} lbs</span></div>
       <div class="info-row"><span class="label">${t.location}:</span><br><span class="value">Bodega Miami (MIA-01)</span></div>
     </div>
     <p>${t.pkgAction}</p>`,
    t.footer,
    `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard-cliente`, t.btnText
  );
  try { return await resend.emails.send({ from: EMAIL_FROM, to: email, subject: `📦 ${t.pkgReceivedTitle}`, html }); } catch (e) { return { error: e }; }
};

export const sendShippedEmail = async (email: string, name: string, trackingGMC: string, carrier: string, lang: string = 'en') => {
  const t = getT(lang);
  const html = baseTemplate(
    t.shippedTitle,
    `<p>Hola <strong>${name}</strong>,</p>
     <p>${t.shippedBody}</p>
     <div class="info-box">
       <div class="info-row"><span class="label">GMC Tracking:</span><br><span class="value">${trackingGMC}</span></div>
       <div class="info-row"><span class="label">${t.carrier}:</span><br><span class="value">${carrier}</span></div>
       <div class="info-row"><span class="label">${t.status}:</span><br><span class="value">${t.statusTransit}</span></div>
     </div>`,
    t.footer,
    `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard-cliente/rastreo/${trackingGMC}`, t.btnText
  );
  try { return await resend.emails.send({ from: EMAIL_FROM, to: email, subject: `✈️ ${t.shippedTitle}`, html }); } catch (e) { return { error: e }; }
};

export const sendConsolidationRequestEmail = async (email: string, name: string, packageCount: number, trackingId: string, lang: string = 'en') => {
  const t = getT(lang);
  const html = baseTemplate(
    t.consolidationTitle,
    `<p>Hola <strong>${name}</strong>,</p>
     <p>${t.consolidationBody}</p>
     <div class="info-box">
       <div class="info-row"><span class="label">${t.idRequest}:</span><br><span class="value">${trackingId}</span></div>
       <div class="info-row"><span class="label">${t.pkgCount}:</span><br><span class="value">${packageCount}</span></div>
       <div class="info-row"><span class="label">${t.status}:</span><br><span class="value" style="color:#d97706;">${t.statusProcessing}</span></div>
     </div>
     <p>${t.consolidationNote}</p>`,
    t.footer,
    `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard-cliente`, t.btnText
  );
  try { return await resend.emails.send({ from: EMAIL_FROM, to: email, subject: `🔄 ${t.consolidationTitle}`, html }); } catch (e) { return { error: e }; }
};

export const sendShipmentDispatchedEmail = async (
    email: string, name: string, gmcId: string, courier: string, tracking: string, lang: string = 'en'
) => {
  const t = getT(lang);
  const html = baseTemplate(
    t.dispatchedTitle,
    `<p>Hola <strong>${name}</strong>,</p>
     <p>${t.dispatchedBody}</p>
     <div class="info-box">
       <div class="info-row"><span class="label">${t.idInternal}:</span><br><span class="value">${gmcId}</span></div>
       <div class="info-row"><span class="label">${t.carrier}:</span><br><span class="value">${courier}</span></div>
       <div class="info-row"><span class="label">${t.trackingOfficial}:</span><br><span class="value" style="font-family:monospace; font-size:16px;">${tracking}</span></div>
     </div>
     <p>${t.trackNote}</p>`,
    t.footer,
    `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard-cliente/en-transito`, t.btnText
  );
  try { return await resend.emails.send({ from: EMAIL_FROM, to: email, subject: `✈️ ${t.dispatchedTitle}`, html }); } catch (e) { return { error: e }; }
};

export const sendPackageDeliveredEmail = async (email: string, tracking: string, lang: string = 'en') => {
  const t = getT(lang);
  const html = baseTemplate(
    t.deliveredTitle,
    `<p>${t.deliveredBody} <strong>${tracking}</strong>.</p>
     <div class="info-box">
       <div class="info-row"><span class="label">${t.status}:</span><br><span class="value" style="color:green;">${t.statusDelivered}</span></div>
     </div>`,
    t.footer,
    `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard-cliente/en-destino`, t.btnText
  );
  try { return await resend.emails.send({ from: EMAIL_FROM, to: email, subject: `📬 ${t.deliveredTitle}`, html }); } catch (e) { return { error: e }; }
};

export const sendPickupReadyEmail = async (email: string, tracking: string) => {
    console.log(`📧 [Resend] Pickup listo para ${tracking}`);
    return true;
};

// COMPATIBILIDAD (Fallback simple)
export const sendPackageDispatchedEmail = async (email: string, text: string) => {
    return await resend.emails.send({ from: EMAIL_FROM, to: email, subject: 'Update Gasp Maker Cargo', html: `<p>${text}</p>` });
};

// =============================================================================
// 🚨 PARTE 4: ALERTAS PARA EL ADMIN (TÚ)
// =============================================================================

export const sendAdminConsolidationAlert = async (clientName: string, count: number, trackingId: string) => {
  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: ADMIN_EMAIL,
      subject: `🔔 CONSOLIDAR: ${clientName} (${count} pkgs)`,
      html: baseTemplate(
        "Nueva Solicitud de Consolidación",
        `<p>El cliente <strong>${clientName}</strong> ha solicitado consolidar.</p>
         <div class="info-box">
            <div class="info-row"><span class="label">ID Solicitud:</span><br><span class="value">${trackingId}</span></div>
            <div class="info-row"><span class="label">Cantidad:</span><br><span class="value">${count} paquetes</span></div>
         </div>
         <p>Por favor, procede a re-empacar y pesar.</p>`,
        "Admin Notification",
        "https://gaspmakercargo.com/admin/consolidaciones", "Ir al Panel Admin"
      )
    });
  } catch (error) { console.error("Error alerta admin consolidación:", error); }
};

export const sendAdminPaymentAlert = async (clientName: string, amount: number, serviceType: string, orderId: string) => {
  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: ADMIN_EMAIL,
      subject: `💰 PAGO RECIBIDO: $${amount.toFixed(2)} - ${serviceType}`,
      html: baseTemplate(
        "Nuevo Pago Recibido",
        `<p>El cliente <strong>${clientName}</strong> ha completado un pago.</p>
         <div class="info-box">
            <div class="info-row"><span class="label">Servicio:</span><br><span class="value" style="color:#d97706;">${serviceType}</span></div>
            <div class="info-row"><span class="label">Monto:</span><br><span class="value">$${amount.toFixed(2)}</span></div>
            <div class="info-row"><span class="label">Orden ID:</span><br><span class="value">#${orderId}</span></div>
         </div>
         <p>Acción requerida: Verificar y procesar el servicio (Driver, Salida o Entrega).</p>`,
        "Admin Notification",
        "https://gaspmakercargo.com/admin/pagos", "Gestionar Orden"
      )
    });
  } catch (error) { console.error("Error alerta admin pago:", error); }
};
// 🔥 NUEVO: Función especial para Pay & Go (Mostrador - Adaptada para Clientes sin Contraseña)
export const sendPayAndGoReceiptEmail = async (
    email: string, name: string, tracking: string, destination: string, amount: number, method: string, lang: string = 'en'
) => {
  const t = getT(lang);
  const title = lang === 'es' ? "¡Recibo de Envío en Mostrador! 📦" : "Store Shipment Receipt! 📦";
  
  const body = lang === 'es' 
    ? "Tu paquete ha sido procesado exitosamente en nuestra sucursal. Conserva este recibo y tu número de tracking." 
    : "Your package has been successfully processed at our store. Keep this receipt and your tracking number.";
    
  const trackInstructions = lang === 'es'
    ? "Puedes rastrear este envío introduciendo tu número de tracking en la página oficial del transportista."
    : "You can track this shipment by entering your tracking number on the official carrier's website.";

  const html = baseTemplate(
    title,
    `<p>Hola <strong>${name}</strong>,</p>
     <p>${body}</p>
     <div class="info-box">
        <div class="info-row"><span class="label">Tracking:</span><br><span class="value" style="color: #2563eb; font-size: 18px; font-family: monospace;">${tracking}</span></div>
        <div class="info-row"><span class="label">Destino / Destination:</span><br><span class="value">${destination}</span></div>
        <div class="info-row"><span class="label">Método / Method:</span><br><span class="value">${method}</span></div>
        <div class="info-row" style="margin-top: 15px;"><span class="label">${t.total}:</span><br><span class="value" style="color: #059669; font-size: 18px;">$${amount.toFixed(2)} USD</span></div>
     </div>
     <p style="font-size: 14px; color: #4b5563;"><em>${trackInstructions}</em></p>
     <p>${t.thanks}</p>`,
    t.footer,
    `${process.env.NEXT_PUBLIC_BASE_URL}`, // 👈 Lo mandamos a la web pública, NO al login
    lang === 'es' ? "Visitar Web Principal" : "Visit Homepage"
  );
  try { return await resend.emails.send({ from: EMAIL_FROM, to: email, subject: `🧾 ${title}`, html }); } catch (e) { return { error: e }; }
};