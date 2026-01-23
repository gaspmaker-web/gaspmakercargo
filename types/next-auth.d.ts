import NextAuth, { DefaultSession, User } from "next-auth";

// Extiende el tipo 'User' de NextAuth para que coincida con tu BD
interface IUser extends DefaultSession {
  id: string;
  suiteNo: string;
  role: string;
}

// Extiende el tipo 'Session'
declare module "next-auth" {
  interface Session {
    user: IUser;
  }
  // Extiende el tipo 'User' que se pasa a los callbacks
  interface User {
    id: string;
    suiteNo: string;
    role: string;
  }
}

// Extiende el tipo 'JWT'
declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    suiteNo: string;
    role: string;
  }
}

