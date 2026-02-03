"use client";

import React, { useState } from 'react';
import type { User } from 'next-auth';
import type { Package, ConsolidatedShipment } from '@prisma/client';
import AddressCard from '@/components/AddressCard';
import Link from 'next/link'; 
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { 
    Gift, ArrowRight, Truck, FileText, Package as PackageIcon, 
    CreditCard, CheckCircle, AlertCircle, ChevronRight, 
    UploadCloud, Box, Scale, Calendar, Loader2, ChevronDown, ChevronUp, FileCheck,
    MapPin, Clock, DollarSign, X, Lock, AlertTriangle 
} from 'lucide-react';

// --- TIPO EXTENDIDO PARA LOS CÁLCULOS ---
type PackageWithFees = Package & {
    daysInWarehouse?: number;
    storageFee?: number;
    pickupHandlingFee?: number;
    volumeCft?: number;
    isBlocked?: boolean; 
};

// --- Componentes Reutilizables ---
const KpiCard = ({ value, label, isAlert }: { value: string | number, label: string, isAlert?: boolean }) => (
    <div className={`p-4 rounded-xl shadow-lg text-center h-full flex flex-col justify-center items-center ${isAlert ? 'bg-red-50 border border-red-100' : 'bg-white'}`}>
      <p className={`text-2xl md:text-3xl font-bold ${isAlert ? 'text-red-600' : 'text-gasp-maker-dark-gray'}`}>{value}</p>
      <p className={`text-xs md:text-sm ${isAlert ? 'text-red-500' : 'text-gray-500'} mt-1`}>{label}</p>
    </div>
);

interface ClientDashboardProps {
  user: User & { address?: string; suiteNo?: string; cityZip?: string; country?: string; phone?: string; };
  packages: PackageWithFees[]; 
  totalDebt: number; 
  pendingBillsCount?: number;
  pendingBillsRaw?: (ConsolidatedShipment & { packages: Package[] })[];
  inTransitCount?: number;
  enDestinoCount?: number;
}

// 🔥 CONSTANTE DE HORARIOS
const TIME_SLOTS = [
    { value: "09:00", label: "09:00 AM" },
    { value: "09:30", label: "09:30 AM" },
    { value: "10:00", label: "10:00 AM" },
    { value: "10:30", label: "10:30 AM" },
    { value: "11:00", label: "11:00 AM" },
    { value: "11:30", label: "11:30 AM" },
    { value: "12:00", label: "12:00 PM" },
    { value: "12:30", label: "12:30 PM" },
    { value: "13:00", label: "01:00 PM" },
    { value: "13:30", label: "01:30 PM" },
    { value: "14:00", label: "02:00 PM" },
    { value: "14:30", label: "02:30 PM" },
    { value: "15:00", label: "03:00 PM" },
    { value: "15:30", label: "03:30 PM" },
    { value: "16:00", label: "04:00 PM" },
];

