import NextAuth from "next-auth";
import { authConfig } from "./auth.config"; // ✅ IMPORTANTE: Usamos la config ligera
import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import { routing } from './navigation';

// 1. Inicializamos la autenticación con la configuración ligera (Compatible con Edge)
// 🚨 CORRECCIÓN: Usamos (as any) para que TypeScript acepte la función sin errores
const { auth } = (NextAuth as any)(authConfig);

const intlMiddleware = createMiddleware(routing);

export default auth((req: any) => { // Agregamos :any a req para evitar quejas de tipos inferidos
  const { nextUrl } = req;
  // req.auth ya viene inyectado gracias al wrapper de NextAuth de arriba
  const isLoggedIn = !!req.auth?.user;
  const { pathname } = nextUrl;
  
  // Accedemos al rol directamente desde req.auth
  // (Nota: req.auth es la nueva forma de acceder a la sesión en v5 dentro del middleware)
  const role = req.auth?.user?.role; 
  
  const currentLocale = pathname.split('/')[1] || routing.defaultLocale;

  // --- 1. Definición de Áreas (TU LÓGICA ORIGINAL) ---
  const isClientArea = pathname.includes('/dashboard-cliente') || 
                       pathname.includes('/account-settings');
  
  const isAdminArea = pathname.includes('/dashboard-admin');
  const isDriverArea = pathname.includes('/dashboard-driver');
  
  const isProtectedRoute = isClientArea || isAdminArea || isDriverArea;

  // --- 2. Protección Básica: Login Requerido ---
  if (isProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL(`/${currentLocale}/login-cliente`, req.url));
  }

  // --- 3. SEGREGACIÓN DE ROLES (El Tráfico) ---
  
  if (isLoggedIn) {
    // A) Bloqueo para ADMIN / WAREHOUSE
    // Si intentan entrar a zona de cliente o driver -> van a Admin
    if ((role === 'ADMIN' || role === 'WAREHOUSE') && (isClientArea || isDriverArea)) {
        return NextResponse.redirect(new URL(`/${currentLocale}/dashboard-admin`, req.url));
    }

    // B) Bloqueo para DRIVER
    // Si intenta entrar a zona de cliente o admin -> va a Driver
    if (role === 'DRIVER' && (isClientArea || isAdminArea)) {
        return NextResponse.redirect(new URL(`/${currentLocale}/dashboard-driver`, req.url));
    }

    // C) Bloqueo para CLIENTE
    // Si intenta entrar a zona admin o driver -> va a Cliente
    if (role === 'CLIENTE' && (isAdminArea || isDriverArea)) {
        return NextResponse.redirect(new URL(`/${currentLocale}/dashboard-cliente`, req.url));
    }
  }

  return intlMiddleware(req);
});

export const config = {
  // Ignoramos rutas de API, archivos estáticos y la ruta de impresión
  matcher: ['/((?!api|_next|print|.*\\..*).*)']
};