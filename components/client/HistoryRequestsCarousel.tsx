"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { 
  Truck, MapPin, CheckCircle, Clock, Package, Plane, 
  Warehouse, DollarSign, Box, Camera, ArrowLeft, 
  ChevronDown, ChevronUp, Calendar, Search, FileText 
} from 'lucide-react';
// 🔥 Importamos el hook de traducción
import { useTranslations } from 'next-intl';

// 1. Configuración SOLO de Estilos (Iconos y Colores)
// Ya no ponemos "label" aquí porque el texto debe ser traducido dinámicamente.
const TYPE_STYLES: Record<string, { icon: React.ElementType, color: string, badgeBg: string }> = {
    'SHIPPING': { icon: Truck, color: 'text-blue-600', badgeBg: 'bg-blue-100' },
    'DELIVERY': { icon: MapPin, color: 'text-green-600', badgeBg: 'bg-green-100' },
    'STORAGE': { icon: Warehouse, color: 'text-orange-600', badgeBg: 'bg-orange-100' },
    'STORAGE_FEE': { icon: DollarSign, color: 'text-red-600', badgeBg: 'bg-red-100' },
    'CONSOLIDATION': { icon: Box, color: 'text-purple-600', badgeBg: 'bg-purple-100' },
    'SHIPPING_INTL': { icon: Plane, color: 'text-indigo-600', badgeBg: 'bg-indigo-100' },
    'DEFAULT': { icon: Package, color: 'text-gray-600', badgeBg: 'bg-gray-100' }
};

// 2. Sub-componente Badge de Estado (Traducido)
const StatusBadge = ({ status }: { status: string }) => {
    const t = useTranslations('HistoryPage'); // Hook activo
    const s = status?.toUpperCase() || 'PENDIENTE';
    
    if (['PAGADO', 'COMPLETADO', 'PROCESADO', 'ENTREGADO'].includes(s)) {
        return <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 border border-green-200"><CheckCircle size={10}/> {t('statusPaid')}</span>;
    }
    return <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 border border-yellow-200"><Clock size={10}/> {t('statusPending')}</span>;
};

