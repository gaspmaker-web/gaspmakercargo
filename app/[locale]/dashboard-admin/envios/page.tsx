// app/dashboard-admin/envios/page.tsx
import { auth } from "@/auth"; // <--- CAMBIO CRÍTICO: Importar desde tu config v5
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function EnviosPage() {
  const session = await auth(); // <--- Usar auth(), no getServerSession

  if (!session || session.user.role !== "ADMIN") {
    redirect("/login-cliente");
  }

  // ... resto de tu lógica ...
}