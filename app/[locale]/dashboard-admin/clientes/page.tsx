import { redirect } from "next/navigation";
import prisma from "@/lib/prisma"; 
import { auth } from "@/auth";
import ClientListTable from '@/components/admin/ClientListTable';
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ClientSearch from '@/components/admin/ClientSearch';

// 🛡️ Forzar renderizado dinámico para que la búsqueda funcione siempre
export const dynamic = 'force-dynamic';

export default async function GestionClientesPage({ 
    params, 
    searchParams 
}: { 
    params: { locale: string },
    searchParams: { q?: string } 
}) {
    
    const session = await auth();

    // 1. 🛡️ SEGURIDAD BÁSICA: Si no hay sesión, fuera.
    if (!session) {
        redirect('/login-cliente'); 
    }

    // 2. 🛡️ SEGURIDAD ESPECÍFICA (La Regla de Oro)
    // El personal de Bodega (WAREHOUSE) NO debe ver datos sensibles de clientes.
    // Si intentan entrar aquí, los devolvemos al dashboard principal.
    if (session.user.role === 'WAREHOUSE') {
        redirect(`/${params.locale}/dashboard-admin`);
    }

    // 3. 🛡️ SEGURIDAD FINAL
    // Si por alguna razón no es ADMIN (y tampoco era Warehouse que ya filtramos), fuera.
    if (session.user.role !== 'ADMIN') {
        redirect(`/${params.locale}/dashboard-cliente`);
    }

    // Obtener término de búsqueda
    const query = searchParams.q || '';
    let allUsers: any[] = [];

    try {
        // Consulta con filtros dinámicos
        allUsers = await prisma.user.findMany({
            where: query ? {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },    // Nombre
                    { email: { contains: query, mode: 'insensitive' } },   // Email
                    { suiteNo: { contains: query, mode: 'insensitive' } }, // Casillero
                ]
            } : undefined,
            orderBy: {
                createdAt: 'desc',
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                suiteNo: true
            }
        });
    } catch (error) {
        console.error("⚠️ Error cargando usuarios (Build):", error);
        allUsers = []; 
    }

    // Serialización simple para evitar errores de fechas
    const serializedUsers = JSON.parse(JSON.stringify(allUsers));

    return (
        <div className="bg-gray-100 min-h-screen p-4 sm:p-6 lg:p-8 font-montserrat">
            <div className="max-w-7xl mx-auto">
                
                {/* Botón Volver */}
                <div className="mb-6">
                    <Link 
                        href={`/${params.locale}/dashboard-admin`}
                        className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-gmc-dorado-principal transition-colors"
                    >
                        <ArrowLeft size={20} className="mr-2" />
                        Volver al Panel
                    </Link>
                </div>

                {/* Encabezado + Buscador */}
                <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gmc-gris-oscuro font-garamond">
                            Gestión de Clientes
                        </h1>
                        <p className="text-gray-500 mt-1 text-sm">
                            Administra los usuarios registrados y sus roles.
                        </p>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2 w-full md:w-auto">
                        <div className="bg-white px-4 py-1 rounded-full shadow-sm border border-gray-200 text-xs font-bold text-gray-500 mb-1">
                            {serializedUsers.length} {serializedUsers.length === 1 ? 'Usuario' : 'Usuarios'}
                        </div>
                        {/* Buscador */}
                        <ClientSearch />
                    </div>
                </div>

                {/* Tabla de Resultados */}
                <ClientListTable clients={serializedUsers} locale={params.locale} />
                
            </div>
        </div>
    );
}