import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma"; // ✅ Usamos el cliente global (Vital para Supabase)
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config"; // 👈 Importamos la config del paso 1

// 🚨 CORRECCIÓN: Usamos (NextAuth as any) para arreglar el error "This expression is not callable"
export const { handlers, signIn, signOut, auth } = (NextAuth as any)({
  ...authConfig, // Heredamos tus callbacks y session
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials: any) { // Agregamos :any aquí por seguridad
        if (!credentials.email || !credentials.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        // ✅ CORRECCIÓN: Buscamos la contraseña en CUALQUIERA de las dos columnas
        const passwordInDb = user?.password || user?.password_hash;

        // Si no existe el usuario o no tiene ninguna contraseña, rechazamos
        if (!user || !passwordInDb) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          passwordInDb // Usamos la contraseña encontrada (sea vieja o nueva)
        );

        if (isPasswordValid) {
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            // 🔥 AGREGADO: Pasamos la imagen de la DB al objeto usuario inicial
            image: user.image, 
            role: user.role,
            suiteNo: user.suiteNo,
            phone: user.phone,
            countryCode: user.countryCode,
            dateOfBirth: user.dateOfBirth,
            address: user.address,
            cityZip: user.cityZip,
            country: user.country
          };
        }

        return null;
      },
    }),
  ],
});