// lib/onesignal-server.ts

export async function sendPushNotification(userId: string, title: string, message: string, url?: string) {
  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
  const apiKey = process.env.ONESIGNAL_REST_API_KEY;

  if (!appId || !apiKey) {
    console.error("❌ Faltan las llaves de OneSignal en el .env");
    return;
  }

  try {
    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `Basic ${apiKey}`,
      },
      body: JSON.stringify({
        app_id: appId,
        include_external_user_ids: [userId], // 👈 El ID del cliente en Supabase/Prisma
        headings: { en: title, es: title },
        contents: { en: message, es: message },
        url: url || "https://gaspmakercargo.com/dashboard",
      }),
    });

    const data = await response.json();
    console.log("🔔 Notificación de OneSignal enviada:", data);
    return data;
  } catch (error) {
    console.error("❌ Error enviando Push:", error);
  }
}