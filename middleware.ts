import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import { routing } from './navigation';

// 1. Inicializamos la autenticación con la config ligera (sin Prisma)
const { auth } = (NextAuth as any)(authConfig);

const intlMiddleware = createMiddleware(routing);

export default auth((req: any) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth?.user;
  const { pathname } = nextUrl;
  
  // 🧹 CORRECCIÓN CRÍTICA DE ROL:
  const role = req.auth?.user?.role?.trim(); 
  
  // ================================================================
  // 🛡️ CORRECCIÓN DE IDIOMA (Anti-Bucle / Too many redirects)
  // ================================================================
  const localeSegment = pathname.split('/')[1];
  const validLocales = ['es', 'en', 'fr', 'pt'];
  const currentLocale = validLocales.includes(localeSegment) 
      ? localeSegment 
      : routing.defaultLocale || 'es';
  // ================================================================

  // --- 1. Definición de Áreas ---
  const isClientArea = pathname.includes('/dashboard-cliente') || 
                       pathname.includes('/account-settings');
  
  const isAdminArea = pathname.includes('/dashboard-admin');
  const isDriverArea = pathname.includes('/dashboard-driver');
  
  // Rutas que requieren protección
  const isProtectedRoute = isClientArea || isAdminArea || isDriverArea;

  // --- 2. Protección Básica: Login Requerido ---
  if (isProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL(`/${currentLocale}/login-cliente`, req.url));
  }

  // --- 3. SEGREGACIÓN DE ROLES (El Semáforo) ---
  if (isLoggedIn) {
    
    // 🔥 NUEVA REGLA CRÍTICA: REDIRECCIÓN DESDE LOGIN 🔥
    if (pathname.includes('/login-cliente') || pathname.includes('/registro-cliente')) {
        if (role === 'DRIVER') {
            return NextResponse.redirect(new URL(`/${currentLocale}/dashboard-driver`, req.url));
        }
        // MODIFICADO: Separamos ADMIN y WAREHOUSE para mandarlos a sitios distintos
        if (role === 'ADMIN') {
            return NextResponse.redirect(new URL(`/${currentLocale}/dashboard-admin`, req.url));
        }
        if (role === 'WAREHOUSE') {
            // El Warehouse va directo a su área de trabajo (Paquetes)
            return NextResponse.redirect(new URL(`/${currentLocale}/dashboard-admin/paquetes`, req.url));
        }
        // Por defecto a cliente
        return NextResponse.redirect(new URL(`/${currentLocale}/dashboard-cliente`, req.url));
    }

    // A) ADMIN / WAREHOUSE: No pueden estar en zona de Cliente ni Chofer
    if ((role === 'ADMIN' || role === 'WAREHOUSE') && (isClientArea || isDriverArea)) {
        // Si es Warehouse y estaba perdido en zona cliente, lo mandamos a paquetes, si es Admin al dashboard
        const target = role === 'WAREHOUSE' ? 'dashboard-admin/paquetes' : 'dashboard-admin';
        return NextResponse.redirect(new URL(`/${currentLocale}/${target}`, req.url));
    }

    // A.1) 🔥 REGLA DE ORO PARA WAREHOUSE (JAULA DE SEGURIDAD) 🔥
    // Si es WAREHOUSE y ya está en zona Admin, verificamos que solo toque lo permitido.
    if (role === 'WAREHOUSE' && isAdminArea) {
      // Definimos las rutas permitidas (usando includes para ser flexible con sub-rutas)
      const isAllowedPath = 
        pathname.includes('/paquetes') || 
        pathname.includes('/crear-envio') || 
        pathname.includes('/consolidaciones');

      // Si NO está en una ruta permitida (ej: intenta ver el dashboard de gráficas)
      if (!isAllowedPath) {
         return NextResponse.redirect(new URL(`/${currentLocale}/dashboard-admin/paquetes`, req.url));
      }
    }

    // B) DRIVER: No pode estar en zona Cliente ni Admin
    if (role === 'DRIVER' && (isClientArea || isAdminArea)) {
        return NextResponse.redirect(new URL(`/${currentLocale}/dashboard-driver`, req.url));
    }

    // C) CLIENTE: No puede estar en zona Admin ni Chofer
    if (role === 'CLIENTE' && (isAdminArea || isDriverArea)) {
        return NextResponse.redirect(new URL(`/${currentLocale}/dashboard-cliente`, req.url));
    }
  }

  // Si pasa todas las reglas, dejamos que next-intl maneje el idioma
  return intlMiddleware(req);
});

// 🔥 CONFIGURACIÓN ÚNICA Y CORRECTA 🔥
export const config = {
  // Ignora: api, _next, _vercel, favicon y CUALQUIER archivo que tenga un punto (.*\\..*)
  // 🔥 CORRECCIÓN: Agregamos "print" a la lista de excepciones para que no rompa la etiqueta
  matcher: ['/((?!api|_next|_vercel|print|.*\\..*).*)']
};