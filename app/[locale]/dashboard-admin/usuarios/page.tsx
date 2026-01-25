import { redirect } from "next/navigation";
import prisma from "@/lib/prisma"; 
import { auth } from "@/auth";
import ClientListTable from '@/components/admin/ClientListTable';
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
// Importamos el buscador
import ClientSearch from '@/components/admin/ClientSearch';

export default async function GestionClientesPage({ 
    params, 
    searchParams 
}: { 
    params: { locale: string },
    searchParams: { q?: string } 
}) {
    
    const session = await auth();

    // Seguridad
    if (!session) {
        redirect('/login-cliente'); 
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'WAREHOUSE') {
        redirect('/dashboard-cliente'); 
    }

    // Obtener término de búsqueda
    const query = searchParams.q || '';

    // Consulta con filtros dinámicos
    const allUsers = await prisma.user.findMany({
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
                            {allUsers.length} {allUsers.length === 1 ? 'Usuario' : 'Usuarios'}
                        </div>
                        {/* Aquí va el buscador */}
                        <ClientSearch />
                    </div>
                </div>

                {/* Tabla de Resultados */}
                <ClientListTable clients={allUsers} locale={params.locale} />
                
            </div>
        </div>
    );
}