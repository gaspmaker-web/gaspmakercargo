import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { PrismaClient } from '@prisma/client';
import { 
  Package, 
  Users, 
  Truck, 
  MapPin, 
  PlusCircle, 
  Layers, 
  FileText, 
  TrendingUp,
  Activity,
  DollarSign,
  ClipboardList,
  Car 
} from 'lucide-react';

const prisma = new PrismaClient();

export default async function DashboardAdminPage({ 
  params 
}: { 
  params: { locale: string } 
}) {
  const session = await auth();

  // 1. Verificación de Seguridad
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'WAREHOUSE' && session.user.role !== 'DRIVER')) {
    redirect('/login-cliente');
  }

  // 2. Obtener Datos Reales (Contadores)
  const paquetesActivos = await prisma.package.count({
    where: { status: { not: 'ENTREGADO' } }
  });
  
  const clientesTotal = await prisma.user.count({
    where: { role: 'CLIENTE' }
  });

  // 🔥 NUEVA CONSULTA AMPLIADA: Cuenta todas las que requieren acción
  const consolidacionesPendientes = await prisma.consolidatedShipment.count({
    where: { 
        serviceType: 'CONSOLIDATION', // Solo consolidaciones reales
        OR: [
            { status: 'SOLICITUD_CONSOLIDACION' },
            { status: 'EN_PROCESO_CONSOLIDACION' },
            { totalAmount: 0 } // También las que les falta precio (Cotización)
        ]
    }
  });

  // Contamos las solicitudes de pickup PAGADAS
  const pickupsPendientes = await prisma.pickupRequest.count({
    where: { status: 'PAGADO' }
  });

  // Cálculo de ventas (Semana)
  const ventas = await prisma.consolidatedShipment.aggregate({
      _sum: { totalAmount: true },
      where: { 
          createdAt: { gte: new Date(new Date().setDate(new Date().getDate() - 7)) }
      }
  });

  // Contador de entregas hoy
  const entregasHoy = await prisma.pickupRequest.count({
      where: { 
          status: 'ENTREGADO',
          updatedAt: { gte: new Date(new Date().setHours(0,0,0,0)) }
      }
  });

  // Clientes nuevos (Semana)
  const nuevosClientes = await prisma.user.count({
      where: { 
          role: 'CLIENTE',
          createdAt: { gte: new Date(new Date().setDate(new Date().getDate() - 7)) }
      }
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-montserrat">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* ENCABEZADO */}
        <div className="flex justify-between items-end border-b pb-4 border-gray-200">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 font-garamond">
              Panel de Control de Operaciones
            </h1>
            <p className="text-gray-500 mt-1">
              Bienvenido, <span className="font-bold text-gmc-dorado-principal uppercase">{session.user.name}</span>. 
              Rol: <span className="text-xs bg-gray-200 px-2 py-1 rounded-full ml-1">{session.user.role}</span>
            </p>
          </div>
          <div className="text-right">
             <p className="text-sm text-gray-400">Fecha: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* 1. SECCIÓN DE ESTADÍSTICAS (KPIs) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card: Paquetes Activos */}
          <Link href={`/${params.locale}/dashboard-admin/paquetes`} className="block">
            <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-blue-500 flex justify-between items-center hover:shadow-md transition-shadow cursor-pointer">
              <div>
                <p className="text-sm text-gray-500 font-medium">Paquetes Activos</p>
                <h3 className="text-3xl font-bold text-gray-800">{paquetesActivos}</h3>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                <Package size={24} />
              </div>
            </div>
          </Link>

          {/* Card: Entregas Hoy */}
          <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-green-500 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500 font-medium">Entregas Hoy</p>
              <h3 className="text-3xl font-bold text-gray-800">{entregasHoy}</h3> 
            </div>
            <div className="p-3 bg-green-50 text-green-600 rounded-lg">
              <Truck size={24} />
            </div>
          </div>

          {/* Card: Nuevos Clientes */}
          <Link href={`/${params.locale}/dashboard-admin/clientes`} className="block">
            <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-purple-500 flex justify-between items-center hover:shadow-md transition-shadow cursor-pointer">
              <div>
                <p className="text-sm text-gray-500 font-medium">Nuevos Clientes</p>
                <h3 className="text-3xl font-bold text-gray-800">{nuevosClientes}</h3>
              </div>
              <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                <Users size={24} />
              </div>
            </div>
          </Link>

          {/* Card: Ventas */}
          <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-gmc-dorado-principal flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500 font-medium">Ventas (Semana)</p>
              <h3 className="text-3xl font-bold text-gray-800">${(ventas._sum.totalAmount || 0).toFixed(2)}</h3>
            </div>
            <div className="p-3 bg-yellow-50 text-yellow-600 rounded-lg">
              <DollarSign size={24} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* 2. ACCIONES DISPONIBLES */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Activity size={20} /> Acciones Disponibles
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Solicitudes de Pickup */}
              <Link href={`/${params.locale}/dashboard-admin/solicitudes-pickup`} 
                className="group bg-white p-6 rounded-xl border border-gray-200 hover:border-orange-500 hover:shadow-md transition-all cursor-pointer block relative">
                
                {/* Badge de Notificación Pickup */}
                {pickupsPendientes > 0 && (
                    <span className="absolute top-4 right-4 bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                        {pickupsPendientes} Pendiente{pickupsPendientes > 1 ? 's' : ''}
                    </span>
                )}

                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 group-hover:text-orange-600 transition-colors">Solicitudes de Pickup</h3>
                    <p className="text-sm text-gray-500 mt-1">Gestionar recolecciones pagadas pendientes.</p>
                  </div>
                  <div className="bg-orange-100 p-2 rounded-full text-orange-600">
                    <Car size={24} />
                  </div>
                </div>
              </Link>
              
              {/* Botón: Crear Envío */}
              <Link href={`/${params.locale}/dashboard-admin/crear-envio`} 
                className="group bg-white p-6 rounded-xl border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer block">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors">Crear Envío</h3>
                    <p className="text-sm text-gray-500 mt-1">Registrar un nuevo pedido de cliente (Entrada Almacén).</p>
                  </div>
                  <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                    <PlusCircle size={24} />
                  </div>
                </div>
              </Link>

              {/* Botón: Consolidaciones */}
              <Link href={`/${params.locale}/dashboard-admin/consolidaciones`} 
                className="group bg-white p-6 rounded-xl border border-gray-200 hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer block relative">
                
                {/* 🔥 BADGE ROJO AGREGADO: Muestra total pendientes */}
                {consolidacionesPendientes > 0 && (
                    <span className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                        {consolidacionesPendientes} Pendiente{consolidacionesPendientes > 1 ? 's' : ''}
                    </span>
                )}

                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">Consolidaciones</h3>
                    <p className="text-sm text-gray-500 mt-1">Ver solicitudes de agrupación pendientes.</p>
                  </div>
                  <div className="bg-indigo-100 p-2 rounded-full text-indigo-600">
                    <Layers size={24} />
                  </div>
                </div>
              </Link>

              {/* Botón: Gestionar Clientes */}
              <Link href={`/${params.locale}/dashboard-admin/clientes`} 
                className="group bg-white p-6 rounded-xl border border-gray-200 hover:border-purple-500 hover:shadow-md transition-all cursor-pointer block">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 group-hover:text-purple-600 transition-colors">Gestionar Clientes</h3>
                    <p className="text-sm text-gray-500 mt-1">Ver listado y cuentas de usuarios.</p>
                  </div>
                  <div className="bg-purple-100 p-2 rounded-full text-purple-600">
                    <Users size={24} />
                  </div>
                </div>
              </Link>

              {/* Botón: Historial Global */}
              <Link href={`/${params.locale}/dashboard-admin/historial-envios`} 
                className="group bg-white p-6 rounded-xl border border-gray-200 hover:border-teal-500 hover:shadow-md transition-all cursor-pointer block">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 group-hover:text-teal-600 transition-colors">Historial Global</h3>
                    <p className="text-sm text-gray-500 mt-1">Consulta todos los envíos realizados.</p>
                  </div>
                  <div className="bg-teal-100 p-2 rounded-full text-teal-600">
                    <ClipboardList size={24} />
                  </div>
                </div>
              </Link>

              {/* Botón: Reporte */}
              <button disabled className="group bg-white p-6 rounded-xl border border-gray-200 opacity-60 cursor-not-allowed w-full text-left">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">Generar Reporte</h3>
                    <p className="text-sm text-gray-500 mt-1">Descargar informe de ventas (Próximamente).</p>
                  </div>
                  <div className="bg-gray-100 p-2 rounded-full text-gray-600">
                    <FileText size={24} />
                  </div>
                </div>
              </button>

            </div>

             {/* Actividad Reciente */}
             <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
                <h3 className="font-bold text-gray-800 mb-4">Actividad Reciente</h3>
                <div className="text-sm text-gray-500 text-center py-8 bg-gray-50 rounded-lg">
                  No hay actividad reciente registrada hoy.
                </div>
             </div>
          </div>

          {/* 4. MAPA DE DRIVERS EN VIVO (Columna Derecha) */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <MapPin size={20} /> Mapa de Drivers
            </h2>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1 h-[400px] flex flex-col relative overflow-hidden">
              <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-md shadow-sm border text-xs font-bold text-gray-600">
                Tookan API • Live
              </div>
              <div className="w-full h-full bg-blue-50 rounded-lg flex flex-col items-center justify-center text-blue-300 relative">
                 <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>
                 <MapPin size={48} className="mb-2 text-blue-500 animate-bounce" />
                 <p className="text-gray-500 font-medium">Cargando Drivers...</p>
                 <p className="text-xs text-gray-400 mt-1 text-center px-6">
                   Conectando con API de Tookan para geolocalización en tiempo real.
                 </p>
              </div>
              <div className="p-4 border-t border-gray-100">
                <button className="w-full bg-gmc-gris-oscuro text-white py-2 rounded-lg text-sm font-bold hover:bg-black transition-colors flex items-center justify-center gap-2">
                  <TrendingUp size={16} /> Ver Rutas de Hoy
                </button>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-2">
                   <span className="text-sm font-bold text-gray-700">Drivers Conectados</span>
                   <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">En Vivo</span>
                </div>
                <div className="space-y-2">
                   <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold">CP</div>
                      <div>
                        <p className="text-sm font-bold text-gray-800">Chofer Principal</p>
                        <p className="text-xs text-gray-500">En ruta: Miami Gardens</p>
                      </div>
                   </div>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}