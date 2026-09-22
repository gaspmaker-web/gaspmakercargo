import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function sendSMS(to: string, message: string): Promise<boolean> {
  try {
    if (!to || !message) return false;

    // Normalizar número — asegurar formato E.164
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

// 🔥 MENSAJES PREDEFINIDOS GMC
export const SMS_TEMPLATES = {
  packageReceived: (tracking: string, weight: string) =>
    `Gasp Maker LLC: Your package ${tracking} has arrived at our Miami warehouse (${weight} lbs). Upload your invoice at gaspmakercargo.com. Reply STOP to opt out.`,

  consolidationReady: (amount: string) =>
    `Gasp Maker LLC: Your consolidation is ready. Total: $${amount}. Pay now at gaspmakercargo.com. Reply STOP to opt out.`,

  shipmentDispatched: (tracking: string) =>
    `Gasp Maker LLC: Shipment dispatched! Tracking: ${tracking}. Track at gaspmakercargo.com. Reply STOP to opt out.`,
};
