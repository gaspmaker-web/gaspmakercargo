import { Truck } from 'lucide-react';
// import prisma from '@/lib/prisma'; 
// import BotonDespachar from '@/components/admin/BotonDespachar'; // 👈 EL SOSPECHOSO NÚMERO 1 (COMENTADO)

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminDespachosPage() {
  
  // Arrays vacíos para que no falle el map
  const consolidacionesListas: any[] = []; 
  const paquetesSueltosListos: any[] = [];

  return (
    <div className="p-6 md:p-10 bg-gray-50 min-h-screen font-sans text-gray-800">
      <div className="max-w-6xl mx-auto">
        
        <div className="bg-green-100 border-l-4 border-green-500 p-4 mb-8">
            <p className="font-bold text-green-700">MODO DIAGNÓSTICO FINAL</p>
            <p className="text-sm text-green-800">
                Hemos desactivado la Base de Datos y el Botón. 
                Si esto pasa a VERDE, el culpable es 100% el archivo "BotonDespachar".
            </p>
        </div>

        <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Truck className="text-blue-600"/> Centro de Despachos
            </h1>
        </div>

        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
             <h3 className="text-xl font-bold text-gray-800">Esperando reparación del Botón...</h3>
        </div>

      </div>
    </div>
  );
}