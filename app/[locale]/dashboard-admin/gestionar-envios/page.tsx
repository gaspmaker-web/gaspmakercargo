import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

// 👇 ESTA LÍNEA ES LA CURA
// Le dice a Vercel que esta página es dinámica y requiere autenticación en tiempo real.
export const dynamic = 'force-dynamic';

export default async function EnviosPage() {
  const session = await auth();

  // Tu lógica original intacta
  if (!session || session.user.role !== "ADMIN") {
    redirect("/login-cliente");
  }

  // 👇 IMPORTANTE: Aquí debajo debe ir el "... resto de tu lógica ..." 
  // que tenías en tu archivo original (el return con el JSX, consultas a Prisma, etc).
  // Asegúrate de pegarlo aquí.
  
  return (
      <div className="p-8">
          <h1 className="text-2xl font-bold">Gestión de Envíos</h1>
          {/* Tu tabla o contenido aquí */}
      </div>
  );
}