// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  return new PrismaClient({
    // En producción, solo mostramos errores para no llenar la consola y ahorrar CPU
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

// Usamos la instancia existente o creamos una nueva si no existe
// 🟢 CAMBIO: Agregamos "export" aquí. Esto soluciona el error "prisma is not exported"
export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

export default prisma;

// En desarrollo, guardamos la instancia en global para reutilizarla
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}