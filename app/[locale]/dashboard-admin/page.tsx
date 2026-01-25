import dynamicImport from 'next/dynamic';

// 🛡️ EL ESCUDO: Protege el Build
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// Importamos el cliente SIN Server Side Rendering
const AdminDashboardClient = dynamicImport(() => import('./AdminDashboardClient'), { 
  ssr: false, 
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-gray-400">Cargando Dashboard...</div>
    </div>
  )
});

export default function DashboardAdminPage({ params }: { params: { locale: string } }) {
  // Pasamos el locale al cliente para que los Links funcionen
  return <AdminDashboardClient locale={params.locale} />;
}