"use client";

import { SessionProvider } from "next-auth/react";
import { useState, useCallback } from "react";
import SplashScreen from "@/components/SplashScreen";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  const handleSplashComplete = useCallback(() => {
    setIsVisible(true);
    setTimeout(() => setIsLoading(false), 400);
  }, []);

  return (
    <SessionProvider>
      {isLoading && (
        <SplashScreen onComplete={handleSplashComplete} />
      )}
      <div
        style={{
          opacity: isVisible ? 1 : 0,
          transition: "opacity 0.5s ease-in",
        }}
      >
        {children}
      </div>
    </SessionProvider>
  );
}
