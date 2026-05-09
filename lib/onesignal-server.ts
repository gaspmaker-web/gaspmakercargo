// lib/onesignal-server.ts

export async function sendPushNotification(userId: string, title: string, message: string, urlPath?: string) {
  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
  const apiKey = process.env.ONESIGNAL_REST_API_KEY;

  if (!appId || !apiKey) {
    console.error("❌ Faltan las llaves de OneSignal en el .env");
    return;
  }

  // 🔥 REGLA DE ORO PARA ONESIGNAL: La URL tiene que ser ABSOLUTA (https://...) 🔥
  let finalUrl = "https://www.gaspmakercargo.com/dashboard-cliente";
  
  if (urlPath) {
    if (urlPath.startsWith("http")) {
      finalUrl = urlPath; // Si ya viene completa, la dejamos intacta
    } else {
      // Si viene cortada (ej. "/dashboard-cliente/notificaciones"), le pegamos tu dominio oficial
      finalUrl = `https://www.gaspmakercargo.com${urlPath.startsWith('/') ? '' : '/'}${urlPath}`;
    }
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
        
        // 🔥 Redirección blindada 🔥
        url: finalUrl, 
        
        // 🔥 Forzando tu logo corporativo 🔥
        chrome_web_icon: "https://www.gaspmakercargo.com/gaspmakercargoproject.png",
        firefox_icon: "https://www.gaspmakercargo.com/gaspmakercargoproject.png",
        safari_web_icon: "https://www.gaspmakercargo.com/gaspmakercargoproject.png"
      }),
    });

    const data = await response.json();
    
    // Agregamos un log para ver si OneSignal se queja de algo
    if (data.errors) {
       console.error("❌ OneSignal rechazó el Push:", data.errors);
    } else {
       console.log("🔔 Notificación de OneSignal enviada:", data);
    }
    
    return data;
  } catch (error) {
    console.error("❌ Error interno enviando Push:", error);
  } 
}