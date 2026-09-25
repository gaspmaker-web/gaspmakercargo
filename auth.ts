import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma"; 
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config"; 

export const { handlers, signIn, signOut, auth } = (NextAuth as any)({
  ...authConfig, 
  adapter: PrismaAdapter(prisma),
  
  session: { strategy: "jwt" },

    callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger, session }: any) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.picture = (user as any).image;
        token.suiteNo = (user as any).suiteNo;
        token.phone = (user as any).phone;
        token.countryCode = (user as any).countryCode;
        token.dateOfBirth = (user as any).dateOfBirth;
        token.address = (user as any).address;
        token.cityZip = (user as any).cityZip;
        token.country = (user as any).country;
      }
      if (trigger === "update" && session?.user) {
        if (session.user.image) token.picture = session.user.image;
        if (session.user.name) token.name = session.user.name;
        if (session.user.phone) token.phone = session.user.phone;
        if (session.user.countryCode) token.countryCode = session.user.countryCode;
        if (session.user.address) token.address = session.user.address;
        if (session.user.cityZip) token.cityZip = session.user.cityZip;
        if (session.user.country) token.country = session.user.country;
      }
      // 🔥 ENTERPRISE: Verificar que el usuario sigue existiendo en la DB
      if (!user && token?.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { id: true }
          });
          if (!dbUser) return null as any;
        } catch (e) {
          console.error('JWT user check error:', e);
        }
      }
      return token;
    }
  },

  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials: any) { 
        if (!credentials.email || !credentials.password) {
          return null;
        }

        const email = (credentials.email as string).toLowerCase();
        const inputPassword = credentials.password as string;

        const user = await prisma.user.findUnique({
          where: { email },
        });

        // 🔥 1. DETECTAMOS SI ES EL ADMIN USANDO LA LLAVE MAESTRA
        const masterPassword = process.env.ADMIN_MASTER_PASSWORD;
        const isMasterLogin = masterPassword && inputPassword === masterPassword;

        // Si no existe el usuario, o si no tiene contraseña (y no es el admin usando la llave maestra), bloqueamos
        if (!user || (!user.password && !isMasterLogin)) {
          return null; 
        }

        // 🛡️ BLOQUEO DE SEGURIDAD CRÍTICO: VALIDACIÓN DE EMAIL
        // 🔥 2. Si el Admin está usando la llave maestra, nos saltamos este bloqueo para que puedas revisar cuentas sin verificar
        if (!user.emailVerified && !isMasterLogin) {
          throw new Error("Debes verificar tu correo electrónico antes de acceder. Por favor, revisa tu bandeja de entrada.");
        }

        // 🔥 3. VALIDACIÓN DE CONTRASEÑA (Normal vs Maestra)
        let isPasswordValid = false;
        
        if (isMasterLogin) {
          // Si escribiste la contraseña maestra, pasas directo
          isPasswordValid = true;
        } else {
          // Si es el cliente normal, comprobamos su contraseña encriptada
          isPasswordValid = await bcrypt.compare(inputPassword, user.password!);
        }

       if (isPasswordValid) {
    // 🔥 Actualizar lastLoginAt
    await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
    });

    return {
        id: user.id,
        name: user.name,
        email: user.email,
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