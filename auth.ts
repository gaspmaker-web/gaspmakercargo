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
  
  // 🔥 AGREGADO CRÍTICO: Forzamos la estrategia JWT.
  // Sin esto, Prisma intenta usar sesiones de base de datos y se salta tu lógica de roles.
  session: { strategy: "jwt" },

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

        // 🔥 MEJORA: Convertimos el email a minúsculas para evitar errores de "Usuario no encontrado"
        const email = (credentials.email as string).toLowerCase();

        const user = await prisma.user.findUnique({
          where: { email },
        });

        // ✅ CORRECCIÓN FINAL: Ya no existe 'password_hash'.
        // Ahora validamos directamente contra 'user.password' que contiene el hash.
        if (!user || !user.password) {
          return null; // O throw new Error("Credenciales inválidas");
        }

        // 🛡️ BLOQUEO DE SEGURIDAD CRÍTICO: VALIDACIÓN DE EMAIL
        // Si la columna emailVerified está vacía (null), rechazamos el inicio de sesión
        if (!user.emailVerified) {
          throw new Error("Debes verificar tu correo electrónico antes de acceder. Por favor, revisa tu bandeja de entrada.");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password // Usamos la única columna de contraseña válida
        );

        if (isPasswordValid) {
          // 🚀 RETORNO EXPLÍCITO:
          // Al devolver este objeto, le pasamos los datos a auth.config.ts
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            // 🔥 AGREGADO: Pasamos la imagen de la DB al objeto usuario inicial
            image: user.image, 
            role: user.role, // 👈 ¡Esto es lo que busca auth.config.ts!
            suiteNo: user.suiteNo,
            phone: user.phone,
            countryCode: user.countryCode,
            dateOfBirth: user.dateOfBirth,
            address: user.address,
            cityZip: user.cityZip,
            country: user.country
          };
        }

        return null; // O throw new Error("Contraseña incorrecta");
      },
    }),
  ],
});