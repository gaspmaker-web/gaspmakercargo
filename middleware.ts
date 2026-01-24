import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import { routing } from './navigation';

// 1. Inicializamos la autenticación
const { auth } = (NextAuth as any)(authConfig);

const intlMiddleware = createMiddleware(routing);

export default auth((req: any) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth?.user;
  const { pathname } = nextUrl;
  
  // Accedemos al rol
  const role = req.auth?.user?.role; 
  
  const currentLocale = pathname.split('/')[1] || routing.defaultLocale;

  // --- 1. Definición de Áreas ---
  // NOTA: Si el build sigue fallando, comenta temporalmente la línea de account-settings
  const isClientArea = pathname.includes('/dashboard-cliente') || 
                       pathname.includes('/account-settings');
  
  const isAdminArea = pathname.includes('/dashboard-admin');
  const isDriverArea = pathname.includes('/dashboard-driver');
  
  const isProtectedRoute = isClientArea || isAdminArea || isDriverArea;

  // --- 2. Protección Básica: Login Requerido ---
  if (isProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL(`/${currentLocale}/login-cliente`, req.url));
  }

  // --- 3. SEGREGACIÓN DE ROLES ---
  
  if (isLoggedIn) {
    // A) Bloqueo para ADMIN / WAREHOUSE
    if ((role === 'ADMIN' || role === 'WAREHOUSE') && (isClientArea || isDriverArea)) {
        return NextResponse.redirect(new URL(`/${currentLocale}/dashboard-admin`, req.url));
    }

    // B) Bloqueo para DRIVER
    if (role === 'DRIVER' && (isClientArea || isAdminArea)) {
        return NextResponse.redirect(new URL(`/${currentLocale}/dashboard-driver`, req.url));
    }

    // C) Bloqueo para CLIENTE
    if (role === 'CLIENTE' && (isAdminArea || isDriverArea)) {
        return NextResponse.redirect(new URL(`/${currentLocale}/dashboard-cliente`, req.url));
    }
  }

  return intlMiddleware(req);
});

export const config = {
  // ✅ CORRECCIÓN CLAVE PARA EL BUILD:
  // Hemos añadido exclusions explícitas para _vercel, _next y extensiones de archivo comunes.
  // Esto evita que el middleware bloquee el proceso de construcción estática.
  matcher: [
    '/((?!api|_next|_vercel|print|.*\\..*).*)'
  ]
};