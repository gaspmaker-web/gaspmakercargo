"use client";

import { SessionProvider } from "next-auth/react";
import { useState, useCallback, useEffect } from "react";
import SplashScreen from "@/components/SplashScreen";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashComplete = useCallback(() => {
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
