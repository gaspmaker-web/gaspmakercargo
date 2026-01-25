import dynamicImport from 'next/dynamic';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const MonitorClient = dynamicImport(() => import('./MonitorClient'), { 
  ssr: false,
  loading: () => <div className="p-10">Cargando...</div>
});

export default function Page() {
  return <MonitorClient />;
}