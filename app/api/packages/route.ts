import { NextResponse } from "next/server";
import { z } from 'zod';

// 👇 VACUNA 1: Forzar modo dinámico (Evita que Vercel ejecute esto en el Build)
export const dynamic = 'force-dynamic';

// --- Schema Actualizado --- (Zod es seguro, puede quedarse aquí)
const PackageSchema = z.object({
  userId: z.string().min(1, "El ID de usuario es obligatorio"),
  // Bajamos la exigencia a 1 caracter para evitar errores por "ropw"
  description: z.string().min(1, "La descripción es obligatoria."),
  carrierTrackingNumber: z.string().min(1, "El tracking es obligatorio."),
  
  // Aceptamos el countryCode directamente desde el frontend
  countryCode: z.string().min(2, "El código de país es inválido"),

  // Validación numérica
  weightLbs: z.number().min(0, "El peso debe ser mayor a cero."),
  lengthIn: z.number().min(0, "El largo debe ser mayor a cero."),
  widthIn: z.number().min(0, "El ancho debe ser mayor a cero."),
  heightIn: z.number().min(0, "El alto debe ser mayor a cero."),
  
  // Foto opcional
  photoUrlMiami: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  try {
    // 👇 VACUNA 2: Imports dentro de la función (Lazy Loading)
    const { auth } = await import("@/auth");
    const prisma = (await import("@/lib/prisma")).default;
    const { generateGmcTracking } = await import('@/lib/utils');

    // 1. Verificar sesión (Seguridad)
    const session = await auth();
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "WAREHOUSE")) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();

    // 2. Validar datos con Zod
    const validation = PackageSchema.safeParse({
        ...body,
        // Nos aseguramos de que sean números (por si acaso llegan como strings)
        weightLbs: Number(body.weightLbs),
        lengthIn: Number(body.lengthIn),
        widthIn: Number(body.widthIn),
        heightIn: Number(body.heightIn),
    });
    
    if (!validation.success) {
        // Devolvemos el primer error que encontremos para que sea claro
        const firstError = validation.error.errors[0];
        const errorMessage = `${firstError.path[0]}: ${firstError.message}`;
        return NextResponse.json({ message: `Datos inválidos: ${errorMessage}` }, { status: 400 });
    }
    
    const data = validation.data;

    // 3. Generar Tracking Interno usando el código de país del formulario
    // Esto ahorra una consulta a la base de datos y es más seguro
    const gmcTrackingNumber = generateGmcTracking(data.countryCode);
    
    // 4. Crear el paquete
    const newPackage = await prisma.package.create({
      data: {
        userId: data.userId,
        status: "RECIBIDO_MIAMI",
        description: data.description,
        weightLbs: data.weightLbs,
        carrierTrackingNumber: data.carrierTrackingNumber,
        gmcTrackingNumber: gmcTrackingNumber,
        lengthIn: data.lengthIn,
        widthIn: data.widthIn,
        heightIn: data.heightIn,
        photoUrlMiami: data.photoUrlMiami,
      },
    });

    return NextResponse.json({
        message: "Paquete registrado con éxito.",
        gmcTrackingNumber: newPackage.gmcTrackingNumber
    }, { status: 201 });

  } catch (error: any) {
    console.error("Error al crear el paquete:", error);
    
    // Manejo de error de duplicados (Tracking repetido)
    if (error.code === 'P2002') {
        return NextResponse.json({ message: "El número de tracking ya existe. Intente nuevamente." }, { status: 409 });
    }

    return NextResponse.json({ message: "Ocurrió un error inesperado en el servidor" }, { status: 500 });
  }
}
