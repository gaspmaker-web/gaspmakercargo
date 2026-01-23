// next-auth.d.ts

import { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

// Extiende el objeto User de NextAuth para incluir campos de Prisma
declare module "next-auth" {
  interface User extends DefaultUser {
    // Solo necesitamos los campos que varían por cliente
    suiteNo: string;
    // 👇 CRUCIAL: Añadido para la protección de rutas
    role: string; 
  }

  // Extiende el objeto Session para exponer los datos en el frontend
  interface Session extends DefaultSession {
    user: {
      id: string; // El ID de usuario (necesario para la pre-alerta)
      suiteNo: string; // El número de casillero único
      // 👇 CRUCIAL: Añadido para la protección de rutas
      role: string; 
    } & DefaultSession["user"];
  }
}

// Extiende el objeto JWT para guardar los datos en el token
declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    suiteNo: string;
    // 👇 CRUCIAL: Añadido para la protección de rutas
    role: string;
  }
}
