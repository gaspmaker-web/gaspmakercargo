import { NextRequest, NextResponse } from 'next/server';

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'gaspmaker_whatsapp_2026';
const WHATSAPP_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || '';
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || '';
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '1234833769723148';

// GET - Verificacion de Meta
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

// POST - Mensajes entrantes
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages;

    if (!messages || messages.length === 0) {
      return NextResponse.json({ status: 'no messages' });
    }

    const message = messages[0];
    const from = message.from;
    const text = message.text?.body;

    if (!text) return NextResponse.json({ status: 'no text' });

    // Llamar a Claude AI
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
        system: `Eres el asistente virtual de Gasp Maker Cargo, una empresa de logística y envíos internacionales ubicada en Miami, FL. 
        
Ayudas a clientes con:
- Información sobre envíos y paquetes
- Precios y tarifas de consolidaciones
- Estado de paquetes
- Pickup scheduling
- Preguntas generales sobre servicios

Responde siempre en el idioma que el cliente use (español, inglés, portugués o francés).
Sé amable, profesional y conciso. Máximo 3 párrafos por respuesta.
Si no puedes resolver algo, da el email: gm@gaspmaker.com o teléfono: +1 786-282-0763.`,
        messages: [{ role: 'user', content: text }],
      }),
    });

    const claudeData = await claudeResponse.json();
    const reply = claudeData?.content?.[0]?.text || 'Hola! Gracias por contactar Gasp Maker Cargo. ¿En qué podemos ayudarte?';

    // Enviar respuesta por WhatsApp
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
