import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function sendSMS(to: string, message: string): Promise<boolean> {
  try {
    if (!to || !message) return false;
    let phone = to.replace(/[^0-9+]/g, '');
    if (!phone.startsWith('+')) phone = '+1' + phone;
    await client.messages.create({
      body: message,
      messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
      to: phone
    });
    console.log(`✅ SMS sent to ${phone}`);
    return true;
  } catch (error: any) {
    console.error(`❌ SMS error to ${to}:`, error.message);
    return false;
  }
}

// 🔥 MENSAJES EN 4 IDIOMAS
const messages = {
  packageReceived: {
    en: (tracking: string, weight: string) =>
      `Gasp Maker LLC: Your package ${tracking} has arrived at our Miami warehouse (${weight} lbs). Upload your invoice at gaspmakercargo.com. Reply STOP to opt out.`,
    es: (tracking: string, weight: string) =>
      `Gasp Maker LLC: Tu paquete ${tracking} llegó a nuestro almacén de Miami (${weight} lbs). Sube tu factura en gaspmakercargo.com. Responde STOP para cancelar.`,
    pt: (tracking: string, weight: string) =>
      `Gasp Maker LLC: Seu pacote ${tracking} chegou ao nosso armazém em Miami (${weight} lbs). Envie sua fatura em gaspmakercargo.com. Responda STOP para cancelar.`,
    fr: (tracking: string, weight: string) =>
      `Gasp Maker LLC: Votre colis ${tracking} est arrivé à notre entrepôt de Miami (${weight} lbs). Téléchargez votre facture sur gaspmakercargo.com. Répondez STOP pour vous désabonner.`,
  },
  consolidationReady: {
    en: (amount: string) =>
      `Gasp Maker LLC: Your consolidation is ready. Total: $${amount}. Pay now at gaspmakercargo.com. Reply STOP to opt out.`,
    es: (amount: string) =>
      `Gasp Maker LLC: Tu consolidación está lista. Total: $${amount}. Paga en gaspmakercargo.com. Responde STOP para cancelar.`,
    pt: (amount: string) =>
      `Gasp Maker LLC: Sua consolidação está pronta. Total: $${amount}. Pague em gaspmakercargo.com. Responda STOP para cancelar.`,
    fr: (amount: string) =>
      `Gasp Maker LLC: Votre consolidation est prête. Total: $${amount}. Payez sur gaspmakercargo.com. Répondez STOP pour vous désabonner.`,
  },
  shipmentDispatched: {
    en: (tracking: string) =>
      `Gasp Maker LLC: Shipment dispatched! Tracking: ${tracking}. Track at gaspmakercargo.com. Reply STOP to opt out.`,
    es: (tracking: string) =>
      `Gasp Maker LLC: ¡Envío despachado! Tracking: ${tracking}. Rastrea en gaspmakercargo.com. Responde STOP para cancelar.`,
    pt: (tracking: string) =>
      `Gasp Maker LLC: Envio despachado! Rastreamento: ${tracking}. Rastreie em gaspmakercargo.com. Responda STOP para cancelar.`,
    fr: (tracking: string) =>
      `Gasp Maker LLC: Expédition envoyée! Suivi: ${tracking}. Suivez sur gaspmakercargo.com. Répondez STOP pour vous désabonner.`,
  }
};

type Locale = 'en' | 'es' | 'pt' | 'fr';

export const SMS_TEMPLATES = {
  packageReceived: (tracking: string, weight: string, locale: string = 'en') => {
    const lang = (['en','es','pt','fr'].includes(locale) ? locale : 'en') as Locale;
    return messages.packageReceived[lang](tracking, weight);
  },
  consolidationReady: (amount: string, locale: string = 'en') => {
    const lang = (['en','es','pt','fr'].includes(locale) ? locale : 'en') as Locale;
    return messages.consolidationReady[lang](amount);
  },
  shipmentDispatched: (tracking: string, locale: string = 'en') => {
    const lang = (['en','es','pt','fr'].includes(locale) ? locale : 'en') as Locale;
    return messages.shipmentDispatched[lang](tracking);
  },
};
