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
    async jwt({ token, user, trigger, session }: any) { // Agregamos :any para evitar quejas
      // 1. Al iniciar sesión (primer carga)
      if (user) {
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