// 3. Sub-componente Grupo (Carrusel por Categoría)
const HistoryGroup = ({ type, requests }: { type: string, requests: any[] }) => {
    const [isOpen, setIsOpen] = useState(true);
    const t = useTranslations('HistoryPage'); // Hook activo

    // Obtenemos estilos
    const styles = TYPE_STYLES[type] || TYPE_STYLES['DEFAULT'];
    const Icon = styles.icon;

    // 🔥 FUNCIÓN CLAVE: Traduce el título del servicio usando tus JSON
    const getLabel = (typeKey: string) => {
        switch (typeKey) {
            case 'SHIPPING': return t('labelShipping');
            case 'DELIVERY': return t('labelDelivery');
            case 'STORAGE': return t('labelStorage');
            case 'STORAGE_FEE': return t('labelStorageFee');
            case 'CONSOLIDATION': return t('labelConsolidation');
            case 'SHIPPING_INTL': return t('labelShippingIntl');
            default: return t('labelDefault');
        }
    };

    const totalSpent = requests.reduce((sum, req) => sum + (req.totalPaid || req.totalAmount || 0), 0);
    const isInternationalGroup = ['SHIPPING_INTL', 'CONSOLIDATION'].includes(type);

    return (
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden mb-6 transition-all hover:shadow-md animate-in fade-in slide-in-from-bottom-2">
            {/* Header del Grupo */}
            <button onClick={() => setIsOpen(!isOpen)} className="w-full p-5 flex items-center justify-between bg-white hover:bg-gray-50/80 transition-colors">
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${styles.badgeBg} ${styles.color}`}><Icon size={24} /></div>
                    <div className="text-left">
                        {/* Aquí se usa la función de traducción */}
                        <h3 className="font-bold text-gray-800 text-lg">{getLabel(type)}</h3>
                        <p className="text-xs text-gray-500 font-medium">{requests.length} {t('operations')} • {t('total')}: <span className="text-gray-800 font-bold">${totalSpent.toFixed(2)}</span></p>
                    </div>
                </div>
                <div className="text-gray-400 bg-gray-50 p-2 rounded-full border border-gray-100">{isOpen ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}</div>
            </button>

            {isOpen && (
                <div className="border-t border-gray-100 bg-gray-50/30 p-0 md:p-6 pb-8">
                    {/* CARRUSEL */}
                    <div className="flex overflow-x-auto gap-5 px-4 md:px-0 py-2 scrollbar-hide snap-x snap-mandatory">
                        {requests.map((req) => (
                            <div 
                                key={req.id} 
                                className="min-w-[85vw] sm:min-w-[380px] md:min-w-[400px] bg-white rounded-[1.5rem] border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] snap-center flex flex-col justify-between relative overflow-hidden transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg"
                            >
                                {/* Header Tarjeta */}
                                <div className="bg-slate-50/80 backdrop-blur-sm p-4 border-b border-gray-100 flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                        <Calendar size={12}/> {new Date(req.createdAt).toLocaleDateString()}
                                    </span>
                                    <StatusBadge status={req.status} />
                                </div>

                                <div className="p-5 flex flex-col gap-4 flex-1">
                                    
                                    {/* Info Principal */}
                                    <div>
                                        <h4 className="font-bold text-gray-800 text-lg leading-tight mb-1 line-clamp-2">
                                            {req.description || req.gmcShipmentNumber || 'Operación sin título'}
                                        </h4>
                                        <p className="text-[10px] text-gray-400 font-mono bg-gray-50 inline-block px-2 py-0.5 rounded border border-gray-100">
                                            ID: {(req.id || '').slice(0,8).toUpperCase()}
                                        </p>
                                    </div>

                                    {/* Detalles Ubicación */}
                                    <div className="text-xs text-gray-600 space-y-2.5 bg-gray-50/50 p-3.5 rounded-xl border border-gray-100/80">
                                        {(req.originAddress) ? (
                                            <>
                                                <div className="flex items-start gap-2.5">
                                                    <div className="min-w-[16px] mt-0.5"><MapPin size={14} className="text-orange-500"/></div>
                                                    <span className="break-words leading-tight text-gray-700"><strong className="text-gray-900 block text-[10px] uppercase text-gray-400 mb-0.5">{t('origin')}</strong> {req.originAddress}</span>
                                                </div>
                                                <div className="w-full h-px bg-gray-200/50 my-1"></div>
                                                <div className="flex items-start gap-2.5">
                                                    <div className="min-w-[16px] mt-0.5"><MapPin size={14} className="text-blue-500"/></div>
                                                    <span className="break-words leading-tight text-gray-700"><strong className="text-gray-900 block text-[10px] uppercase text-gray-400 mb-0.5">{t('dest')}</strong> {req.dropOffAddress}</span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex items-center gap-2 text-gray-500 italic">
                                                <Package size={14}/> <span>{t('internalMgmt')}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Evidencia (Fotos) */}
                                    {!isInternationalGroup && type !== 'STORAGE_FEE' && (
                                        <div className="mt-1">
                                            <p className="text-[9px] font-bold text-gray-400 uppercase mb-2 flex items-center gap-1 tracking-wider"><Camera size={10}/> {t('evidence')}</p>
                                            <div className="flex gap-3">
                                                {req.photoPickupUrl ? (
                                                    <a href={req.photoPickupUrl} target="_blank" className="relative w-16 h-12 rounded-lg overflow-hidden border border-gray-200 group">
                                                        <Image src={req.photoPickupUrl} alt="Pickup" fill className="object-cover transition-transform group-hover:scale-110"/>
                                                    </a>
                                                ) : <div className="w-16 h-12 rounded-lg bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center"><Camera size={14} className="text-gray-300"/></div>}
                                                
                                                {req.photoDeliveryUrl ? (
                                                    <a href={req.photoDeliveryUrl} target="_blank" className="relative w-16 h-12 rounded-lg overflow-hidden border border-gray-200 group">
                                                        <Image src={req.photoDeliveryUrl} alt="Delivery" fill className="object-cover transition-transform group-hover:scale-110"/>
                                                    </a>
                                                ) : <div className="w-16 h-12 rounded-lg bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center"><Clock size={14} className="text-gray-300"/></div>}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Footer con Precio */}
                                <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center mt-auto">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('totalPaid')}</span>
                                    <span className="text-xl font-bold text-gray-800 flex items-baseline">
                                        <span className="text-sm text-gray-400 mr-0.5">$</span>{(req.totalPaid || req.totalAmount || 0).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// 4. COMPONENTE PRINCIPAL
export default function HistoryRequestsCarousel({ requests }: { requests: any[] }) {
  const t = useTranslations('HistoryPage'); // Hook activo
  const [activeTab, setActiveTab] = useState<'LOCAL' | 'INTERNATIONAL' | 'PAYMENTS'>('LOCAL');
  const [searchTerm, setSearchTerm] = useState('');

  // Lógica de Clasificación
  const getServiceType = (req: any) => {
      if (req.serviceType) return req.serviceType;
      if (req.selectedCourier === 'STORAGE_FEE') return 'STORAGE_FEE';
      if (req.gmcShipmentNumber?.startsWith('GMC-SHIP')) return 'CONSOLIDATION';
      if (req.gmcShipmentNumber?.startsWith('PICKUP-')) return 'STORAGE_FEE';
      return 'DEFAULT';
  };

  // Filtrado
  const getFilteredRequests = () => {
      return requests.filter(req => {
          // 1. Filtro por Tab
          const type = getServiceType(req);
          let matchTab = false;
          if (activeTab === 'LOCAL') matchTab = ['SHIPPING', 'DELIVERY', 'STORAGE'].includes(type);
          else if (activeTab === 'INTERNATIONAL') matchTab = ['CONSOLIDATION', 'SHIPPING_INTL'].includes(type);
          else if (activeTab === 'PAYMENTS') matchTab = ['STORAGE_FEE'].includes(type); 
          
          if (!matchTab) return false;

          // 2. Filtro por Buscador
          if (searchTerm) {
              const term = searchTerm.toLowerCase();
              const desc = (req.description || '').toLowerCase();
              const id = (req.id || '').toLowerCase();
              const shipment = (req.gmcShipmentNumber || '').toLowerCase();
              return desc.includes(term) || id.includes(term) || shipment.includes(term);
          }
          
          return true;
      });
  };

  // Agrupación
  const groupedRequests = getFilteredRequests().reduce((acc: any, req) => {
      const type = getServiceType(req);
      if (!acc[type]) acc[type] = [];
      acc[type].push(req);
      return acc;
  }, {});

  const sortedGroupKeys = Object.keys(groupedRequests).sort();

  return (
    <div className="space-y-8">
        
        {/* Controles: Tabs y Buscador */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            {/* TABS (Traducidos) */}
            <div className="flex bg-white p-1 rounded-full border border-gray-200 shadow-sm overflow-x-auto max-w-full">
                <button onClick={() => setActiveTab('LOCAL')} className={`px-5 py-2.5 rounded-full font-bold text-xs flex items-center gap-2 whitespace-nowrap transition-all ${activeTab === 'LOCAL' ? 'bg-gray-800 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}><Truck size={14}/> {t('tabLocal')}</button>
                <button onClick={() => setActiveTab('INTERNATIONAL')} className={`px-5 py-2.5 rounded-full font-bold text-xs flex items-center gap-2 whitespace-nowrap transition-all ${activeTab === 'INTERNATIONAL' ? 'bg-gray-800 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}><Plane size={14}/> {t('tabInternational')}</button>
                <button onClick={() => setActiveTab('PAYMENTS')} className={`px-5 py-2.5 rounded-full font-bold text-xs flex items-center gap-2 whitespace-nowrap transition-all ${activeTab === 'PAYMENTS' ? 'bg-gray-800 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}><DollarSign size={14}/> {t('tabStorage')}</button>
            </div>

            {/* BUSCADOR */}
            <div className="relative w-full md:w-72 group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="text-gray-400 group-focus-within:text-blue-500 transition-colors" size={16} /></div>
                <input 
                    type="text" 
                    placeholder="Buscar ID, descripción..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-full border border-gray-200 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all text-sm shadow-sm"
                />
            </div>
        </div>

        {/* LISTA DE GRUPOS */}
        <div>
            {Object.keys(groupedRequests).length === 0 ? (
                <div className="bg-white py-16 rounded-[2rem] text-center border border-dashed border-gray-200">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText size={24} className="text-gray-300"/>
                    </div>
                    <h3 className="text-lg font-bold text-gray-700">{t('noMovements')}</h3>
                    <p className="text-gray-500 text-sm mt-1">{t('tryFilter')}</p>
                </div>
            ) : (
                sortedGroupKeys.map((type) => <HistoryGroup key={type} type={type} requests={groupedRequests[type]} />)
            )}
        </div>
    </div>
  );
}