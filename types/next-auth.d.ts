import NextAuth, { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  /**
   * Retorna por useSession, getSession y recibida como prop en el Provider de Session
   */
  interface Session {
    user: {
      id: string;
      suiteNo: string;
      role: string;
    } & DefaultSession["user"]; // Mantiene propiedades por defecto (name, email, image)
  }

  /**
   * La forma del usuario en la base de datos y lo que retorna el adaptador.
   */
  interface User {
    id: string;
    suiteNo: string;
    role: string;
  }
}

declare module "next-auth/jwt" {
  /**
   * Retornado por el callback `jwt` y `getToken`, cuando se usan sesiones JWT
   */
  interface JWT {
    id: string;
    suiteNo: string;
    role: string;
  }
}
