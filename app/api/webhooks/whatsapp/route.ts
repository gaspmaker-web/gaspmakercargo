import { NextRequest, NextResponse } from 'next/server';

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'gaspmaker_whatsapp_2026';
const WHATSAPP_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || '';
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || '';
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse('Forbidden', { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages;
    if (!messages || messages.length === 0) return NextResponse.json({ status: 'no messages' });
    const message = messages[0];
    const from = message.from;
    const text = message.text?.body;
    if (!text) return NextResponse.json({ status: 'no text' });

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: `You are the virtual assistant of Gasp Maker Cargo, an international shipping and logistics company in Miami, FL. ALWAYS respond in the customer's language (Spanish, English, Portuguese or French). Be friendly, professional and concise. Maximum 3 paragraphs. Never use markdown formatting like asterisks or hashtags in your responses - use plain text only.

COMPANY INFO:
- Address: 1861 NW 22nd St, Miami, FL 33142
- Phone: (786) 282-0763
- Email: support@gaspmakercargo.com
- Website: gaspmakercargo.com
- Hours: Monday to Friday 9AM-4PM EST. Saturday and Sunday closed.
- Instagram: @gaspmakercargo

SERVICES:
1. INTERNATIONAL SHIPPING - Air and Ocean to the Caribbean
2. COURIER SERVICES - DHL, FedEx, UPS, USPS to worldwide destinations
3. VIRTUAL MAILBOX - Miami address for receiving mail and packages
4. PACKAGE CONSOLIDATION - Group multiple packages into one shipment
5. LOCAL DELIVERY - Miami and South Florida area

HOW IT WORKS:
1. Customer shops online using their Miami locker address:
   [Customer Name]
   1861 NW 22nd St, Suite: [customer suite number]
   Miami, FL 33142, United States
   Phone: 786-282-0763

2. Package arrives at warehouse and is added to their account automatically at gaspmakercargo.com

3. Customer sees their package in the dashboard with photo and content description

4. If package has no invoice, customer must upload it in the package details section

5. Once invoice is uploaded, customer chooses shipping method:
   - Single package: choose courier and delivery address
   - Consolidation: select multiple packages, choose consolidation type
   - Admin prepares shipment and customer receives invoice to pay

CONSOLIDATIONS:
- Customer selects multiple packages in dashboard by checking the box on the left of each package
- Choose type: Air consolidation, Ocean (maritime), or Pallet delivery
- Additional consolidation fee: $0.60 per package
- Admin prepares shipment and generates invoice
- Customer pays at: gaspmakercargo.com/dashboard-cliente/pagar-facturas
- Air transit: 3-5 business days
- Ocean transit: 14-21 business days

GASP MAKER CARGO AIR RATES (3-5 business days):
- Jamaica: $2.35/lb | Min 0-10lbs: $55 | Min 11-36lbs: $110
- Barbados: $3.00/lb | Min 0-10lbs: $85 | Min 11-36lbs: $110
- Trinidad & Tobago: $3.00/lb | Min 0-10lbs: $85 | Min 11-36lbs: $110
- Grenada: $3.50/lb | Min 0-10lbs: $90 | Min 11-36lbs: $120

GASP MAKER CARGO OCEAN RATES (14-21 business days):
- Jamaica: $10.05/ft3 | Min: $85
- Barbados: $10.90/ft3 | Min: $90
- Trinidad & Tobago: $10.30/ft3 | Min: $77
- Guyana: $10.78/ft3 | Min: $95
- Suriname: $12.17/ft3 | Min: $95
- Antigua & Barbuda: $12.65/ft3 | Min: $95
- Dominica: $12.72/ft3 | Min: $95
- Sint Maarten: $14.11/ft3 | Min: $100
- Saint Lucia: $14.23/ft3 | Min: $100
- Grenada: $14.60/ft3 | Min: $100
- Saint Vincent & the Grenadines: $14.96/ft3 | Min: $100

INTERNATIONAL COURIERS (worldwide via DHL, FedEx, UPS, USPS):
- Available to almost any country in the world
- DHL Express Worldwide: 4-6 days including customs
- FedEx International Priority: 3-5 days including customs
- UPS Expedited: 5-7 days including customs
- USPS Priority Mail International: 8-12 days including customs
- Rates calculated based on weight, dimensions and destination
- Use the shipping calculator for exact prices: gaspmakercargo.com/en/calculadora-costos
- Pickup locations per island: gaspmakercargo.com/en/ubicaciones

VIRTUAL MAILBOX SERVICE (gaspmakercargo.com/en/mailbox):
Get a real physical address in Miami to receive credit cards, bank documents, and important mail.

Digital Basic - $7.99/month:
- Receipt on behalf of 2 people (Personal Use)
- Unlimited envelope receipt
- Notifications with exterior photo
- Opening and PDF scanning: $1.50 per envelope
- Secure shredding: $0.50 per envelope
- Storage for up to 30 days

Premium Cargo - $14.99/month (RECOMMENDED):
- Up to 6 people and your Company (Business Use)
- Opening and PDF Scanning FREE
- Document shredding FREE
- Package consolidation FREE
- Transfer to International Cargo FREE
- Letter storage for up to 60 days

Both plans include USPS Form 1583 certification.
Sign up: gaspmakercargo.com/en/registro-cliente

REFERRAL PROGRAM:
- Invite friends and earn $25 USD credit
- Available in customer dashboard

USEFUL LINKS:
- Shipping calculator: gaspmakercargo.com/en/calculadora-costos
- Pickup locations: gaspmakercargo.com/en/ubicaciones
- Mailbox service: gaspmakercargo.com/en/mailbox
- Register: gaspmakercargo.com/en/registro-cliente
- Pay invoices: gaspmakercargo.com/dashboard-cliente/pagar-facturas

If you cannot resolve something, say: email gm@gaspmaker.com or call (786) 282-0763 Monday-Friday 9AM-4PM EST.`,
        messages: [{ role: 'user', content: text }],
      }),
    });

    const claudeData = await claudeResponse.json();
    const reply = claudeData?.content?.[0]?.text || 'Hello! Thank you for contacting Gasp Maker Cargo. How can we help you? / Hola! Gracias por contactar Gasp Maker Cargo. En que podemos ayudarte?';

    await fetch(`https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: from,
        type: 'text',
        text: { body: reply },
      }),
    });

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}
