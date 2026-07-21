import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import { routing } from './navigation';

const { auth } = (NextAuth as any)(authConfig);
const intlMiddleware = createMiddleware(routing);

// ==========================================
// 🏢 CARGOOS: DETECCIÓN DE TENANT
// ==========================================
function detectTenant(req: any) {
  const host = req.headers.get('host') || '';
  
  // En desarrollo siempre es GaspMaker
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    return 'gaspmaker';
  }
  // Dominio de GaspMaker
  if (host.includes('gaspmakercargo.com')) {
    return 'gaspmaker';
  }
  // Dominio de CargoOS — plataforma de ventas
  if (host.includes('cargoos.io')) {
    return 'cargoos';
  }
  // Cualquier otro dominio — extraer subdominio o dominio completo
  const subdomain = host.split('.')[0];
  return subdomain;
}

export default auth((req: any) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth?.user;
  const { pathname } = nextUrl;
  const role = req.auth?.user?.role?.trim(); 



  // ================================================================
  // 🛡️ CORRECCIÓN DE IDIOMA (Anti-Bucle / Too many redirects)
  // ================================================================
  const localeSegment = pathname.split('/')[1];
  const validLocales = ['es', 'en', 'fr', 'pt'];
  const currentLocale = validLocales.includes(localeSegment) 
      ? localeSegment 
      : routing.defaultLocale || 'es';

        // 🏢 DETECTAR TENANT
  const tenantSlug = detectTenant(req);
  // 🏢 Pasar host original para detección correcta en Vercel
const requestHeaders = new Headers(req.headers);
requestHeaders.set('x-forwarded-host', req.headers.get('host') || '');
  

  // --- 1. Definición de Áreas ---
  const isClientArea = pathname.includes('/dashboard-cliente') || 
                       pathname.includes('/account-settings');
  const isAdminArea = pathname.includes('/dashboard-admin');
  const isDriverArea = pathname.includes('/dashboard-driver');
  const isProtectedRoute = isClientArea || isAdminArea || isDriverArea;

  // --- 2. Protección Básica: Login Requerido ---
  if (isProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL(`/${currentLocale}/login-cliente`, req.url));
  }

  // --- 3. SEGREGACIÓN DE ROLES (El Semáforo) ---
  if (isLoggedIn) {
    if (pathname.includes('/login-cliente') || pathname.includes('/registro-cliente')) {
        if (role === 'DRIVER') {
            return NextResponse.redirect(new URL(`/${currentLocale}/dashboard-driver`, req.url));
        }
        if (role === 'ADMIN') {
            return NextResponse.redirect(new URL(`/${currentLocale}/dashboard-admin`, req.url));
        }
        if (role === 'WAREHOUSE') {
            return NextResponse.redirect(new URL(`/${currentLocale}/dashboard-admin/paquetes`, req.url));
        }
        return NextResponse.redirect(new URL(`/${currentLocale}/dashboard-cliente`, req.url));
    }

    if ((role === 'ADMIN' || role === 'WAREHOUSE') && (isClientArea || isDriverArea)) {
        const target = role === 'WAREHOUSE' ? 'dashboard-admin/paquetes' : 'dashboard-admin';
        return NextResponse.redirect(new URL(`/${currentLocale}/${target}`, req.url));
    }

    if (role === 'WAREHOUSE' && isAdminArea) {
      const isAllowedPath = 
        pathname.includes('/paquetes') || 
        pathname.includes('/crear-envio') || 
        pathname.includes('/consolidaciones') ||
        pathname.includes('/pay-and-go') ||
        pathname.includes('/tareas-buzon') ||
        pathname.includes('/recepcion-buzones') ||
        pathname.includes('/inventario-buzones');

      if (!isAllowedPath) {
         return NextResponse.redirect(new URL(`/${currentLocale}/dashboard-admin/paquetes`, req.url));
      }
    }

    if (role === 'DRIVER' && (isClientArea || isAdminArea)) {
        return NextResponse.redirect(new URL(`/${currentLocale}/dashboard-driver`, req.url));
    }

    if (role === 'CLIENTE' && (isAdminArea || isDriverArea)) {
        return NextResponse.redirect(new URL(`/${currentLocale}/dashboard-cliente`, req.url));
    }
  }

// 🏢 Pasar tenant slug via header a todas las páginas
const response = intlMiddleware(req);
if (response) {
  response.headers.set('x-tenant-slug', tenantSlug);
  response.headers.set('x-forwarded-host', req.headers.get('host') || '');
}
return response;
});

export const config = {
  matcher: ['/((?!api|_next|_vercel|print|.*\\..*).*)']
};