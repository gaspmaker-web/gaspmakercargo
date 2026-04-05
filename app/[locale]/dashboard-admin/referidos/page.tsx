import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
// 🔥 CORRECCIÓN: Cambiamos ArrowRightRight por ArrowRight que sí existe
import { Gift, Users, Wallet, Search, Award, ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Control de Referidos | Gasp Maker Admin',
};

export default async function AdminReferralsPage({ params }: { params: { locale: string } }) {
  const session = await auth();

  // Protección de ruta Admin
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    redirect(`/${params.locale}/login-admin`);
  }

  // 1. OBTENER TODOS LOS CLIENTES
  const users = await prisma.user.findMany({
    where: { role: 'CLIENTE' },
    select: {
      id: true,
      name: true,
      email: true,
      suiteNo: true,
      referralCode: true,
      referredBy: true,
      walletBalance: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' }
  });

  // 2. OBTENER ESTADÍSTICAS DE REFERIDOS (Agrupamos por el código de quien invitó)
  const referralCounts = await prisma.user.groupBy({
    by: ['referredBy'],
    _count: { id: true },
    where: { referredBy: { not: null } }
  });

  // 3. MAPEAR Y CRUZAR LOS DATOS
  let totalReferredUsers = 0;
  let totalWalletDistributed = 0;

  const usersWithStats = users.map(user => {
    // Buscar a cuántos ha invitado este usuario (cruzando su referralCode con los referredBy de otros)
    const invitedCount = referralCounts.find(r => r.referredBy === user.referralCode)?._count.id || 0;
    
    totalReferredUsers += invitedCount;
    totalWalletDistributed += user.walletBalance || 0;

    return {
      ...user,
      invitedCount
    };
  });

  // Ordenar por los que más han invitado (Los "Top Promotores")
  usersWithStats.sort((a, b) => b.invitedCount - a.invitedCount);

  const topReferrer = usersWithStats[0]?.invitedCount > 0 ? usersWithStats[0] : null;

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-montserrat pb-20">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* ENCABEZADO */}
        <div className="flex justify-between items-end border-b pb-4 border-gray-200">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
              <Gift className="text-[#e6c200]" size={32} strokeWidth={2.5} />
              Control de Referidos
            </h1>
            <p className="text-gray-500 mt-1 text-sm font-medium">
              Monitorea el crecimiento viral y las recompensas otorgadas.
            </p>
          </div>
        </div>

        {/* KPIs (MÉTRICAS CLAVE) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Referidos</p>
              <h3 className="text-4xl font-black text-gray-900 lining-nums">{totalReferredUsers}</h3>
              <p className="text-xs text-green-600 font-bold mt-1">Nuevos clientes captados</p>
            </div>
            <div className="p-4 bg-blue-50 text-blue-600 rounded-xl">
              <Users size={28} strokeWidth={2} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Billeteras Activas</p>
              <h3 className="text-4xl font-black text-gray-900 lining-nums">
                ${totalWalletDistributed.toFixed(2)}
              </h3>
              <p className="text-xs text-gray-500 font-medium mt-1">Saldo total disponible de clientes</p>
            </div>
            <div className="p-4 bg-[#e6c200]/20 text-[#b39700] rounded-xl">
              <Wallet size={28} strokeWidth={2} />
            </div>
          </div>

          <div className="bg-gray-900 p-6 rounded-2xl shadow-md border border-gray-800 flex items-center justify-between relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <Award size={100} />
            </div>
            <div className="relative z-10">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 text-[#e6c200]">Top Promotor</p>
              <h3 className="text-xl font-black text-white truncate max-w-[180px]">
                {topReferrer ? topReferrer.name : 'N/A'}
              </h3>
              <p className="text-sm text-gray-300 font-medium mt-1">
                {topReferrer ? `${topReferrer.invitedCount} amigos invitados` : 'Aún no hay referidos'}
              </p>
            </div>
            <div className="p-4 bg-gray-800 text-[#e6c200] rounded-xl relative z-10">
              <Award size={28} strokeWidth={2} />
            </div>
          </div>
        </div>

        {/* TABLA DE CONTROL */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
            <h2 className="text-lg font-bold text-gray-900">Listado de Clientes y Códigos</h2>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar por código o nombre..." 
                disabled
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#e6c200] disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-bold">
                  <th className="p-4 pl-6">Cliente</th>
                  <th className="p-4">Código Personal</th>
                  <th className="p-4 text-center">Invitados</th>
                  <th className="p-4">Invitado Por</th>
                  <th className="p-4 text-right pr-6">Saldo Billetera</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {usersWithStats.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                    
                    {/* CLIENTE */}
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold shrink-0">
                          {u.name?.charAt(0).toUpperCase() || 'C'}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{u.name || 'Sin Nombre'}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-500">{u.email}</span>
                            {u.suiteNo && (
                              <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded">
                                {u.suiteNo}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* CÓDIGO PERSONAL */}
                    <td className="p-4 font-mono text-gray-600">
                      {u.referralCode ? (
                         <span className="bg-gray-100 px-2 py-1 rounded border border-gray-200">{u.referralCode}</span>
                      ) : (
                         <span className="text-gray-400 text-xs italic">No generado</span>
                      )}
                    </td>

                    {/* INVITADOS (LOS QUE ÉL TRAJO) */}
                    <td className="p-4 text-center">
                      {u.invitedCount > 0 ? (
                        <span className="inline-flex items-center justify-center bg-green-100 text-green-800 font-bold w-6 h-6 rounded-full text-xs">
                          {u.invitedCount}
                        </span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>

                    {/* INVITADO POR (QUIÉN LO TRAJO A ÉL) */}
                    <td className="p-4">
                      {u.referredBy ? (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-purple-700 bg-purple-50 px-2 py-1 rounded-lg w-max border border-purple-100">
                          {/* 🔥 CORRECCIÓN: Usamos el ícono válido aquí */}
                          <ArrowRight size={14} />
                          {u.referredBy}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">Orgánico</span>
                      )}
                    </td>

                    {/* SALDO BILLETERA */}
                    <td className="p-4 text-right pr-6">
                      {u.walletBalance && u.walletBalance > 0 ? (
                        <span className="font-black text-green-600 lining-nums">
                          ${u.walletBalance.toFixed(2)}
                        </span>
                      ) : (
                        <span className="font-medium text-gray-400 lining-nums">$0.00</span>
                      )}
                      
                      {/* Botón de acción futura para administrar saldo */}
                      <Link 
                        href={`/${params.locale}/dashboard-admin/clientes/${u.id}`}
                        className="block mt-1 text-[10px] font-bold text-blue-600 hover:underline uppercase"
                      >
                        Administrar
                      </Link>
                    </td>

                  </tr>
                ))}

                {usersWithStats.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500 font-medium">
                      No hay clientes registrados en el sistema aún.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}