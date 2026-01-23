import { handlers } from "@/auth";

// 👇 LA VACUNA FINAL:
// Esto le dice a Vercel: "No intentes iniciar sesión durante la construcción. Espera a un usuario real."
export const dynamic = 'force-dynamic';

export const { GET, POST } = handlers;