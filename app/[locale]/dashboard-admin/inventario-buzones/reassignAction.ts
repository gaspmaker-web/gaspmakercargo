"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
// 🔥 IMPORTAMOS TU FUNCIÓN CENTRAL DE NOTIFICACIONES
import { sendNotification } from "@/lib/notifications"; // <-- Ajusta la ruta '@/lib/' si tu archivo notifications.ts está en otra carpeta

export async function reassignEnvelope(mailItemId: string, newSuiteNo: string) {
    try {
        const cleanSuite = newSuiteNo.trim().toUpperCase();

        // 1. Buscamos el sobre original
        const mailItem = await prisma.mailItem.findUnique({
            where: { id: mailItemId }
        });

        if (!mailItem) {
            return { success: false, error: "El sobre no existe en el sistema." };
        }

        const oldUserId = mailItem.userId;

        // 2. Buscamos al cliente dueño de la nueva Suite
        const newUser = await prisma.user.findUnique({
            where: { suiteNo: cleanSuite }
        });

        if (!newUser) {
            return { success: false, error: "No se encontró ningún cliente con esta Suite." };
        }

        if (oldUserId === newUser.id) {
            return { success: false, error: "El sobre ya pertenece a esta Suite." };
        }

        // 3. 🚀 TRANSACCIÓN: Cambiamos el dueño y borramos la alerta vieja en un solo paso
        await prisma.$transaction(async (tx) => {
            
            // A. Cambiar el dueño oficial del sobre
            await tx.mailItem.update({
                where: { id: mailItemId },
                data: { userId: newUser.id }
            });

            // B. Borrar silenciosamente las notificaciones "No Leídas" del buzón al cliente equivocado
            await tx.notification.deleteMany({
                where: {
                    userId: oldUserId,
                    href: "/dashboard-cliente/buzon",
                    isRead: false,
                    title: "newMailTitle"
                }
            });
        });

        // 4. 🔔 DISPARAMOS LA ALERTA AL NUEVO CLIENTE USANDO TU SISTEMA CENTRAL
        // Usamos await para asegurarnos de que se guarde correctamente.
        await sendNotification({
            userId: newUser.id,
            title: "newMailTitle",
            message: JSON.stringify({ 
                key: "newMailDesc", 
                weight: (mailItem.weightOz || 0).toFixed(2) 
            }),
            type: "INFO",
            href: "/dashboard-cliente/buzon"
        });

        // 5. Refrescamos el Inventario del Admin
        revalidatePath('/', 'layout');
        
        return { success: true };

    } catch (error) {
        console.error("Error crítico reasignando sobre:", error);
        return { success: false, error: "Error interno del servidor en la transacción." };
    }
}