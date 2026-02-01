"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, Camera, MapPin, AlertCircle, 
  Truck, DollarSign, Loader2, CreditCard, CheckCircle, 
  Upload, ChevronDown, ChevronUp, Plus, ExternalLink,
  Calendar, User, ShieldCheck, FileText, Clock, Tag, XCircle 
} from 'lucide-react';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation'; 
import { getProcessingFee } from '@/lib/stripeCalc'; 
import { useTranslations } from 'next-intl';

const getCarrierLogo = (carrier: string): string => {
  const c = carrier.toLowerCase();
  if (c.includes('fedex')) return '/fedex-express-6.svg';
  if (c.includes('dhl')) return '/dhl-1.svg';
  if (c.includes('ups')) return '/ups-united-parcel-service.svg';
  return '/gaspmakercargoproject.png';
};

interface PackageDetailProps {
    pkg: any;
    userProfile: any;
    savedCards?: any[]; 
}

export default function PackageDetailClient({ pkg, userProfile, savedCards = [] }: PackageDetailProps) {
  const t = useTranslations('PackageDetail');
  const tPickup = useTranslations('Pickup'); 
  const tBills = useTranslations('PendingBills'); 

  const router = useRouter();
  const params = useParams(); 
  const locale = params?.locale || 'en'; 

  const couriersRef = useRef<HTMLDivElement>(null);
  
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(pkg.invoiceUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [rates, setRates] = useState<any[]>([]);
  const [loadingRates, setLoadingRates] = useState(false);
  const [selectedRate, setSelectedRate] = useState<any>(null);
  
  const [cards, setCards] = useState<any[]>(savedCards);
  
  const [selectedCardId, setSelectedCardId] = useState<string>('');
  const [isPaying, setIsPaying] = useState(false);
  const [showMobileDetails, setShowMobileDetails] = useState(false);

  // ESTADO DEL CUPÓN
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState({ type: '', text: '' });
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // 🔥 LÓGICA DE HANDLING FEE DINÁMICA
  // Si hay tarifa seleccionada y es GMC -> Fee $0. Si no, usamos el del paquete (o $10 por defecto si no es GMC).
  // Nota: Si el usuario no ha cotizado, asumimos $10 visualmente hasta que seleccione.
  const isGMCSelected = selectedRate?.carrier?.toUpperCase().includes('GASP') || 
                        selectedRate?.carrier?.toUpperCase().includes('GMC') || 
                        selectedRate?.id?.includes('gmc');

  // Si ya seleccionó GMC, es $0. Si no ha seleccionado nada o es otro, es $10 (o lo que venga del pkg).
  const handlingFee = isGMCSelected ? 0.00 : (pkg.handlingFee || 10.00);

  const declaredValue = Number(pkg.declaredValue) || 0;
  const insuranceCost = declaredValue > 100 ? declaredValue * 0.03 : 0;

  const warehousePhoto = pkg.photoUrlMiami && pkg.photoUrlMiami.startsWith('http') 
      ? pkg.photoUrlMiami 
      : null;

  const isReadyToShip = pkg.status === 'RECIBIDO_MIAMI' || pkg.status === 'EN_ALMACEN';
  const hasInvoice = !!invoiceUrl && invoiceUrl.startsWith('http');
  const hasAddress = !!userProfile.address;
  const isOverdue = Number(pkg.storageDebt) > 0;
  const isDelivered = pkg.status === 'ENTREGADO';
  const isAdminVerifiedValue = declaredValue > 0;

  // Lógica para preseleccionar la tarjeta por defecto
  useEffect(() => {
    if (cards.length > 0 && !selectedCardId) {
        const def = cards.find((c: any) => c.isDefault);
        if (def) setSelectedCardId(def.id);
        else setSelectedCardId(cards[0].id);
    }
  }, [cards, selectedCardId]);

  // Fallback cards
  useEffect(() => {
    if (cards.length === 0) {
        const fetchCards = async () => {
            try {
              const res = await fetch('/api/user/cards');
              if (res.ok) {
                const data = await res.json();
                setCards(data.cards);
              }
            } catch (e) { console.error(e); }
        };
        fetchCards();
    }
  }, [cards.length]);

  // Resetear descuento
  useEffect(() => {
    if (discount > 0 && selectedRate) {
        if (selectedRate.price < 100) {
            setDiscount(0);
            setCouponMsg({ type: 'error', text: 'Discount removed: Shipment value is under $100.' });
        }
    }
  }, [selectedRate, discount]);

  const handleAddCardRedirect = () => {
     router.push(`/${locale}/account-settings?tab=billing`);
  };

  const handleQuote = async () => {
    if (!hasInvoice) { alert("⚠️ " + t('invoiceRequired')); return; }
    if (!hasAddress) { alert("⚠️ " + tBills('errorAddress')); return; }
    if (!isAdminVerifiedValue) { alert("⚠️ Esperando validación del valor por el Admin."); return; }
    
    setLoadingRates(true);
    setRates([]);
    setDiscount(0); 
    setCouponMsg({ type: '', text: '' });
    
    try {
        const res = await fetch('/api/rates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                weight: pkg.weightLbs || 1,
                dimensions: { length: pkg.lengthIn, width: pkg.widthIn, height: pkg.heightIn },
                destination: userProfile
            })
        });
        const data = await res.json();
        
        let availableRates = [];
        if (res.ok && data.rates && data.rates.length > 0) {
            availableRates = data.rates.map((r: any) => ({ ...r, logo: getCarrierLogo(r.carrier) }));
        } else {
            availableRates = [
                { id: 'ups-std', carrier: 'UPS', service: 'Standard', price: (pkg.weightLbs * 3.8) + 15, days: '5-7', logo: '/ups-united-parcel-service.svg' },
            ];
        }

        if (userProfile.countryCode?.toUpperCase() === 'TT') {
            availableRates.unshift({
                id: 'gmc-tt', carrier: 'Gasp Maker Cargo', service: 'Air Freight (Trinidad Direct)',
                price: (pkg.weightLbs * 2.50) + 10, currency: 'USD', days: '3-5', logo: '/gaspmakercargoproject.png'
            });
        }
        setRates(availableRates);
        setTimeout(() => couriersRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 200);

    } catch (error) { alert("Error calculando tarifas."); } 
    finally { setLoadingRates(false); }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    if (!selectedRate) {
        setCouponMsg({ type: 'error', text: 'Select a shipping method first.' });
        return;
    }

    setValidatingCoupon(true);
    setCouponMsg({ type: '', text: '' });
    setDiscount(0);

    if (selectedRate.price < 100) {
        setTimeout(() => {
            setCouponMsg({ type: 'error', text: 'Give $25, Get $25: Valid only on shipments over $100 USD.' });
            setValidatingCoupon(false);
        }, 600); 
        return;
    }

    setTimeout(() => {
        setDiscount(25.00);
        setCouponMsg({ type: 'success', text: 'Referral Credit applied! (-$25.00)' });
        setValidatingCoupon(false);
    }, 800);
  };

  const handlePay = async () => {
    if (!selectedRate || !selectedCardId) {
        alert("Selecciona un método de envío y una tarjeta.");
        return;
    }
    
    setIsPaying(true);
    
    const servicePrice = selectedRate.price;
    const baseAmount = servicePrice + handlingFee + insuranceCost;
    const fee = getProcessingFee ? getProcessingFee(baseAmount) : baseAmount * 0.0727;
    const total = Math.max(0, baseAmount + fee - discount);

    try {
        const payRes = await fetch('/api/payments/charge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amountNet: total, 
                paymentMethodId: selectedCardId,
                serviceType: 'SINGLE_SHIPMENT', 
                description: `Envío ${pkg.gmcTrackingNumber} via ${selectedRate.carrier} ${discount > 0 ? '(Promo Applied)' : ''}`,
                packageIds: [pkg.id],
                discountApplied: discount 
            })
        });
        
        const payData = await payRes.json();
        if (!payRes.ok) throw new Error(payData.message || "Error al procesar el cobro.");

        const shipRes = await fetch('/api/shipments/create', { 
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ 
                 packageIds: [pkg.id], 
                 selectedCourier: selectedRate.carrier,
                 courierService: selectedRate.service,
                 totalWeight: pkg.weightLbs,
                 subtotal: servicePrice,
                 processingFee: fee,
                 insuranceCost: insuranceCost,
                 // 🔥 ENVIAMOS EL HANDLING QUE CALCULAMOS ($0 O $10)
                 handlingFee: handlingFee, 
                 discount: discount, 
                 totalPaid: total,
                 stripePaymentId: payData.paymentId,
                 shippingAddress: `${userProfile.address}, ${userProfile.cityZip}, ${userProfile.country || userProfile.countryCode}`
             })
        });

        const shipData = await shipRes.json();
        if (shipRes.ok) {
            router.push(`/${locale}/dashboard-cliente`); 
        } else {
            throw new Error(shipData.message || "Error registrando el envío.");
        }
    } catch (error: any) {
        console.error("ERROR DE PAGO:", error);
        alert(error.message || "Error de conexión.");
    } finally {
        setIsPaying(false);
    }
  };

  const handleInvoiceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return; setIsUploading(true);
    try {
      const fd = new FormData(); fd.append('file', file); fd.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ml_default');
      const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/${file.type.includes('pdf')?'raw':'image'}/upload`, { method: 'POST', body: fd });
      const data = await res.json();
      if (data.secure_url) {
        await fetch('/api/packages/update-invoice', { method: 'POST', body: JSON.stringify({ packageId: pkg.id, invoiceUrl: data.secure_url }) });
        setInvoiceUrl(data.secure_url); router.refresh();
      }
    } catch (e) { alert("Error subir"); } finally { setIsUploading(false); }
  };

  const servicePrice = selectedRate ? selectedRate.price : 0;
  const baseAmount = servicePrice + handlingFee + insuranceCost; 
  const fee = selectedRate ? (getProcessingFee ? getProcessingFee(baseAmount) : baseAmount * 0.0727) : 0;
  const servicePriceWithFee = servicePrice + fee;
  const totalAmount = Math.max(0, servicePriceWithFee + handlingFee + insuranceCost - discount);

  if (isDelivered) {
    return (
      <div className="max-w-3xl mx-auto p-4 font-sans animate-in fade-in pb-20">
        <div className="bg-green-600 text-white p-6 rounded-t-2xl shadow-lg text-center mt-6">
            <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle size={32} />
            </div>
            <h1 className="text-2xl font-bold mb-1">¡PAQUETE ENTREGADO!</h1>
            <p className="font-mono opacity-90 text-sm tracking-wider">{pkg.gmcTrackingNumber}</p>
        </div>
        <div className="bg-white p-6 rounded-b-2xl shadow-md border border-gray-100 space-y-6">
            <div className="border border-green-100 bg-green-50/50 rounded-xl p-4">
                <h3 className="text-green-800 font-bold flex items-center gap-2 mb-4">
                    <Camera size={20}/> Prueba de Entrega (Proof of Delivery)
                </h3>
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden relative flex items-center justify-center group">
                    {pkg.deliveryPhotoUrl ? (
                         <div className="relative w-full h-[350px]">
                            <Image src={pkg.deliveryPhotoUrl} alt="Evidencia de Entrega" fill className="object-contain"/>
                        </div>
                    ) : (
                        <div className="text-center text-gray-400 py-10">
                            <Camera size={48} className="mx-auto mb-2 opacity-20"/>
                            <p>Foto no disponible</p>
                        </div>
                    )}
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-gray-500 text-xs uppercase font-bold mb-1">Entregado el:</p>
                    <p className="text-gray-800 font-bold flex items-center gap-2 text-base">
                        <Calendar size={18} className="text-green-600"/>
                        {pkg.updatedAt ? new Date(pkg.updatedAt).toLocaleDateString() : 'Fecha pendiente'}
                    </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-gray-500 text-xs uppercase font-bold mb-1">Recibido por / Firma:</p>
                    <p className="text-gray-800 font-bold flex items-center gap-2 text-base">
                        <User size={18} className="text-green-600"/>
                        {pkg.user?.name || 'Cliente'}
                    </p>
                </div>
            </div>
            <div className="pt-6 border-t border-gray-100 text-center">
                <p className="text-xs text-gray-400">Este comprobante digital certifica la entrega final del paquete.</p>
                <p className="text-xs text-gray-300 mt-1 font-mono">{pkg.id}</p>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32 lg:pb-10 font-montserrat">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start pt-6">
            <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                        <h2 className="flex items-center gap-2 font-bold text-gray-800 text-base mb-4 border-b border-gray-100 pb-2"><Box className="text-gmc-dorado-principal" size={20}/> {t('detailsTitle')}</h2>
                        <div className="space-y-4">
                            <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('tracking')}</p><p className="text-lg font-bold text-gray-800 font-mono">{pkg.carrierTrackingNumber || 'N/A'}</p></div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('description')}</p>
                                <p className="text-gray-700 text-sm flex items-center gap-2">
                                    <FileText size={14} className="text-gray-400"/>
                                    {pkg.description || "Sin descripción"}
                                </p>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-2">
                                <div className="bg-gray-50 p-3 rounded-lg"><p className="text-[10px] font-bold text-gray-400">{t('weight')}</p><span className="text-xl font-bold">{pkg.weightLbs}</span> <span className="text-xs">lb</span></div>
                                <div className="bg-gray-50 p-3 rounded-lg"><p className="text-[10px] font-bold text-gray-400">{t('dimensions')}</p><span className="text-lg font-bold">{pkg.lengthIn}x{pkg.widthIn}x{pkg.heightIn}</span></div>
                                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                    <p className="text-[10px] font-bold text-blue-400">Valor (USD)</p>
                                    <span className="text-lg font-bold text-blue-700">${declaredValue.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col">
                        <h2 className="flex items-center gap-2 font-bold text-gray-800 text-base mb-4 border-b border-gray-100 pb-2"><Camera className="text-orange-500" size={20}/> {t('photoTitle')}</h2>
                        <div className="flex-1 bg-gray-100 rounded-xl border-2 border-dashed flex items-center justify-center relative min-h-[180px] overflow-hidden">
                            {warehousePhoto ? (
                                <Image src={warehousePhoto} alt="Warehouse Evidence" fill className="object-contain p-2 hover:scale-105 transition-transform duration-300"/>
                            ) : (
                                <div className="text-center text-gray-400"><Box size={40} className="mx-auto mb-2 opacity-30"/><p className="text-xs font-bold">{t('noPhoto')}</p></div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-full ${hasInvoice ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-400'}`}>{hasInvoice ? <CheckCircle size={24}/> : <AlertCircle size={24}/>}</div>
                        <div><p className="text-sm font-bold text-gray-700">{hasInvoice ? t('fileUploaded') : t('noInvoice')}</p>{hasInvoice && <a href={invoiceUrl!} target="_blank" className="text-xs text-blue-500 underline">{t('viewFile')}</a>}</div>
                    </div>
                    <label className="cursor-pointer bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-xs font-bold hover:bg-gray-50 flex items-center gap-2">
                        {isUploading ? <Loader2 className="animate-spin" size={14}/> : <Upload size={14}/>} {hasInvoice ? t('replaceBtn') : t('uploadBtn')}
                        <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleInvoiceUpload} disabled={isUploading}/>
                    </label>
                </div>
                
                <div className="bg-white border border-blue-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-blue-50 p-5 border-b border-blue-100 flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div className="flex items-start gap-3">
                            <div className="bg-white p-2 rounded-full shadow-sm text-blue-600"><MapPin size={24} /></div>
                            <div>
                                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wide mb-1">{t('quotingFor')}:</p>
                                {hasAddress ? (
                                    <div className="text-blue-900 leading-snug">
                                        <p className="font-bold text-base">{userProfile.name}</p>
                                        <p className="text-sm">{userProfile.address}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-sm">{userProfile.cityZip}</span>
                                            <span className="font-bold bg-blue-200 text-blue-800 text-[10px] px-2 py-0.5 rounded uppercase">{userProfile.countryName || userProfile.countryCode}</span>
                                        </div>
                                    </div>
                                ) : <div className="text-orange-600 text-sm font-bold">⚠️ {tBills('errorAddress')}</div>}
                            </div>
                        </div>
                        {isReadyToShip && !rates.length && (
                            isOverdue ? (
                                <div className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-xs font-bold border border-red-200 flex items-center gap-2">
                                    <AlertCircle size={16}/> {tBills('alertBlocked')}
                                </div>
                            ) : !isAdminVerifiedValue ? (
                                <div className="bg-yellow-50 text-yellow-800 px-6 py-3 rounded-xl text-sm font-bold border border-yellow-200 flex items-center gap-3 w-full sm:w-auto animate-pulse">
                                    <Clock size={18} className="text-yellow-600"/>
                                    <div className="flex flex-col">
                                        <span>Esperando verificación...</span>
                                        <span className="text-[10px] font-normal opacity-80">El almacén debe confirmar el valor.</span>
                                    </div>
                                </div>
                            ) : (
                                <button onClick={handleQuote} disabled={loadingRates || !hasAddress} className="w-full sm:w-auto bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition shadow-md flex items-center justify-center gap-2">
                                    {loadingRates ? <Loader2 className="animate-spin" size={16}/> : <Truck size={16}/>} {t('viewRatesBtn')}
                                </button>
                            )
                        )}
                    </div>
                    {rates.length > 0 && (
                        <div ref={couriersRef} className="p-5 animate-fadeIn">
                            <p className="text-xs font-bold text-gray-400 uppercase mb-3">{t('shippingOptions')}:</p>
                            <div className="space-y-3">
                                {rates.map((rate) => (
                                    <div 
                                        key={rate.id}
                                        onClick={() => setSelectedRate(rate)}
                                        className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                            selectedRate?.id === rate.id 
                                            ? 'border-blue-600 bg-blue-50/50 shadow-sm' 
                                            : 'border-gray-200 bg-white hover:border-blue-300'
                                        }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-10 relative flex-shrink-0 flex items-center justify-center">
                                                {rate.logo ? <Image src={rate.logo} alt={rate.carrier} width={40} height={40} style={{objectFit: 'contain'}}/> : <Truck className="text-gray-400"/>}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800 text-sm">{rate.carrier}</p>
                                                <p className="text-xs text-gray-500">{rate.service} • {rate.days}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-blue-700">${rate.price.toFixed(2)}</p>
                                            {selectedRate?.id === rate.id && <p className="text-[10px] text-blue-600 font-bold">{t('selectedBtn')}</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="hidden lg:block lg:col-span-1">
                <div className="sticky top-6 rounded-2xl p-6 shadow-2xl text-white transition-all duration-500 animate-slideDown" style={{ backgroundColor: '#222b3c' }}>
                    <h3 className="font-bold text-lg mb-6" style={{ color: '#EAD8B1' }}>{tPickup('summaryTitle')}</h3>
                    {selectedRate ? (
                        <>
                            <div className="space-y-4 border-b border-gray-600 pb-6 mb-6">
                                <div className="flex justify-between text-sm">
                                    <span>Freight & Processing ({selectedRate.carrier})</span>
                                    <span>${servicePriceWithFee.toFixed(2)}</span>
                                </div>
                                
                                {insuranceCost > 0 && (
                                    <div className="flex justify-between text-sm text-blue-300">
                                        <span className="flex items-center gap-1"><ShieldCheck size={14}/> + Ins (3%)</span>
                                        <span>+${insuranceCost.toFixed(2)}</span>
                                    </div>
                                )}

                                {/* 🔥 SÓLO MOSTRAMOS EL HANDLING SI ES > 0 */}
                                {handlingFee > 0 ? (
                                    <div className="flex justify-between text-sm" style={{ color: '#EAD8B1' }}>
                                        <span>Fee: Handling</span>
                                        <span>+${handlingFee.toFixed(2)}</span>
                                    </div>
                                ) : (
                                    // OPCIONAL: Mostrar que es gratis si quieres feedback visual
                                    <div className="flex justify-between text-sm text-green-400">
                                        <span>Fee: Handling (GMC)</span>
                                        <span>FREE</span>
                                    </div>
                                )}

                                {discount > 0 && (
                                    <div className="flex justify-between text-sm text-green-400 font-bold bg-green-900/30 p-2 rounded">
                                        <span className="flex items-center gap-1"><Tag size={12}/> Discount</span>
                                        <span>-${discount.toFixed(2)}</span>
                                    </div>
                                )}

                                <div className="pt-2">
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            placeholder="Promo Code" 
                                            value={couponCode}
                                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                            disabled={discount > 0}
                                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-[#EAD8B1]"
                                        />
                                        {discount > 0 ? (
                                            <button onClick={() => { setDiscount(0); setCouponCode(''); setCouponMsg({type:'', text:''}) }} className="bg-red-500/20 text-red-400 p-2 rounded-lg hover:bg-red-500/40">
                                                <XCircle size={16}/>
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={handleApplyCoupon}
                                                disabled={validatingCoupon || !couponCode}
                                                className="bg-[#EAD8B1] text-[#222b3c] px-3 py-2 rounded-lg text-xs font-bold hover:brightness-110 disabled:opacity-50"
                                            >
                                                {validatingCoupon ? <Loader2 className="animate-spin" size={14}/> : 'Apply'}
                                            </button>
                                        )}
                                    </div>
                                    {couponMsg.text && (
                                        <p className={`text-[10px] mt-2 font-bold flex items-center gap-1 ${couponMsg.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>
                                            {couponMsg.type === 'error' ? <AlertCircle size={10}/> : <CheckCircle size={10}/>}
                                            {couponMsg.text}
                                        </p>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex justify-between items-center mb-8">
                                <span className="text-xl font-bold">{tPickup('sumTotal')}</span>
                                <span className="text-3xl font-bold" style={{ color: '#EAD8B1' }}>${totalAmount.toFixed(2)}</span>
                            </div>

                            <div className="mb-6">
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">{tPickup('paymentTitle')}</label>
                                {cards.length > 0 ? (
                                    <div className="space-y-3">
                                        <div className="relative bg-gray-700 rounded-lg border border-gray-600 hover:border-gray-500">
                                            <div className="absolute left-3 top-3.5"><CreditCard size={18} className="text-gray-300"/></div>
                                            <select value={selectedCardId} onChange={(e) => setSelectedCardId(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-transparent text-white text-sm font-bold outline-none cursor-pointer appearance-none">
                                                {cards.map((c: any) => <option key={c.id} value={c.id} className="text-black">•••• {c.last4} ({c.brand})</option>)}
                                            </select>
                                        </div>
                                        <button onClick={handleAddCardRedirect} className="text-xs text--[#EAD8B1] hover:underline flex items-center gap-1">
                                            <Plus size={12}/> Agregar nueva (Ir a Configuración)
                                        </button>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={handleAddCardRedirect}
                                        className="w-full py-3 rounded-lg border border-gray-600 bg-gray-700/50 text-white hover:bg-gray-700 transition flex items-center justify-center gap-2 text-sm font-bold group"
                                    >
                                        <div className="bg-gray-800 p-1 rounded group-hover:bg-gray-900 transition"><Plus size={16}/></div>
                                        Agregar Tarjeta en Billetera
                                    </button>
                                )}
                            </div>
                            <button onClick={handlePay} disabled={isPaying || !selectedCardId} className="w-full py-4 rounded-xl text-lg font-bold shadow-lg hover:brightness-110 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-[#222b3c]" style={{ backgroundColor: '#EAD8B1' }}>
                                {isPaying ? <Loader2 className="animate-spin"/> : <DollarSign size={20}/>} {tBills('payNowBtn')}
                            </button>
                        </>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            <Truck size={48} className="mx-auto mb-4 opacity-20"/>
                            <p className="text-sm px-4">Selecciona un courier a la izquierda para ver el total a pagar.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {selectedRate && (
            <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 z-50 border-t shadow-[0_-5px_15px_rgba(0,0,0,0.1)] animate-slideUp bg-white">
                <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                        <span onClick={() => setShowMobileDetails(!showMobileDetails)} className="text-sm text-gray-500 cursor-pointer flex items-center gap-1 font-bold uppercase">
                            {tPickup('sumTotal')} {showMobileDetails ? <ChevronDown size={14} className="text-gray-700"/> : <ChevronUp size={14} className="text-gray-700"/>}
                        </span>
                        <div className="text-2xl font-bold text-[#222b3c]">${totalAmount.toFixed(2)}</div>
                    </div>
                    <button onClick={handlePay} disabled={isPaying || (!selectedCardId && cards.length > 0)} className="py-3 px-6 rounded-xl text-lg font-bold shadow-md flex justify-center items-center gap-2 active:scale-95 transition-transform" style={{ backgroundColor: '#222b3c', color: 'white' }}>
                        {isPaying ? <Loader2 className="animate-spin"/> : <CreditCard size={20}/>} {tPickup('btnPay')}
                    </button>
                </div>
                {showMobileDetails && (
                    <div className="mt-4 pt-3 border-t border-gray-200 space-y-2 text-sm">
                        
                        <div className="flex justify-between text-gray-700">
                            <span>Freight & Processing</span>
                            <span>${servicePriceWithFee.toFixed(2)}</span>
                        </div>
                        
                        {insuranceCost > 0 && (
                            <div className="flex justify-between text-blue-600"><span>+ Insurance (3%)</span><span>+${insuranceCost.toFixed(2)}</span></div>
                        )}

                        {handlingFee > 0 && (
                            <div className="flex justify-between text-yellow-600">
                                <span>Fee: Handling</span>
                                <span>+${handlingFee.toFixed(2)}</span>
                            </div>
                        )}

                        {discount > 0 && (
                            <div className="flex justify-between text-green-600 font-bold">
                                <span>Discount</span>
                                <span>-${discount.toFixed(2)}</span>
                            </div>
                        )}

                        <div className="pt-2 pb-2">
                             <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    placeholder="Promo Code" 
                                    value={couponCode}
                                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                    disabled={discount > 0}
                                    className="flex-1 bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-xs"
                                />
                                <button onClick={handleApplyCoupon} className="bg-gray-800 text-white px-3 rounded-lg text-xs">Apply</button>
                             </div>
                             {couponMsg.text && <p className={`text-[10px] mt-1 ${couponMsg.type==='error'?'text-red-500':'text-green-500'}`}>{couponMsg.text}</p>}
                        </div>

                        <div className="pt-3 border-t border-gray-200">
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Tarjeta</label>
                            {cards.length > 0 ? (
                                <div className="space-y-2">
                                    <div className="relative bg-gray-50 rounded-lg border border-gray-200">
                                        <select value={selectedCardId} onChange={(e) => setSelectedCardId(e.target.value)} className="w-full p-2.5 bg-transparent text-gray-800 text-sm font-bold outline-none">
                                            {cards.map((c: any) => <option key={c.id} value={c.id}>•••• {c.last4} ({c.brand})</option>)}
                                        </select>
                                    </div>
                                    <button onClick={handleAddCardRedirect} className="text-xs text-blue-600 font-bold flex items-center gap-1">
                                        <ExternalLink size={12}/> Gestionar en Configuración
                                    </button>
                                </div>
                            ) : (
                                <button onClick={handleAddCardRedirect} className="w-full py-2 bg-gray-100 text-gray-700 font-bold rounded-lg border border-gray-300 flex items-center justify-center gap-2">
                                    <Plus size={14}/> Ir a Agregar Tarjeta
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
}