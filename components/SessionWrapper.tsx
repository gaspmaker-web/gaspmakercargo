// components/SessionWrapper.tsx
"use client";

import { SessionProvider } from 'next-auth/react';
import React from 'react';

// Este componente solo recibe el 'session' del servidor y el 'children'
interface SessionWrapperProps {
    children: React.ReactNode;
    session: any; // El tipo 'any' es un placeholder si no tienes los tipos de NextAuth
}

export default function SessionWrapper({ children, session }: SessionWrapperProps) {
  // El SessionProvider (que usa React Context) ahora está
  // contenido en un componente de cliente y ya no dará error.
  return (
    <SessionProvider session={session}>
      {children}
    </SessionProvider>
  );
}