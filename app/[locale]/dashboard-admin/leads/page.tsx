import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import LeadsTable from "@/components/admin/LeadsTable";

export const dynamic = 'force-dynamic';

export default async function LeadsPage({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams: { q?: string; status?: string };
}) {
  const session = await auth();

  if (!session) redirect('/login-cliente');
  if (session.user.role !== 'ADMIN') {
    redirect(`/${params.locale}/dashboard-cliente`);
  }

  const query = searchParams.q || '';
  const statusFilter = searchParams.status || '';

  let leads: any[] = [];

  try {
    leads = await (prisma as any).lead.findMany({
      where: {
        AND: [
          query ? {
            OR: [
              { full_name: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
              { phone_number: { contains: query, mode: 'insensitive' } },
            ]
          } : {},
          statusFilter ? { status: statusFilter } : {},
        ]
      },
      orderBy: { created_time: 'desc' },
    });
  } catch (error) {
    console.error('Error loading leads:', error);
    leads = [];
   }

  // 🔥 Cruzar leads con usuarios para saber si ya hicieron login
const leadEmails = leads.map((l: any) => l.email).filter(Boolean);
const convertedUsers = await prisma.user.findMany({
    where: { email: { in: leadEmails } },
    select: { email: true, lastLoginAt: true, createdAt: true }
});
const userMap = Object.fromEntries(convertedUsers.map(u => [u.email, u]));

const leadsWithLogin = leads.map((lead: any) => ({
    ...lead,
    user: userMap[lead.email] || null
}));

const serializedLeads = JSON.parse(JSON.stringify(leadsWithLogin));

  const stats = {
    total: leads.length,
    new: leads.filter((l: any) => l.status === 'new').length,
    contacted: leads.filter((l: any) => l.status === 'contacted').length,
    interested: leads.filter((l: any) => l.status === 'interested').length,
    closed: leads.filter((l: any) => l.status === 'closed').length,
    lost: leads.filter((l: any) => l.status === 'lost').length,
  };

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
            Back to Panel
          </Link>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gmc-gris-oscuro font-garamond">
              Facebook Leads CRM
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              Manage leads from Facebook campaigns.
            </p>
          </div>
          <div className="bg-white px-4 py-1 rounded-full shadow-sm border border-gray-200 text-xs font-bold text-gray-500">
            {stats.total} {stats.total === 1 ? 'Lead' : 'Leads'}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {[
            { label: 'New', value: stats.new, color: 'bg-blue-100 text-blue-700' },
            { label: 'Contacted', value: stats.contacted, color: 'bg-yellow-100 text-yellow-700' },
            { label: 'Interested', value: stats.interested, color: 'bg-purple-100 text-purple-700' },
            { label: 'Closed', value: stats.closed, color: 'bg-green-100 text-green-700' },
            { label: 'Lost', value: stats.lost, color: 'bg-red-100 text-red-700' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl shadow-sm p-4 text-center border border-gray-100">
              <p className="text-2xl font-bold text-gmc-gris-oscuro">{stat.value}</p>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${stat.color}`}>
                {stat.label}
              </span>
            </div>
          ))}
        </div>

        {/* Tabla */}
        <LeadsTable leads={serializedLeads} locale={params.locale} />

      </div>
    </div>
  );
}