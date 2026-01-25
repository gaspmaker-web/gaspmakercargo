import AdminDashboardClient from './AdminDashboardClient';

// 🛡️ ESCUDO ANTI-ERROR: Para que Vercel no intente generar esto estáticamente
export const dynamic = 'force-dynamic';

export default function AdminDashboardPage({ params: { locale } }: { params: { locale: string } }) {
  return <AdminDashboardClient locale={locale} />;
}