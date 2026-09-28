"use client";

import { SessionProvider } from "next-auth/react";
import { useState, useCallback, useEffect } from "react";
import SplashScreen from "@/components/SplashScreen";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    const alreadySeen = sessionStorage.getItem("splash_shown");
    if (!alreadySeen) {
      setShowSplash(true);
    }
  }, []);

  const handleSplashComplete = useCallback(() => {
    sessionStorage.setItem("splash_shown", "true");
    setShowSplash(false);
  }, []);

  return (
    <SessionProvider>
      {showSplash && (
        <SplashScreen onComplete={handleSplashComplete} />
      )}
      {children}
    </SessionProvider>
  );
}
