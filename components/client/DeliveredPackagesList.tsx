'use client';

import { useState } from 'react';
import { Package, Calendar, MapPin, Search, ChevronLeft, ChevronRight, PackageX } from 'lucide-react';
import SmartTrackingLink from '@/components/client/SmartTrackingLink';

interface Props {
  packages: any[]; // Recibimos los paquetes desde el servidor
  userCountryCode: string;
}

const ITEMS_PER_PAGE = 10; // 👈 Configura cuántos quieres ver por página

export default function DeliveredPackagesList({ packages, userCountryCode }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // 1. FILTRADO (Buscador)
  const filteredPackages = packages.filter(pkg => {
    const term = searchTerm.toLowerCase();
    return (
      pkg.description?.toLowerCase().includes(term) ||
      pkg.gmcTrackingNumber?.toLowerCase().includes(term) ||
      pkg.selectedCourier?.toLowerCase().includes(term)
    );
  });

  // 2. PAGINACIÓN
  const totalPages = Math.ceil(filteredPackages.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentData = filteredPackages.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Funciones de navegación
  const goToNext = () => setCurrentPage(p => Math.min(p + 1, totalPages));
  const goToPrev = () => setCurrentPage(p => Math.max(p - 1, 1));

  // Resetear página si buscan algo nuevo
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-[400px]">
      
      {/* BARRA DE HERRAMIENTAS (Buscador) */}
      <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Buscar por descripción o tracking..." 
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-green-500 outline-none transition-all"
                value={searchTerm}
                onChange={handleSearch}
              />
          </div>
          <div className="text-xs text-gray-400 font-bold uppercase">
              Total Entregados: {filteredPackages.length}
          </div>
      </div>

      {/* LISTA DE PAQUETES */}
      <div className="flex-1">
        {currentData.length === 0 ? (
            <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center h-full">
                <PackageX size={48} className="mb-4 opacity-20" />
                <p className="text-lg font-medium">No se encontraron paquetes.</p>
            </div>
        ) : (
            <div className="divide-y divide-gray-50">
                {currentData.map((pkg) => {
                    
                    // LÓGICA DE DESTINO (Mantenemos la lógica inteligente)
                    let destinationLabel = userCountryCode || 'DESTINO';
                    if (pkg.courierService?.toLowerCase().includes('barbados')) {
                        destinationLabel = 'BARBADOS (BB)';
                    } else if (pkg.user?.country) {
                         destinationLabel = pkg.user.country;
                    }

                    return (
                        <div key={pkg.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-in fade-in duration-300">
                            
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                                        {pkg.status}
                                    </span>
                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                        <Calendar size={12}/> {new Date(pkg.updatedAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <h3 className="font-bold text-lg text-gray-800">{pkg.description || 'Sin descripción'}</h3>
                                <p className="text-sm text-gray-500 flex items-center gap-1 mt-1 font-medium">
                                   <MapPin size={14} className="text-green-600"/> Entregado en: <span className="text-gray-700">{destinationLabel}</span>
                                </p>
                            </div>

                            <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
                                <p className="text-xs text-gray-400 uppercase font-bold hidden sm:block">Tracking / Prueba de Entrega</p>
                                <div className="w-full sm:w-auto">
                                    <SmartTrackingLink 
                                        trackingNumber={pkg.gmcTrackingNumber} 
                                        courier={pkg.selectedCourier || 'GMC'} 
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
      </div>

      {/* CONTROLES DE PAGINACIÓN */}
      {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
              <button 
                onClick={goToPrev} disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-gray-600"
              >
                  <ChevronLeft size={20} />
              </button>
              
              <span className="text-sm font-bold text-gray-500">
                  Página {currentPage} de {totalPages}
              </span>

              <button 
                onClick={goToNext} disabled={currentPage === totalPages}
                className="p-2 rounded-lg hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-gray-600"
              >
                  <ChevronRight size={20} />
              </button>
          </div>
      )}

    </div>
  );
}