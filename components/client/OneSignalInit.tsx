"use client";

import { useEffect, useRef } from "react";
import OneSignal from "react-onesignal";

export default function OneSignalInit({ userId }: { userId?: string }) {
  const initialized = useRef(false);

  useEffect(() => {
    const initOneSignal = async () => {
      // 1. Inicializamos OneSignal para todos (logueados y no logueados)
      if (!initialized.current) {
        try {
          await OneSignal.init({
            appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || "85dd46b9-59dc-400a-843e-ce19b110861c",
            allowLocalhostAsSecureOrigin: true,
          });
          initialized.current = true;
        } catch (error) {
          console.error("Error conectando a OneSignal:", error);
          return;
        }
      }

      // 🔥 EL PARCHE: Solo hacemos "Login" si realmente hay un ID válido
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
  }, [userId]); // El useEffect volverá a correr cuando el userId cambie de undefined al ID real

  return null;
}