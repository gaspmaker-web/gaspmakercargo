"use client";

import { SessionProvider } from "next-auth/react";
import { useState, useCallback } from "react";
import SplashScreen from "@/components/SplashScreen";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);

  const handleSplashComplete = useCallback(() => {
    setIsLoading(false);
  }, []);

  return (
    <SessionProvider>
      {isLoading && (
        <SplashScreen onComplete={handleSplashComplete} />
      )}
      <div
        style={{
          opacity: isLoading ? 0 : 1,
          transition: "opacity 0.4s ease-in",
        }}
      >
        {children}
      </div>
    </SessionProvider>
  );
}
