"use client";

import { useEffect, useRef } from "react";
import OneSignal from "react-onesignal";

export default function OneSignalInit({ userId }: { userId?: string }) {
  const initialized = useRef(false);

  useEffect(() => {
    const initOneSignal = async () => {
      if (!initialized.current) {
        try {
          await OneSignal.init({
            appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || "85dd46b9-59dc-400a-843e-ce19b110861c",
            allowLocalhostAsSecureOrigin: true,
          });
          initialized.current = true;
          
          // 🔥 LA LÍNEA MÁGICA: Obliga a mostrar el pop-up de "Permitir Notificaciones" 🔥
          await OneSignal.Slidedown.promptPush();
          
        } catch (error) {
          console.error("Error conectando a OneSignal:", error);
          return;
        }
      }

      if (userId && initialized.current) {
        try {
          console.log("🔗 Vinculando dispositivo con usuario ID:", userId);
          await OneSignal.login(userId);
        } catch (loginError) {
          console.error("Error al vincular el usuario con OneSignal:", loginError);
        }
      }
    };

    initOneSignal();
  }, [userId]);

  return null;
}