export default function ClientDashboard({ 
    user, 
    packages, 
    totalDebt, 
    pendingBillsCount = 0, 
    pendingBillsRaw = [],
    inTransitCount = 0,
    enDestinoCount = 0
}: ClientDashboardProps) {
    
  // 1. Hook de Traducciones
  const t = useTranslations('Dashboard'); 
  const router = useRouter();

  const [selectedPkgs, setSelectedPkgs] = useState<string[]>([]);
  const [isConsolidating, setIsConsolidating] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  // --- ESTADOS PARA MODALES ---
  const [isPickupModalOpen, setIsPickupModalOpen] = useState(false);
  const [isConsolidateModalOpen, setIsConsolidateModalOpen] = useState(false); 
  
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [isProcessingPickup, setIsProcessingPickup] = useState(false);

  // 1. FILTRADO
  const displayPackages = packages.filter(pkg => 
      pkg.status === 'RECIBIDO_MIAMI' || 
      pkg.status === 'PENDIENTE' || 
      pkg.status === 'PRE_ALERTADO' || 
      pkg.status === 'EN_ALMACEN' ||
      pkg.status === 'EN_PROCESAMIENTO'
  );

  const packagesInMiami = packages.filter(p => p.status === 'RECIBIDO_MIAMI' || p.status === 'EN_ALMACEN');
  const hasPendingAction = pendingBillsCount > 0;

  // --- LÓGICA DE SELECCIÓN ---
  const togglePackage = (id: string, isBlocked?: boolean) => {
      // 🛑 BLOQUEO
      if (isBlocked) {
          alert(t('alertBlocked')); 
          return;
      }

      if (selectedPkgs.includes(id)) {
          setSelectedPkgs(prev => prev.filter(pId => pId !== id));
      } else {
          setSelectedPkgs(prev => [...prev, id]);
      }
  };

  // =========================================================================
  // 🚚 ACCIÓN 1: CONSOLIDAR (VALIDACIÓN Y APERTURA DE MODAL)
  // =========================================================================
  const handleConsolidateClick = () => {
      if (selectedPkgs.length === 0) return;

      if (selectedPkgs.length === 1) {
          alert(t('alertConsolidateOne')); 
          return;
      }

      if (selectedPkgs.length > 7) {
          alert(t('alertConsolidateLimit', { count: selectedPkgs.length })); 
          return;
      }

      // Validación de facturas
      const packagesWithoutInvoice = packages.filter(p => 
          selectedPkgs.includes(p.id) && !p.invoiceUrl
      );

      if (packagesWithoutInvoice.length > 0) {
          const names = packagesWithoutInvoice.map(p => p.carrierTrackingNumber || p.gmcTrackingNumber).join('\n- ');
          alert(`${t('alertMissingInvoice')}\n\n- ${names}`); 
          return; 
      }

      setIsConsolidateModalOpen(true);
  };

  // 🔥 LÓGICA REAL DE CONSOLIDACIÓN
  const onConfirmConsolidation = async () => {
      setIsConsolidating(true);
      try {
          const res = await fetch('/api/shipments/create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  packageIds: selectedPkgs,
                  type: 'CONSOLIDATION'
              })
          });

          if (res.ok) {
              // Sin alerta, solo cerrar y refrescar
              setIsConsolidateModalOpen(false);
              setSelectedPkgs([]);
              router.refresh();
          } else {
              const data = await res.json();
              alert(data.message || t('errorGeneric'));
          }
      } catch (error) {
          console.error(error);
          alert(t('errorConnection'));
      } finally {
          setIsConsolidating(false);
      }
  };

  // =========================================================================
  // 🚗 ACCIÓN 2: RECOGER EN BODEGA (PICKUP)
  // =========================================================================
  const handleOpenPickupModal = () => {
    if (selectedPkgs.length === 0) return;
    setIsPickupModalOpen(true);
  };

  const handleSubmitPickup = async () => {
      if (!pickupDate || !pickupTime) {
          alert(t('alertSelectDate')); 
          return;
      }

      const dateObj = new Date(pickupDate + "T" + pickupTime);
      const day = dateObj.getDay(); 
      const hour = parseInt(pickupTime.split(':')[0]);

      if (day === 0 || day === 6) {
          alert(t('alertWeekend')); 
          return;
      }

      if (hour < 9 || hour >= 16) {
          alert(t('alertBusinessHours')); 
          return;
      }

      setIsProcessingPickup(true);

      try {
          const res = await fetch('/api/shipments/create', { 
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  packageIds: selectedPkgs,
                  type: 'WAREHOUSE_PICKUP', 
                  scheduledDate: pickupDate,
                  scheduledTime: pickupTime
              })
          });

          if (res.ok) {
              // ❌ ALERTA ELIMINADA: Cierre limpio
              setIsPickupModalOpen(false);
              setSelectedPkgs([]);
              setPickupDate("");
              setPickupTime("");
              router.refresh(); 
          } else {
              const data = await res.json();
              alert(data.message || t('errorGeneric'));
          }
      } catch (error) {
          console.error(error);
          alert(t('errorConnection'));
      } finally {
          setIsProcessingPickup(false);
      }
  };

  const selectedPackagesData = packages.filter(p => selectedPkgs.includes(p.id));
  const totalStorageFee = selectedPackagesData.reduce((acc, p) => acc + (p.storageFee || 0), 0);
  const totalHandlingFee = selectedPackagesData.reduce((acc, p) => acc + (p.pickupHandlingFee || 0), 0);
  const grandTotalPickup = totalStorageFee + totalHandlingFee;

  const handlePackageAction = (e: React.MouseEvent, pkg: PackageWithFees) => {
      e.stopPropagation(); 
      router.push(`/dashboard-cliente/paquetes/${pkg.id}`);
  };

  return (
    <div className="bg-gray-100 min-h-screen p-3 sm:p-6 lg:p-8 font-montserrat pb-32 relative">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-6 md:mb-8 mt-2 flex justify-between items-end">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gasp-maker-dark-gray font-garamond">
                    {/* 🚨 CORRECCIÓN: Usamos (as any) para asegurar que TypeScript encuentre 'name' */}
                    {t('welcome', { name: (user as any).name || 'Cliente' })}
                </h1>
            </div>
            {selectedPkgs.length > 0 && (
                <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold animate-in fade-in">
                    {selectedPkgs.length} {t('selectedCount')}
                </div>
            )}
        </div>

        {/* ADDRESS CARD */}
        <div className="mb-8">
            {/* 🚨 CORRECCIÓN: Aseguramos el acceso a name y suiteNo */}
            <AddressCard recipient={(user as any).name || 'Cliente'} suiteNo={(user as any).suiteNo || 'GMC-PENDING'} />
        </div>

        {/* MENÚ DE ACCIONES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6 mb-8">
            <Link href="/dashboard-cliente/pre-alerta" className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all group flex flex-col justify-between h-full">
                <div className="bg-blue-50 w-10 h-10 rounded-lg flex items-center justify-center text-blue-600 mb-3 group-hover:bg-blue-600 group-hover:text-white transition-colors"><PackageIcon size={20} /></div>
                <div><h3 className="font-bold text-gray-800 text-sm mb-1 leading-tight">{t('actionPreAlert')}</h3><p className="text-[10px] text-gray-500 leading-snug">{t('descPreAlert')}</p></div>
            </Link>
            <Link href="/dashboard-cliente/solicitar-pickup" className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all group flex flex-col justify-between h-full">
                <div className="bg-orange-50 w-10 h-10 rounded-lg flex items-center justify-center text-orange-600 mb-3 group-hover:bg-orange-600 group-hover:text-white transition-colors"><Truck size={20} /></div>
                <div><h3 className="font-bold text-gray-800 text-sm mb-1 leading-tight">{t('actionPickup')}</h3><p className="text-[10px] text-gray-500 leading-snug">{t('descPickup')}</p></div>
            </Link>
            <Link href="/dashboard-cliente/historial-solicitudes" className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all group flex flex-col justify-between h-full">
                <div className="bg-purple-50 w-10 h-10 rounded-lg flex items-center justify-center text-purple-600 mb-3 group-hover:bg-purple-600 group-hover:text-white transition-colors"><FileText size={20} /></div>
                <div><h3 className="font-bold text-gray-800 text-sm mb-1 leading-tight">{t('actionHistory')}</h3><p className="text-[10px] text-gray-500 leading-snug">{t('descHistory')}</p></div>
            </Link>
        </div>

        {/* --- CONTENIDO PRINCIPAL --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 space-y-4">
             <div className="flex justify-between items-center px-1 cursor-pointer select-none" onClick={() => setIsExpanded(!isExpanded)}>
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Box className="text-gmc-dorado-principal" size={20}/> {t('packagesInWarehouse')}
                </h2>
                <div className="text-gray-400 hover:text-blue-600 transition-colors">
                    {isExpanded ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                </div>
            </div>

            {isExpanded && (
                displayPackages.length === 0 ? (
                    <div className="bg-white rounded-2xl p-8 text-center border border-gray-200 border-dashed">
                        <Box className="mx-auto text-gray-300 mb-2" size={32} />
                        <p className="text-gray-400 text-sm font-medium">{t('warehouseEmpty')}</p>
                        <p className="text-xs text-gray-300 mt-1">{t('warehouseEmptyHint')}</p>
                    </div>
                ) : (
                    <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 px-1 items-stretch [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                        {displayPackages.map((pkg) => {
                            const isSelected = selectedPkgs.includes(pkg.id);
                            const missingInvoice = !pkg.invoiceUrl;
                            const isBlocked = pkg.isBlocked; 
                            
                            return (
                                <div 
                                    key={pkg.id} 
                                    onClick={() => togglePackage(pkg.id, isBlocked)}
                                    className={`
                                        min-w-[85vw] sm:min-w-[320px] snap-center 
                                        bg-white rounded-2xl shadow-sm border transition-all relative overflow-hidden flex flex-col
                                        ${isBlocked ? 'border-red-200 ring-1 ring-red-100 opacity-95' : ''}
                                        ${isSelected 
                                            ? 'border-transparent ring-2 ring-blue-500 shadow-md transform -translate-y-1 z-10' 
                                            : 'border-gray-100 hover:border-blue-200'}
                                        cursor-pointer group
                                    `}
                                >
                                    {/* CABECERA TARJETA */}
                                    <div className={`p-4 border-b border-gray-50 flex justify-between items-start ${isSelected ? 'bg-blue-50/50' : 'bg-gray-50/50'} ${isBlocked ? '!bg-red-50/50' : ''}`}>
                                        <div className="flex items-center gap-3">
                                            {isBlocked ? (
                                                <div className="w-5 h-5 rounded flex items-center justify-center bg-red-100 text-red-500 shrink-0 shadow-sm border border-red-200">
                                                    <Lock size={12} />
                                                </div>
                                            ) : (
                                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-transparent'}`}>
                                                    <CheckCircle size={14} fill="currentColor" className="text-white" />
                                                </div>
                                            )}
                                            
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('trackingLabel')}</p>
                                                <p className="font-mono text-sm font-bold text-gray-800 truncate max-w-[120px]">
                                                    {pkg.carrierTrackingNumber || pkg.gmcTrackingNumber || 'S/N'}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${isBlocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                            {isBlocked ? t('statusBlocked') : t('statusInWarehouse')}
                                        </span>
                                    </div>

                                    <div className="p-4 flex-1 flex flex-col gap-4">
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 shrink-0">
                                                <PackageIcon size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-800 leading-tight line-clamp-2">
                                                    {pkg.description || t('noDescription')}
                                                </h4>
                                                <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                                                    <span className="flex items-center gap-1"><Scale size={10}/> {pkg.weightLbs || 0} lb</span>
                                                    <span className="flex items-center gap-1"><Calendar size={10}/> {new Date(pkg.updatedAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* INFO EXTRA DE COSTOS */}
                                        {(pkg.storageFee || 0) > 0 && (
                                            <div className="bg-red-50 px-3 py-2 rounded text-xs text-red-600 font-bold flex justify-between items-center border border-red-100">
                                                <span className="flex items-center gap-1"><AlertTriangle size={12}/> {t('storageFee')} ({pkg.daysInWarehouse} {t('days')})</span>
                                                <span>${pkg.storageFee?.toFixed(2)}</span>
                                            </div>
                                        )}

                                        {/* BOTÓN DE ACCIÓN */}
                                        <button 
                                            onClick={(e) => handlePackageAction(e, pkg)}
                                            className={`
                                                mt-auto w-full py-2 px-3 border rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors
                                                ${isBlocked 
                                                    ? 'bg-red-600 text-white border-red-600 hover:bg-red-700 shadow-sm' 
                                                    : missingInvoice 
                                                        ? 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100' 
                                                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-blue-600'}
                                            `}
                                        >
                                            {isBlocked ? (
                                                <><DollarSign size={14} /> {t('btnPayDebt')}</>
                                            ) : missingInvoice ? (
                                                <><AlertCircle size={14} /> {t('btnUploadInvoice')}</>
                                            ) : (
                                                <><FileCheck size={14} className="text-green-500"/> {t('btnInvoiceOK')}</>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                        <div className="w-1 shrink-0"></div>
                    </div>
                )
            )}
          </div>
          
          {/* COLUMNA DERECHA */}
          <div className="space-y-4 md:space-y-5 flex flex-col h-full">
            {hasPendingAction ? (
                <Link href="/dashboard-cliente/pagar-facturas" className="group relative w-full bg-gradient-to-br from-red-600 to-orange-500 rounded-2xl p-4 md:p-5 text-white shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden block">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl group-hover:bg-white/20 transition-all"></div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-3">
                            <div className="bg-red-800/30 px-3 py-1 rounded-full backdrop-blur-md border border-white/20 flex items-center gap-2"><AlertCircle size={14} className="animate-pulse text-yellow-300 shrink-0" /><span className="text-[10px] md:text-xs font-bold uppercase tracking-wide whitespace-nowrap">{t('actionRequired')}</span></div>
                            <CreditCard size={24} className="text-white/80 group-hover:text-white group-hover:scale-110 transition-transform"/>
                        </div>
                        <div className="mb-4">
                            <p className="text-xs text-red-100 font-medium mb-0.5">{t('totalPending')}</p>
                            <h3 className="text-3xl md:text-4xl font-bold font-mono tracking-tight">${totalDebt.toFixed(2)}</h3>
                            <p className="text-xs text-white/80 mt-1 flex items-center gap-1"><FileText size={12}/> {pendingBillsCount} {t('invoices')}</p>
                        </div>
                        <div className="flex items-center justify-between bg-white/10 rounded-xl p-2.5 backdrop-blur-sm group-hover:bg-white group-hover:text-red-600 transition-colors"><span className="font-bold text-sm pl-2">{t('btnPayNow')}</span><div className="bg-white text-red-600 p-1 rounded-lg group-hover:bg-red-600 group-hover:text-white transition-colors"><ChevronRight size={16} /></div></div>
                    </div>
                </Link>
            ) : (
                <div className="w-full bg-white border border-green-100 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center gap-3 py-8">
                    <div className="bg-green-50 p-4 rounded-full text-green-600 mb-2"><CheckCircle size={32} /></div>
                    <div><h3 className="text-gray-800 font-bold text-lg">{t('statusUpToDate')}</h3><p className="text-gray-500 text-sm">{t('noPendingBills')}</p></div>
                </div>
            )}
            
            {/* KPI Cards */}
            <div className="grid grid-cols-2 gap-3 shrink-0">
              <Link href="/dashboard-cliente/en-transito" className="block group">
                 <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100 flex flex-col justify-center items-center hover:border-blue-300 hover:shadow-lg transition-all h-full">
                    <p className="text-2xl md:text-3xl font-bold text-gasp-maker-dark-gray mb-1 group-hover:scale-110 transition-transform">{inTransitCount}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1 group-hover:text-blue-600 font-bold text-center"><Truck size={14} className="shrink-0"/> {t('kpiInTransit')}</p>
                 </div>
              </Link>
              <Link href="/dashboard-cliente/en-destino" className="block group">
                  <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100 flex flex-col justify-center items-center hover:border-green-300 hover:shadow-lg transition-all h-full">
                      <p className="text-2xl md:text-3xl font-bold text-gasp-maker-dark-gray mb-1 group-hover:scale-110 transition-transform group-hover:text-green-600">{enDestinoCount}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 group-hover:text-green-600 font-bold text-center"><PackageIcon size={14} className="shrink-0"/> {t('kpiInDestination')}</p>
                  </div>
              </Link>
            </div>
            
            {/* Referral Banner */}
            <Link href="/dashboard-cliente/referidos" className="block bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-xl shadow-md group relative overflow-hidden hover:shadow-xl transition-all mt-auto">
              <div className="relative z-10 flex justify-between items-center gap-4">
                <div className="flex-1 min-w-0"><p className="font-bold text-sm flex items-center gap-2 mb-0.5 leading-tight"><Gift size={18} className="text-yellow-300 animate-bounce shrink-0" /> <span className="truncate">{t('referralTitle')}</span></p><p className="text-indigo-100 text-xs leading-tight truncate">{t('referralDesc')}</p></div>
                <div className="bg-white/20 p-2 rounded-full group-hover:bg-white group-hover:text-indigo-600 transition-colors shrink-0"><ArrowRight size={16} /></div>
              </div>
            </Link>
          </div>
        </div>

        {/* ===================================================================
           BOTÓN FLOTANTE (BARRA DE ACCIÓN)
           =================================================================== */}
        {selectedPkgs.length > 0 && (
            <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gasp-maker-dark-gray text-white px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 sm:gap-4 z-50 animate-in slide-in-from-bottom-6 border border-gray-700 w-[95%] sm:w-auto max-w-md justify-between sm:justify-center">
                
                <span className="text-xs sm:text-sm font-bold whitespace-nowrap pl-2">{selectedPkgs.length} {t('selectedCount')}</span>
                <div className="h-4 w-px bg-gray-600 hidden sm:block"></div>
                
                <div className="flex items-center gap-2">
                    {/* BOTÓN RECOGER */}
                    <button 
                        onClick={handleOpenPickupModal}
                        disabled={isConsolidating}
                        className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-full text-xs font-bold transition-colors flex items-center gap-2"
                    >
                       <MapPin size={14}/> {t('btnPickup')}
                    </button>

                    {/* 🔥 BOTÓN CONSOLIDAR (DISPARADOR DEL MODAL) */}
                    <button 
                        onClick={handleConsolidateClick}
                        disabled={isConsolidating}
                        className="bg-gmc-dorado-principal hover:bg-yellow-500 text-black px-3 py-1.5 rounded-full text-xs font-bold transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isConsolidating ? <Loader2 className="animate-spin" size={14} /> : <Box size={14} />}
                        {isConsolidating ? '...' : t('btnConsolidate')}
                    </button>
                </div>
            </div>
        )}

        {/* ===================================================================
           MODAL DE CONSOLIDACIÓN (NUEVO)
           =================================================================== */}
        {isConsolidateModalOpen && (
            <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                    
                    {/* Encabezado */}
                    <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <Box className="text-gmc-dorado-principal" size={20}/>
                            {t('requestConsolidation')}
                        </h3>
                        <button onClick={() => setIsConsolidateModalOpen(false)} className="text-gray-400 hover:text-red-500">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="p-6">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-100">
                                <Box size={32} className="text-blue-600"/>
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 mb-2">
                                {t('confirmConsolidate', { count: selectedPkgs.length })}
                            </h3>
                            <p className="text-sm text-gray-500 leading-relaxed">
                                {t.rich('custom_text', {
                                    strong: (chunks) => <strong>{chunks}</strong>
                                }) || "Al consolidar, agruparemos tus paquetes en un solo envío para que ahorres en costos de transporte."}
                            </p>
                        </div>

                        {/* Pequeña lista de items seleccionados (Visual) */}
                        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 max-h-40 overflow-y-auto mb-2">
                            <p className="text-xs font-bold text-gray-400 uppercase mb-2 pl-1">Paquetes seleccionados:</p>
                            <ul className="space-y-2">
                                {selectedPackagesData.map((pkg, idx) => (
                                    <li key={pkg.id} className="flex items-center gap-2 text-xs text-gray-700">
                                        <span className="bg-white w-5 h-5 rounded flex items-center justify-center border text-blue-500 font-bold">{idx + 1}</span>
                                        <span className="truncate flex-1">{pkg.description || 'Sin descripción'}</span>
                                        <span className="font-mono text-gray-400">{pkg.weightLbs}lb</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                        <button 
                            onClick={() => setIsConsolidateModalOpen(false)}
                            className="px-4 py-2 text-gray-600 font-bold text-sm hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            {t('cancel')}
                        </button>
                        <button 
                            onClick={onConfirmConsolidation}
                            disabled={isConsolidating}
                            className="bg-gmc-dorado-principal hover:bg-yellow-500 text-black px-6 py-2 rounded-lg font-bold text-sm shadow-md flex items-center gap-2 disabled:opacity-70"
                        >
                            {isConsolidating ? <Loader2 className="animate-spin" size={16}/> : <CheckCircle size={16}/>}
                            {isConsolidating ? t('sendingRequest') : t('btnConsolidate')}
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* ===================================================================
           MODAL DE PICKUP (AGENDADOR)
           =================================================================== */}
        {isPickupModalOpen && (
            <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                    
                    {/* Encabezado */}
                    <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <Truck className="text-gmc-dorado-principal" size={20}/>
                            {t('modalPickupTitle')}
                        </h3>
                        <button onClick={() => setIsPickupModalOpen(false)} className="text-gray-400 hover:text-red-500">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="p-6">
                        <p className="text-sm text-gray-500 mb-4">
                            {t('modalPickupDesc')}
                        </p>

                        {/* Resumen de Costos */}
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-6 space-y-2">
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>{t('feeStorage')}</span>
                                <span className="font-bold">${totalStorageFee.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>{t('feeHandling')}</span>
                                <span className="font-bold">${totalHandlingFee.toFixed(2)}</span>
                            </div>
                            <div className="border-t border-blue-200 pt-2 mt-2 flex justify-between text-base font-bold text-blue-800">
                                <span>{t('feeTotal')}</span>
                                <span>${grandTotalPickup.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Formulario */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('labelDate')}</label>
                                {/* 🔥 INPUT DE FECHA MEJORADO */}
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20}/>
                                    <input 
                                        type="date" 
                                        className="w-full p-3 pl-10 border border-gray-200 rounded-xl text-base bg-white appearance-none font-medium text-gray-700 focus:ring-2 focus:ring-gmc-dorado-principal focus:border-transparent transition-all shadow-sm placeholder-gray-400"
                                        min={new Date().toISOString().split('T')[0]}
                                        value={pickupDate}
                                        onChange={(e) => setPickupDate(e.target.value)}
                                    />
                                </div>
                            </div>
                            
                            {/* 🔥 SELECTOR DE HORA MODERNO */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('labelTime')}</label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                        <Clock size={18} />
                                    </div>
                                    <select
                                        className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 font-medium text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer transition-all hover:bg-white"
                                        value={pickupTime}
                                        onChange={(e) => setPickupTime(e.target.value)}
                                    >
                                        <option value="" disabled>-- : --</option>
                                        {TIME_SLOTS.map((slot) => (
                                            <option key={slot.value} value={slot.value}>
                                                {slot.label}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                        <ChevronDown size={16} />
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                        <button 
                            onClick={() => setIsPickupModalOpen(false)}
                            className="px-4 py-2 text-gray-600 font-bold text-sm hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            {t('btnCancel')}
                        </button>
                        <button 
                            onClick={handleSubmitPickup}
                            disabled={isProcessingPickup}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold text-sm shadow-md flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isProcessingPickup ? <Loader2 className="animate-spin" size={16}/> : <CheckCircle size={16}/>}
                            {isProcessingPickup ? '...' : t('btnConfirmAppt')}
                        </button>
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
}