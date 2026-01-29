// 1. Borramos la importación que causa problemas porque tu versión no se decide
// import type { NextAuthOptions } from "next-auth"; 

// ⚠️ Este archivo es ligero y compatible con Edge Runtime (Middleware)
export const authConfig = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login-cliente",
  },
  providers: [], // Se deja vacío aquí intencionalmente
  callbacks: {
    // 🔥 NUEVO: El "Portero" que permite entrar a Choferes y Bodega
    authorized({ auth, request: { nextUrl } }: any) {
      const isLoggedIn = !!auth?.user;
      
      // 🧹 CORRECCIÓN CRÍTICA: (Trim + UpperCase)
      // Limpiamos el rol igual que en el middleware. Esto evita el "Too many redirects".
      // Ahora 'DRIVER ' (con espacio) se convierte en 'DRIVER' y el sistema lo deja pasar.
      const role = auth?.user?.role?.trim()?.toUpperCase();
      
      // Definimos las rutas protegidas (usamos includes para ignorar el idioma /es/ o /en/)
      const isOnDashboardAdmin = nextUrl.pathname.includes('/dashboard-admin');
      const isOnDashboardDriver = nextUrl.pathname.includes('/dashboard-driver');
      const isOnDashboardClient = nextUrl.pathname.includes('/dashboard-cliente');
      const isOnLoginPage = nextUrl.pathname.includes('/login-cliente');

      // 🚀 NUEVO: REDIRECCIÓN AUTOMÁTICA AL LOGUEARSE
      // Si el usuario YA está logueado y trata de entrar al Login, lo mandamos a su sitio.
      if (isLoggedIn && isOnLoginPage) {
        if (role === 'DRIVER') {
          return Response.redirect(new URL('/dashboard-driver', nextUrl));
        }
        if (role === 'ADMIN' || role === 'WAREHOUSE') {
          return Response.redirect(new URL('/dashboard-admin', nextUrl));
        }
        return Response.redirect(new URL('/dashboard-cliente', nextUrl));
      }

      // A. LÓGICA PARA ADMIN Y BODEGA (Comparten dashboard-admin)
      if (isOnDashboardAdmin) {
        if (isLoggedIn) {
            // ✅ Permitimos entrar a ADMIN y a WAREHOUSE
            return role === 'ADMIN' || role === 'WAREHOUSE';
        }
        return false; // Redirigir al login
      }

      // B. LÓGICA PARA CHOFERES (Ruta exclusiva)
      if (isOnDashboardDriver) {
        if (isLoggedIn) {
            // ✅ Solo dejamos pasar si es DRIVER
            return role === 'DRIVER';
        }
        return false; // Redirigir al login
      }

      // C. LÓGICA PARA CLIENTES
      if (isOnDashboardClient) {
        if (isLoggedIn) {
            // 🛡️ PROTECCIÓN EXTRA: Si un Chofer intenta ir al dashboard de cliente, lo devolvemos al suyo
            if (role === 'DRIVER') {
                return Response.redirect(new URL('/dashboard-driver', nextUrl));
            }
            // Si un Admin intenta ir al dashboard de cliente, lo devolvemos al suyo (Opcional)
            if (role === 'ADMIN' || role === 'WAREHOUSE') {
                return Response.redirect(new URL('/dashboard-admin', nextUrl));
            }
            return true;
        } 
        return false; // Redirigir al login
      }

      return true;
    },

    // 👇 TUS CALLBACKS ORIGINALES (INTACTOS)
    async jwt({ token, user, trigger, session }: any) { // Agregamos :any para evitar quejas
      // 1. Al iniciar sesión (primer carga)
      if (user) {
        // 🕵️ DEBUG: Verificamos en la terminal que el rol llegue desde auth.ts
        console.log("✅ AUTH CONFIG: Recibiendo usuario:", user.email, "| Rol:", (user as any).role);

        token.id = user.id;
        token.role = (user as any).role;
        // 🔥 Guardamos la imagen en el token
        token.picture = (user as any).image; 

        token.suiteNo = (user as any).suiteNo;
        token.phone = (user as any).phone;
        token.countryCode = (user as any).countryCode;
        token.dateOfBirth = (user as any).dateOfBirth;
        token.address = (user as any).address;
        token.cityZip = (user as any).cityZip;
        token.country = (user as any).country;
      }

      // 2. Al actualizar datos desde el Frontend (update)
      if (trigger === "update" && session?.user) {
        if (session.user.image) token.picture = session.user.image;
        if (session.user.name) token.name = session.user.name;
        if (session.user.phone) token.phone = session.user.phone;
        if (session.user.countryCode) token.countryCode = session.user.countryCode;
        if (session.user.address) token.address = session.user.address;
        if (session.user.cityZip) token.cityZip = session.user.cityZip;
        if (session.user.country) token.country = session.user.country;
      }

      return token;
    },
    
    async session({ session, token }: any) { // Agregamos :any aquí también
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        // 🔥 Pasamos la imagen del token a la sesión visible
        session.user.image = token.picture as string;

        session.user.suiteNo = token.suiteNo as string;
        session.user.name = token.name; 
        session.user.phone = token.phone as string;
        session.user.countryCode = token.countryCode as string;
        (session.user as any).dateOfBirth = token.dateOfBirth;
        (session.user as any).address = token.address;
        (session.user as any).cityZip = token.cityZip;
        (session.user as any).country = token.country;
      }
      return session;
    },
  },
} as any; // 🚨 SOLUCIÓN FINAL: Forzamos el tipo 'any' para ignorar el conflicto de versiones