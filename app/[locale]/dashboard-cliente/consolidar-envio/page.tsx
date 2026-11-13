"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Package, Plane, ArrowLeft, CheckCircle, Loader2, AlertTriangle, ChevronDown, ChevronUp, Check, Ship } from 'lucide-react';
import { useTenantRates } from '@/hooks/useTenantRates';
import { formatDays } from '@/lib/formatDays';
import { useTranslations } from 'next-intl';

const MAX_WEIGHT_PER_BOX = 100;

export default function ConsolidateShipmentPage() {
  const router = useRouter();
  const tenantRates = useTenantRates();
  const t = useTranslations('PackageDetail');
  const paymentSectionRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isInventoryOpen, setIsInventoryOpen] = useState(true);
  const [availableRates, setAvailableRates] = useState<any[]>([]);
  const [loadingRates, setLoadingRates] = useState(false);
  const [selectedRate, setSelectedRate] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const invRes = await fetch('/api/user/history');
        if (invRes.ok) {
          const data = await invRes.json();
          const ready = data.requests ? data.requests.filter((r: any) => ['RECIBIDO_MIAMI','EN_ALMACEN','RECEIVED','PRE_ALERTADO','PRE_ALERTA','PENDIENTE','RECIBIDO','EN_BODEGA','DISPONIBLE'].includes(r.status)) : [];
          setInventory(ready);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const selectedPackages = inventory.filter(p => selectedIds.includes(p.id));
  const totalWeight = selectedPackages.reduce((sum, p) => sum + (p.weightLbs || 1), 0);
  const isOverweight = totalWeight > MAX_WEIGHT_PER_BOX;

  useEffect(() => {
    if (selectedIds.length === 0) { setAvailableRates([]); setSelectedRate(null); return; }
    const fetchRates = async () => {
      setLoadingRates(true);
      setSelectedRate(null);
      try {
        const res = await fetch('/api/rates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ weightLbs: totalWeight, serviceType: 'SHIPPING_INTL', destination: { countryCode: 'VE', zip: '', city: '' } })
        });
        const data = await res.json();
        setAvailableRates(data.rates || []);
      } catch (e) { console.error(e); }
      finally { setLoadingRates(false); }
    };
    fetchRates();
  }, [selectedIds.join(',')]);

  useEffect(() => {
    if (selectedRate && paymentSectionRef.current) {
      setTimeout(() => { paymentSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 100);
    }
  }, [selectedRate]);

  const togglePackage = (id: string) => {
    if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(i => i !== id));
    else setSelectedIds([...selectedIds, id]);
  };

  const SF = tenantRates?.stripe_fixed_fee ?? 0.30;
  const SP = tenantRates?.processing_fee_pct ?? 0.044;
  const freight = selectedRate?.price || 0;
  const totalWithFee = freight > 0 ? parseFloat(((freight + SF) / (1 - SP)).toFixed(2)) : 0;
  const processingFee = parseFloat((totalWithFee - freight).toFixed(2));

  const handleRequestConsolidation = async () => {
    if (selectedIds.length === 0) return;
    setProcessing(true);
    try {
      const res = await fetch('/api/consolidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageIds: selectedIds })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al solicitar consolidación');
      setSuccess(data.masterTracking);
    } catch (error: any) {
      alert(error.message || 'Error de proceso.');
    } finally {
      setProcessing(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-montserrat">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <CheckCircle className="mx-auto text-green-500 mb-4" size={56} />
          <h2 className="text-2xl font-bold text-gray-800 font-garamond mb-2">¡Solicitud Enviada!</h2>
          <p className="text-gray-500 mb-2">Tu solicitud de consolidación fue recibida.</p>
          <p className="text-sm font-mono bg-gray-100 px-4 py-2 rounded-lg inline-block mb-6">Tracking: <strong>{success}</strong></p>
          <p className="text-xs text-gray-400 mb-6">Nuestro equipo procesará tu envío y recibirás una factura con el costo real una vez que los paquetes sean consolidados.</p>
          <Link href="/dashboard-cliente" className="block w-full py-3 bg-gmc-dorado-principal text-gmc-gris-oscuro font-bold rounded-xl hover:bg-yellow-400 transition-all">Volver al Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 font-montserrat">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center mb-8">
          <Link href="/dashboard-cliente" className="text-gray-500 hover:text-gmc-dorado-principal mr-4"><ArrowLeft size={24} /></Link>
          <h1 className="text-2xl font-bold text-gmc-gris-oscuro font-garamond">Solicitar Consolidación</h1>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex gap-3">
          <div className="text-blue-500 mt-0.5">ℹ️</div>
          <div>
            <p className="text-sm font-bold text-blue-800">¿Cómo funciona?</p>
            <p className="text-xs text-blue-600 mt-1">Selecciona los paquetes que deseas consolidar. El estimado es referencial. Una vez que nuestro equipo procese tu consolidación, recibirás la factura con el costo real.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div onClick={() => setIsInventoryOpen(!isInventoryOpen)} className="p-6 flex justify-between items-center cursor-pointer hover:bg-gray-50">
                <div>
                  <h3 className="font-bold text-gmc-gris-oscuro text-lg">{t('selectPackages')}</h3>
                  <p className="text-xs text-gray-500">{inventory.length} paquetes disponibles en Miami</p>
                </div>
                <div className="text-gray-400">{isInventoryOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</div>
              </div>
              {isInventoryOpen && (
                <div className="p-6 pt-0">
                  {selectedIds.length > 0 && (
                    <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
                      <div className="flex justify-between text-xs font-bold mb-2">
                        <span className={isOverweight ? "text-red-500" : "text-gray-600"}>Peso Acumulado: {totalWeight.toFixed(1)} lbs</span>
                        <span className="text-gray-400">Límite: {MAX_WEIGHT_PER_BOX} lbs</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className={`h-2.5 rounded-full transition-all ${isOverweight ? "bg-red-500" : "bg-green-500"}`} style={{ width: `${Math.min((totalWeight / MAX_WEIGHT_PER_BOX) * 100, 100)}%` }} />
                      </div>
                      {isOverweight && <p className="text-xs text-red-500 mt-2 flex items-center gap-1 font-bold"><AlertTriangle size={12} /> Has excedido el límite de consolidación.</p>}
                    </div>
                  )}
                  {loading ? (
                    <div className="text-center py-10"><Loader2 className="animate-spin mx-auto text-gray-400" /></div>
                  ) : inventory.length === 0 ? (
                    <div className="text-center py-10 bg-gray-50 rounded-lg">
                      <Package className="mx-auto text-gray-300 mb-2" size={32} />
                      <p className="text-gray-500">No tienes paquetes listos en Miami.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-thin">
                      {inventory.map((pkg) => (
                        <div key={pkg.id} onClick={() => togglePackage(pkg.id)} className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedIds.includes(pkg.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-gray-200'}`}>
                          <div className={`w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 ${selectedIds.includes(pkg.id) ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-300 bg-white'}`}>
                            {selectedIds.includes(pkg.id) && <Check size={14} strokeWidth={4} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-800 text-sm truncate">{pkg.description || 'Paquete sin descripción'}</p>
                            <p className="text-xs text-gray-500">Tracking: {pkg.gmcTrackingNumber || pkg.id.slice(0, 8)}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-bold text-gray-700 text-sm">{pkg.weightLbs || 1} lb</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            {selectedIds.length > 0 && !isOverweight && (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="font-bold text-gmc-gris-oscuro mb-1">Estimado de Tarifas</h3>
                <p className="text-xs text-gray-400 mb-4">Referencial — el costo final lo determina el peso real consolidado</p>
                {loadingRates ? (
                  <div className="flex items-center gap-2 text-gray-400 py-4"><Loader2 className="animate-spin" size={18} /><span className="text-sm">Calculando tarifas...</span></div>
                ) : availableRates.length === 0 ? (
                  <p className="text-gray-400 text-sm">No hay tarifas disponibles.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {availableRates.map((r: any) => (
                      <button key={r.id} onClick={() => setSelectedRate(r)} className={`p-4 rounded-xl border-2 text-left transition-all ${selectedRate?.id === r.id ? 'border-gmc-dorado-principal bg-yellow-50 shadow-md' : 'border-gray-200 hover:border-gray-300'}`}>
                        <div className="flex justify-between items-start mb-2">
                          {r.service?.toLowerCase().includes('maritim') || r.service?.toLowerCase().includes('ocean') ? <Ship size={18} className={selectedRate?.id === r.id ? 'text-gmc-dorado-principal' : 'text-gray-400'} /> : <Plane size={18} className={selectedRate?.id === r.id ? 'text-gmc-dorado-principal' : 'text-gray-400'} />}
                          <span className="text-xs font-bold bg-white px-2 py-1 rounded border shadow-sm">{formatDays(r.days || '', t)}</span>
                        </div>
                        <p className="font-bold text-gray-800 text-sm">{r.carrier}</p>
                        <p className="text-xs text-gray-500 mt-1">{r.service}</p>
                        <p className="text-lg font-black text-gray-800 mt-2">${r.price.toFixed(2)}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="lg:col-span-1">
            <div ref={paymentSectionRef} className="bg-gmc-gris-oscuro text-white p-6 rounded-2xl shadow-xl sticky top-6 scroll-mt-6">
              <h3 className="font-bold text-gmc-dorado-principal text-lg mb-6 border-b border-gray-600 pb-4">Resumen</h3>
              <div className="space-y-4 mb-6 text-sm">
                <div className="flex justify-between"><span className="text-gray-400">Paquetes</span><span className="text-white font-bold">{selectedIds.length}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Peso estimado</span><span className={isOverweight ? "text-red-400 font-bold" : "text-white"}>{totalWeight.toFixed(2)} lbs</span></div>
                <div className="border-t border-gray-600 my-2" />
                {selectedRate ? (
                  <>
                    <div className="flex justify-between items-center"><span className="text-gray-300">Flete est. ({selectedRate.carrier})</span><span className="font-mono font-bold">${freight.toFixed(2)}</span></div>
                    <div className="flex justify-between items-center text-xs text-gray-400"><span>Fee procesamiento</span><span>+${processingFee.toFixed(2)}</span></div>
                    <div className="flex justify-between pt-4 border-t border-gray-600 text-xl font-bold"><span>ESTIMADO</span><span className="text-gmc-dorado-principal">${totalWithFee.toFixed(2)}</span></div>
                    <p className="text-xs text-gray-500 text-center">*El cobro real se genera cuando admin procesa</p>
                  </>
                ) : (
                  <div className="text-center py-4 text-gray-500 text-xs">{selectedIds.length > 0 ? 'Selecciona una tarifa para ver el estimado' : 'Selecciona paquetes para ver el estimado'}</div>
                )}
              </div>
              <button onClick={handleRequestConsolidation} disabled={processing || selectedIds.length === 0 || isOverweight} className="w-full py-4 bg-gmc-dorado-principal text-gmc-gris-oscuro font-bold rounded-xl hover:bg-white transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {processing ? <Loader2 className="animate-spin" /> : <Package size={20} />}
                {processing ? 'Procesando...' : 'Solicitar Consolidación'}
              </button>
              {isOverweight && <p className="text-xs text-center text-red-400 mt-3 font-bold animate-pulse">¡Excedes el límite de {MAX_WEIGHT_PER_BOX} lbs!</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
