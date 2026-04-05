"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Camera,
  MapPin,
  AlertCircle,
  Truck,
  DollarSign,
  Loader2,
  CreditCard,
  CheckCircle,
  Upload,
  ChevronDown,
  ChevronUp,
  Plus,
  ExternalLink,
  Calendar,
  User,
  ShieldCheck,
  FileText,
  Clock,
  Tag,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import { getProcessingFee } from "@/lib/stripeCalc";
import { useTranslations } from "next-intl";
import CourierLogo from "@/components/CourierLogo";

const getCarrierLogo = (carrier: string): string => {
  const c = carrier.toLowerCase();
  if (c.includes("fedex")) return "/fedex-express-6.svg";
  if (c.includes("dhl")) return "/dhl-1.svg";
  if (c.includes("ups")) return "/ups-united-parcel-service.svg";
  return "/gaspmakercargoproject.png";
};

// 🔥 HELPERS DE DISEÑO
const cleanCarrierName = (name: string) => {
  if (!name) return "";
  const n = name.toLowerCase();
  if (n.includes("fedex")) return "FedEx";
  if (n.includes("ups")) return "UPS";
  if (n.includes("dhl")) return "DHL";
  if (n.includes("usps")) return "USPS";
  if (n.includes("gasp") || n.includes("gmc")) return "Gasp Maker Cargo";
  return name;
};

const cleanServiceName = (name: string) => {
  if (!name) return "";
  return name
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .trim()
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
    .replace("Fedex", "")
    .replace("Ups", "")
    .trim();
};

interface PackageDetailProps {
  pkg: any;
  userProfile: any;
  savedCards?: any[];
  allAddresses?: any[]; // 🔥 NUEVO: Recibimos la libreta de direcciones
}

export default function PackageDetailClient({
  pkg,
  userProfile,
  savedCards = [],
  allAddresses = [], // 🔥 Inicializado vacío por si acaso
}: PackageDetailProps) {
  const t = useTranslations("PackageDetail");
  const tPickup = useTranslations("Pickup");
  const tBills = useTranslations("PendingBills");

  const router = useRouter();
  const params = useParams();
  const locale = params?.locale || "en";

  const couriersRef = useRef<HTMLDivElement>(null);

  // 🔥 AQUÍ CONECTAMOS LA FACTURA QUE VIENE DE LA BASE DE DATOS
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(pkg.invoiceUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  
  const [rates, setRates] = useState<any[]>([]);
  const [loadingRates, setLoadingRates] = useState(false);
  const [selectedRate, setSelectedRate] = useState<any>(null);

  const [cards, setCards] = useState<any[]>(savedCards);
  const [selectedCardId, setSelectedCardId] = useState<string>("");
  
  // 🔥 NUEVOS ESTADOS PARA EL SELECTOR DE DIRECCIONES
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");

  const [isPaying, setIsPaying] = useState(false);
  const [showMobileDetails, setShowMobileDetails] = useState(false);

  // Cupones
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState({ type: "", text: "" });
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // 🔥 BILLETERA / REFERIDOS 🔥
  const walletBalance = userProfile?.walletBalance || 0;
  const [useWallet, setUseWallet] = useState(false);

  // Fees
  const isGMCSelected =
    selectedRate?.carrier?.toUpperCase().includes("GASP") ||
    selectedRate?.carrier?.toUpperCase().includes("GMC") ||
    selectedRate?.id?.includes("gmc");

  const serverFee = pkg.handlingFee !== undefined && pkg.handlingFee !== null ? pkg.handlingFee : 0;
  const handlingFee = isGMCSelected ? 0.0 : serverFee;

  const declaredValue = Number(pkg.declaredValue) || 0;
  const insuranceCost = declaredValue > 100 ? declaredValue * 0.03 : 0;

  // 🔥 SOLUCIÓN: Buscamos la foto en 'photoUrlMiami' (para cajas) o en 'receiptUrl' (para sobres del buzón)
  const warehousePhoto = (pkg.photoUrlMiami && pkg.photoUrlMiami.startsWith("http")) ? pkg.photoUrlMiami : 
                         (pkg.receiptUrl && pkg.receiptUrl.startsWith("http")) ? pkg.receiptUrl : null;

  const isReadyToShip = pkg.status === "RECIBIDO_MIAMI" || pkg.status === "EN_ALMACEN";
  
  // 🔥 IDENTIFICAR SI ES DOCUMENTO PARA OMITIR FACTURA Y VALOR
  const isDocument = pkg.courier === 'Buzón Virtual' || (pkg.carrierTrackingNumber || '').startsWith('DOC-') || (pkg.gmcTrackingNumber || '').startsWith('GMC-DOC-');
  
  // 🔥 MEJORADA: Validación robusta para saber si hay invoice (acepta PDF o imagen)
  const hasInvoice = !!invoiceUrl && (invoiceUrl.startsWith("http") || invoiceUrl.startsWith("https"));
  const invoiceSatisfied = hasInvoice || isDocument; // 🔥 Los documentos no requieren factura
  
  const isOverdue = Number(pkg.storageDebt) > 0;
  const isDelivered = pkg.status === "ENTREGADO";
  const isAdminVerifiedValue = declaredValue > 0 || isDocument; // 🔥 Los documentos no requieren valor declarado (son $0 y saltan la alerta de aduana)

  // 🔥 EFECTO PARA SELECCIONAR LA DIRECCIÓN DEFAULT INICIAL
  useEffect(() => {
    if (allAddresses.length > 0 && !selectedAddressId) {
      const def = allAddresses.find((a) => a.isDefault);
      setSelectedAddressId(def ? def.id : allAddresses[0].id);
    }
  }, [allAddresses, selectedAddressId]);

  useEffect(() => {
    if (cards.length > 0 && !selectedCardId) {
      const def = cards.find((c: any) => c.isDefault);
      if (def) setSelectedCardId(def.id);
      else setSelectedCardId(cards[0].id);
    }
  }, [cards, selectedCardId]);

  useEffect(() => {
    if (cards.length === 0) {
      const fetchCards = async () => {
        try {
          const res = await fetch("/api/user/cards");
          if (res.ok) {
            const data = await res.json();
            setCards(data.cards);
          }
        } catch (e) { console.error(e); }
      };
      fetchCards();
    }
  }, [cards.length]);

  // 🔥 AUTO-APLICAR BONO DE BIENVENIDA AL AMIGO INVITADO
  useEffect(() => {
    if (selectedRate) {
      const isEligibleForWelcomeBonus = userProfile?.referredBy && !userProfile?.referralRewardPaid;
      
      // Calculamos el costo base antes de aplicar descuentos para ver si supera la meta
      const tempBaseAmount = selectedRate.price + handlingFee + insuranceCost;

      if (isEligibleForWelcomeBonus && tempBaseAmount >= 100) {
        // ¡Premio Automático!
        setDiscount(25.0);
        setCouponMsg({ type: "success", text: `${t("welcomeBonus")} (-$25.00)` });
      } else {
        // Si no califica, quitamos el descuento
        setDiscount(0);
        setCouponMsg({ type: "", text: "" });
      }
    }
  }, [selectedRate, userProfile, handlingFee, insuranceCost]);

  // 🔥 HELPER: OBTIENE LOS DATOS COMPLETOS DE LA DIRECCIÓN SELECCIONADA
  const currentAddress = allAddresses.find((a) => a.id === selectedAddressId);
  const currentDestination = currentAddress ? {
    name: currentAddress.fullName,
    address: currentAddress.address,
    cityZip: currentAddress.cityZip,
    countryCode: currentAddress.country, 
    countryName: currentAddress.country, 
    phone: currentAddress.phone
  } : userProfile;

  const currentHasAddress = !!currentDestination.address;

  const handleAddCardRedirect = () => {
    router.push(`/${locale}/account-settings?tab=billing`);
  };

  const handleQuote = async () => {
    if (!invoiceSatisfied) { alert("⚠️ " + t("invoiceRequired")); return; }
    if (!currentHasAddress) { alert("⚠️ " + tBills("errorAddress")); return; }
    if (!isAdminVerifiedValue) { alert("⚠️ Esperando validación del valor por el Admin."); return; }

    setLoadingRates(true);
    setRates([]);
    setDiscount(0);
    setCouponMsg({ type: "", text: "" });
    setUseWallet(false); // Resetear billetera por seguridad

    try {
      const res = await fetch("/api/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weight: pkg.weightLbs || 1,
          dimensions: {
            length: pkg.lengthIn,
            width: pkg.widthIn,
            height: pkg.heightIn,
          },
          // 🔥 MANDAMOS AL MOTOR LA DIRECCIÓN EXACTA SELECCIONADA EN EL MENÚ
          destination: currentDestination,
        }),
      });
      const data = await res.json();

      let availableRates = [];
      if (res.ok && data.rates && data.rates.length > 0) {
        availableRates = data.rates.map((r: any) => ({
          ...r,
          logo: getCarrierLogo(r.carrier),
        }));
      } else {
        availableRates = [
          {
            id: "ups-std",
            carrier: "UPS",
            service: "Standard",
            price: (pkg.weightLbs * 3.8) + 15,
            days: "5-7",
            logo: "/ups-united-parcel-service.svg",
          },
        ];
      }

      setRates(availableRates);
      
      setTimeout(() => couriersRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 200);

    } catch (error) {
      alert("Error calculando tarifas.");
    } finally {
      setLoadingRates(false);
    }
  };

  // 🔥 MANEJO DE CUPÓN BLINDADO (Seguridad de Referidos)
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    if (!selectedRate) { setCouponMsg({ type: "error", text: "Select a shipping method first." }); return; }

    setValidatingCoupon(true);
    setCouponMsg({ type: "", text: "" });
    setDiscount(0);

    // 1. Validar que el envío supere los $100
    if (selectedRate.price < 100) {
      setTimeout(() => {
        setCouponMsg({ type: "error", text: "Give $25, Get $25: Valid only on shipments over $100 USD." });
        setValidatingCoupon(false);
      }, 600);
      return;
    }

    // 2. Seguridad: Extraer código ingresado y código real en BD
    const cleanInput = couponCode.trim().toUpperCase();
    const actualReferrer = userProfile?.referredBy ? userProfile.referredBy.trim().toUpperCase() : null;
    const isBonusUsed = userProfile?.referralRewardPaid === true;

    setTimeout(() => {
      // 3. Validar si el código es correcto y no ha sido usado
      if (cleanInput === actualReferrer && !isBonusUsed) {
        setDiscount(25.0);
        setCouponMsg({ type: "success", text: "Welcome Bonus applied! 🎁 (-$25.00)" });
      } else if (cleanInput === actualReferrer && isBonusUsed) {
        setCouponMsg({ type: "error", text: "This welcome bonus has already been used." });
      } else {
        setCouponMsg({ type: "error", text: "Invalid promo code." });
      }
      
      setValidatingCoupon(false);
    }, 800);
  };

  const handlePay = async () => {
    if (!selectedCardId) {
        setShowMobileDetails(true); 
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
        return; 
    }

    if (!selectedRate) { alert("Selecciona un método de envío."); return; }

    setIsPaying(true);

   const servicePrice = selectedRate.price;
    const baseAmount = servicePrice + handlingFee + insuranceCost;
    const fee = getProcessingFee ? getProcessingFee(baseAmount) : baseAmount * 0.0727;
    // Utilizamos el cálculo ya procesado con billetera
    const total = finalTotalAmount;

    // 👇 1. CREAMOS LA DIRECCIÓN (Esto faltaba en tu código)
    const formattedAddress = `${currentDestination.name} | ${currentDestination.address}, ${currentDestination.cityZip}, ${currentDestination.countryCode || currentDestination.countryName} | Tel: ${currentDestination.phone || 'N/A'}`;
    
    try {
      const payRes = await fetch("/api/payments/charge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountNet: total, // Este es el monto final que Stripe cobrará (ej. $85)
          paymentMethodId: selectedCardId,
          serviceType: "SINGLE_SHIPMENT",
          description: `Envío ${pkg.gmcTrackingNumber} via ${selectedRate.carrier}`,
          packageIds: [pkg.id],
          discountApplied: discount, // 🔥 VITAL: Le decimos al backend de cuánto fue el descuento
          shippingAddress: formattedAddress,
          walletDiscount: useWallet ? appliedWalletAmount : 0 
        }),
      });;

      const payData = await payRes.json();
      if (!payRes.ok) throw new Error(payData.message || "Error al procesar el cobro.");

      const shipRes = await fetch("/api/shipments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageIds: [pkg.id],
          selectedCourier: selectedRate.carrier,
          courierService: selectedRate.service,
          totalWeight: pkg.weightLbs,
          subtotal: servicePrice,
          processingFee: fee,
          insuranceCost: insuranceCost,
          handlingFee: handlingFee,
          discount: discount,
          totalPaid: total,
          stripePaymentId: payData.paymentId,
          // 🔥 GUARDAMOS LA DIRECCIÓN COMPLETA SELECCIONADA EN EL MENÚ
          shippingAddress: `${currentDestination.name} | ${currentDestination.address}, ${currentDestination.cityZip}, ${currentDestination.countryName || currentDestination.countryCode}`,
        }),
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
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default");
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/${file.type.includes("pdf") ? "raw" : "image"}/upload`,
        { method: "POST", body: fd },
      );
      const data = await res.json();
      if (data.secure_url) {
        await fetch("/api/packages/update-invoice", {
          method: "POST",
          body: JSON.stringify({ packageId: pkg.id, invoiceUrl: data.secure_url }),
        });
        setInvoiceUrl(data.secure_url);
        router.refresh(); // 🔥 Refrescamos los datos en el servidor
      }
    } catch (e) { alert("Error subir"); } finally { setIsUploading(false); }
  };

  const servicePrice = selectedRate ? selectedRate.price : 0; 
  const baseAmount = servicePrice + handlingFee + insuranceCost;
  const processingFee = selectedRate ? (getProcessingFee ? getProcessingFee(baseAmount) : baseAmount * 0.0727) : 0;
  
  let finalTotalAmount = Math.max(0, servicePrice + processingFee + handlingFee + insuranceCost - discount);
  let appliedWalletAmount = 0;

  // 🔥 LÓGICA DE BILLETERA (Mínimo $0.50 Stripe)
  if (useWallet && walletBalance > 0) {
      appliedWalletAmount = Math.min(walletBalance, finalTotalAmount - 0.50);
      if (appliedWalletAmount < 0) appliedWalletAmount = 0;
      finalTotalAmount = finalTotalAmount - appliedWalletAmount;
  }

  if (isDelivered) {
    return (
      <div className="max-w-3xl mx-auto p-4 font-sans animate-in fade-in pb-20">
        <div className="bg-green-600 text-white p-6 rounded-t-2xl shadow-lg text-center mt-6">
          <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle size={32} />
          </div>
          <h1 className="text-2xl font-bold mb-1">¡PAQUETE ENTREGADO!</h1>
          <p className="font-mono opacity-90 text-sm tracking-wider">
            {pkg.gmcTrackingNumber}
          </p>
        </div>
        <div className="bg-white p-6 rounded-b-2xl shadow-md border border-gray-100 space-y-6">
          <div className="border border-green-100 bg-green-50/50 rounded-xl p-4">
            <h3 className="text-green-800 font-bold flex items-center gap-2 mb-4">
              <Camera size={20} /> Prueba de Entrega (Proof of Delivery)
            </h3>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden relative flex items-center justify-center group">
              {pkg.deliveryPhotoUrl ? (
                <div className="relative w-full h-[350px]">
                  <Image
                    src={pkg.deliveryPhotoUrl}
                    alt="Evidencia de Entrega"
                    fill
                    className="object-contain"
                  />
                </div>
              ) : (
                <div className="text-center text-gray-400 py-10">
                  <Camera size={48} className="mx-auto mb-2 opacity-20" />
                  <p>Foto no disponible</p>
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-gray-500 text-xs uppercase font-bold mb-1">
                Entregado el:
              </p>
              <p className="text-gray-800 font-bold flex items-center gap-2 text-base">
                <Calendar size={18} className="text-green-600" />
                {pkg.updatedAt
                  ? new Date(pkg.updatedAt).toLocaleDateString()
                  : "Fecha pendiente"}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-gray-500 text-xs uppercase font-bold mb-1">
                Recibido por / Firma:
              </p>
              <p className="text-gray-800 font-bold flex items-center gap-2 text-base">
                <User size={18} className="text-green-600" />
                {pkg.user?.name || "Cliente"}
              </p>
            </div>
          </div>
          <div className="pt-6 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              Este comprobante digital certifica la entrega final del paquete.
            </p>
            <p className="text-xs text-gray-300 mt-1 font-mono">{pkg.id}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-40 lg:pb-10 font-montserrat">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start pt-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <h2 className="flex items-center gap-2 font-bold text-gray-800 text-base mb-4 border-b border-gray-100 pb-2">
                  <Box className="text-gmc-dorado-principal" size={20} /> {t("detailsTitle")}
                </h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t("tracking")}</p>
                    <p className="text-lg font-bold text-gray-800 font-mono">{pkg.carrierTrackingNumber || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t("description")}</p>
                    <p className="text-gray-700 text-sm flex items-center gap-2">
                      <FileText size={14} className="text-gray-400" />
                      {pkg.description || "Sin descripción"}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-[10px] font-bold text-gray-400">{t("weight")}</p>
                      <span className="text-xl font-bold">{pkg.weightLbs}</span> <span className="text-xs">lb</span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-[10px] font-bold text-gray-400">{t("dimensions")}</p>
                      <span className="text-lg font-bold">{pkg.lengthIn}x{pkg.widthIn}x{pkg.heightIn}</span>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                      <p className="text-[10px] font-bold text-blue-400">Valor (USD)</p>
                      <span className="text-lg font-bold text-blue-700">${declaredValue.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col">
                <h2 className="flex items-center gap-2 font-bold text-gray-800 text-base mb-4 border-b border-gray-100 pb-2">
                  <Camera className="text-orange-500" size={20} /> {t("photoTitle")}
                </h2>
                <div className="flex-1 bg-gray-100 rounded-xl border-2 border-dashed flex items-center justify-center relative min-h-[180px] overflow-hidden">
                  {warehousePhoto ? (
                    <Image src={warehousePhoto} alt="Warehouse Evidence" fill className="object-contain p-2 hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="text-center text-gray-400">
                      <Box size={40} className="mx-auto mb-2 opacity-30" />
                      <p className="text-xs font-bold">{t("noPhoto")}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 🔥 TARJETA DE FACTURA CONECTADA Y EXCEPCIÓN DE DOCUMENTOS 🔥 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-full ${invoiceSatisfied ? "bg-blue-50 text-blue-600" : "bg-orange-50 text-orange-400"}`}>
                  {invoiceSatisfied ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-700">
                    {isDocument ? "Documento (Factura No Requerida)" : (hasInvoice ? t("fileUploaded") : t("noInvoice"))}
                  </p>
                  {hasInvoice && (
                    <a href={invoiceUrl!} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 underline font-medium hover:text-blue-700 flex items-center gap-1 mt-1">
                      <ExternalLink size={12}/> {t("viewFile")}
                    </a>
                  )}
                </div>
              </div>
              {/* Ocultamos el botón de subir si es un documento para no confundir al usuario */}
              {!isDocument && (
                  <label className="cursor-pointer bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-xs font-bold hover:bg-gray-50 flex items-center gap-2 transition-colors active:scale-95 shadow-sm">
                    {isUploading ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />} {hasInvoice ? t("replaceBtn") : t("uploadBtn")}
                    <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleInvoiceUpload} disabled={isUploading} />
                  </label>
              )}
            </div>

            <div className="bg-white border border-blue-200 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-blue-50 p-5 border-b border-blue-100 flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex items-start gap-3 w-full sm:w-auto flex-1">
                  <div className="bg-white p-2 rounded-full shadow-sm text-blue-600 shrink-0"><MapPin size={24} /></div>
                  <div className="w-full">
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wide mb-1">{t("quotingFor")}:</p>
                    
                    {/* 🔥 SELECTOR DE DIRECCIONES NIVEL AMAZON */}
                    {allAddresses.length > 0 ? (
                      <div className="mt-1 relative max-w-sm">
                          <select 
                              value={selectedAddressId} 
                              onChange={(e) => {
                                  setSelectedAddressId(e.target.value);
                                  setRates([]); // Limpiar tarifas al cambiar destino
                                  setSelectedRate(null);
                              }}
                              className="w-full bg-white text-blue-900 text-sm font-bold p-2.5 pr-8 rounded-lg border border-blue-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none appearance-none cursor-pointer shadow-sm"
                          >
                              {allAddresses.map((addr) => (
                                  <option key={addr.id} value={addr.id}>
                                      {addr.fullName} • {addr.cityZip} ({addr.country}) {addr.isDefault ? '⭐' : ''}
                                  </option>
                              ))}
                          </select>
                          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 pointer-events-none" />
                          <div className="text-xs text-blue-600 mt-1 pl-1 line-clamp-1">
                              {currentDestination.address}
                          </div>
                      </div>
                    ) : currentHasAddress ? (
                      <div className="text-blue-900 leading-snug">
                        <p className="font-bold text-base">{currentDestination.name}</p>
                        <p className="text-sm">{currentDestination.address}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm">{currentDestination.cityZip}</span>
                          <span className="font-bold bg-blue-200 text-blue-800 text-[10px] px-2 py-0.5 rounded uppercase">
                            {currentDestination.countryName || currentDestination.countryCode}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <button 
                        onClick={() => router.push(`/${locale}/account-settings`)}
                        className="text-orange-600 text-sm font-bold text-left hover:text-orange-700 hover:underline flex items-start gap-1.5 transition-all cursor-pointer active:scale-95"
                      >
                        <span>⚠️</span>
                        <span>{tBills("errorAddress")}</span>
                      </button>
                    )}
                  </div>
                </div>

                {isReadyToShip && !rates.length && (
                    isOverdue ? (
                        <div className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-xs font-bold border border-red-200 flex items-center gap-2 mt-4 sm:mt-0">
                            <AlertCircle size={16} /> {tBills("alertBlocked")}
                        </div>
                    ) : !isAdminVerifiedValue ? (
                        <div className="bg-yellow-50 text-yellow-800 px-6 py-3 rounded-xl text-sm font-bold border border-yellow-200 flex items-center gap-3 w-full sm:w-auto animate-pulse mt-4 sm:mt-0">
                            <Clock size={18} className="text-yellow-600" />
                            <div className="flex flex-col">
                               <span>{t('awaitingVerification')}</span>
                               <span className="text-[10px] font-normal opacity-80">{t('warehouseMustConfirm')}</span>
                            </div>
                        </div>
                    ) : (
                        <button onClick={handleQuote} disabled={loadingRates || !currentHasAddress} className="w-full sm:w-auto bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition shadow-md flex items-center justify-center gap-2 mt-4 sm:mt-0">
                            {loadingRates ? <Loader2 className="animate-spin" size={16} /> : <Truck size={16} />} {t("viewRatesBtn")}
                        </button>
                    )
                )}
              </div>
              {rates.length > 0 && (
                <div ref={couriersRef} className="p-4 sm:p-5 animate-fadeIn">
                  <p className="text-xs font-bold text-gray-400 uppercase mb-3">{t("shippingOptions")}:</p>
                  <div className="space-y-3">
                    {rates.map((rate, index) => {
                      const isBestValue = index === 0;
                      const isSelected = selectedRate?.id === rate.id;

                      return (
                        <div key={rate.id} onClick={() => setSelectedRate(rate)} className={`relative group rounded-2xl p-4 transition-all cursor-pointer border-2 overflow-hidden ${isSelected ? "border-gmc-dorado-principal bg-yellow-50/50 shadow-md scale-[1.01]" : "border-gray-100 bg-white hover:border-gray-300 hover:shadow-sm"}`}>
                          {isBestValue && <div className="absolute top-0 right-0 bg-gmc-dorado-principal text-black text-[9px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest shadow-sm z-10">Best Value</div>}
                          <div className="grid grid-cols-[3.5rem_1fr_min-content] gap-4 items-center">
                            <div className="w-14 h-14 bg-white rounded-xl border border-gray-100 p-1 flex items-center justify-center shadow-sm shrink-0">
                              <CourierLogo courierName={rate.carrier} width={50} height={50} />
                            </div>
                            <div className="min-w-0 flex flex-col justify-center">
                              <h3 className="font-black text-gray-800 text-sm uppercase leading-tight truncate">{cleanCarrierName(rate.carrier)}</h3>
                              <p className="text-[11px] text-gray-500 font-medium leading-tight mt-0.5 line-clamp-2 break-words">{cleanServiceName(rate.service)}</p>
                              <p className="text-[10px] text-gray-400 font-bold mt-1 flex items-center gap-1"><Clock size={10} /> {rate.days}</p>
                            </div>
                            <div className="text-right pl-2">
                              <p className="text-xl font-black text-gray-900 tracking-tight leading-none">${rate.price.toFixed(2)}</p>
                              {isSelected && <span className="text-[9px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full inline-block mt-1">Selected</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-6 rounded-2xl p-6 shadow-2xl text-white transition-all duration-500 animate-slideDown" style={{ backgroundColor: "#222b3c" }}>
              <h3 className="font-bold text-lg mb-6" style={{ color: "#EAD8B1" }}>{tPickup("summaryTitle")}</h3>
              {selectedRate ? (
                <>
                  <div className="space-y-4 border-b border-gray-600 pb-6 mb-6">
                    <div className="flex justify-between text-sm">
                      <span>{t("freightCost")} ({cleanCarrierName(selectedRate.carrier)})</span>
                      <span>${servicePrice.toFixed(2)}</span>
                    </div>

                    {insuranceCost > 0 && (
                      <div className="flex justify-between text-sm text-blue-300">
                        <span className="flex items-center gap-1"><ShieldCheck size={14} /> + Ins (3%)</span>
                        <span>+${insuranceCost.toFixed(2)}</span>
                      </div>
                    )}

                    {handlingFee > 0 ? (
                      <div className="flex justify-between text-sm" style={{ color: "#EAD8B1" }}>
                        <span>{t("feeHandling")}</span>
                        <span>+${handlingFee.toFixed(2)}</span>
                      </div>
                    ) : (
                      <div className="flex justify-between text-sm text-green-400">
                        <span>{t("feeHandling")}</span>
                        <span>{t("free")}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-sm text-gray-400">
                        <span>{t("processingFee")}</span>
                        <span>+${processingFee.toFixed(2)}</span>
                    </div>

                    {discount > 0 && (
                      <div className="flex justify-between text-sm text-green-400 font-bold bg-green-900/30 p-2 rounded">
                        <span className="flex items-center gap-1"><Tag size={12} /> {t("discount")}</span>
                        <span>-${discount.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="pt-2 border-t border-gray-600 mt-2">
                      {discount > 0 ? (
                        <div className="bg-green-900/30 border border-green-500/30 p-3 rounded-lg flex items-center justify-between mt-3">
                           <p className="text-xs font-bold text-green-400 flex items-center gap-2">
                             <CheckCircle size={14} /> {couponMsg.text || "Promo Applied!"}
                           </p>
                        </div>
                      ) : (
                        <div className="mt-3">
                          <div className="flex gap-2">
                            <input type="text" placeholder="Promo Code (Optional)" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-[#EAD8B1]" />
                            <button onClick={handleApplyCoupon} disabled={validatingCoupon || !couponCode} className="bg-[#EAD8B1] text-[#222b3c] px-3 py-2 rounded-lg text-xs font-bold hover:brightness-110 disabled:opacity-50">{validatingCoupon ? <Loader2 className="animate-spin" size={14} /> : "Apply"}</button>
                          </div>
                          {couponMsg.text && couponMsg.type === "error" && <p className="text-[10px] mt-2 font-bold flex items-center gap-1 text-red-400"><AlertCircle size={10} />{couponMsg.text}</p>}
                        </div>
                      )}
                    </div>
                  </div>

               {/* 🔥 CAJITA DORADA BILLETERA (DESKTOP) 🔥 */}
                  {walletBalance > 0 && (
                      <div className="mt-4 p-3 bg-gradient-to-r from-yellow-500/10 to-yellow-600/20 border border-yellow-500/30 rounded-xl mb-6">
                          <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                  <div className="bg-yellow-500/20 p-1.5 rounded-lg text-yellow-400">
                                      <DollarSign size={16} />
                                  </div>
                                  <div>
                                      {/* 👇 Título traducido usando tBills */}
                                      <p className="text-xs font-bold text-yellow-400 uppercase tracking-wide">{tBills('walletTitle')}</p>
                                      {/* 👇 Subtítulo traducido usando tBills */}
                                      <p className="text-[10px] text-yellow-400/80">{tBills('walletBalance')}: ${walletBalance.toFixed(2)}</p>
                                  </div>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                  <input type="checkbox" className="sr-only peer" checked={useWallet} onChange={() => setUseWallet(!useWallet)} />
                                  <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-yellow-500"></div>
                              </label>
                          </div>
                          {useWallet && appliedWalletAmount > 0 && (
                              <div className="mt-2 pt-2 border-t border-yellow-500/20 flex justify-between text-xs font-bold text-yellow-400">
                                  {/* 👇 Tercera frase traducida usando tBills (con texto por defecto por si acaso) */}
                                  <span>{tBills('walletApplied') || "Saldo a aplicar"}:</span>
                                  <span>-${appliedWalletAmount.toFixed(2)}</span>
                              </div>
                          )}
                      </div>
                  )}

                  <div className="flex justify-between items-center mb-8">
                    <span className="text-xl font-bold">{tPickup("sumTotal")}</span>
                   <span className="text-3xl font-bold" style={{ color: "#EAD8B1" }}>${finalTotalAmount.toFixed(2)}</span>
                  </div>

                  <div className="mb-6">
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">{tPickup("paymentTitle")}</label>
                    {cards.length > 0 ? (
                      <div className="space-y-3">
                        <div className="relative bg-gray-700 rounded-lg border border-gray-600 hover:border-gray-500">
                          <div className="absolute left-3 top-3.5"><CreditCard size={18} className="text-gray-300" /></div>
                          <select value={selectedCardId} onChange={(e) => setSelectedCardId(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-transparent text-white text-sm font-bold outline-none cursor-pointer appearance-none">
                            {cards.map((c: any) => (<option key={c.id} value={c.id} className="text-black">•••• {c.last4} ({c.brand})</option>))}
                          </select>
                        </div>
                        <button onClick={handleAddCardRedirect} className="text-xs text-[#EAD8B1] hover:underline flex items-center gap-1"><Plus size={12} /> Agregar nueva (Ir a Configuración)</button>
                      </div>
                    ) : (
                      <button onClick={handleAddCardRedirect} className="w-full py-3 rounded-lg border border-gray-600 bg-gray-700/50 text-white hover:bg-gray-700 transition flex items-center justify-center gap-2 text-sm font-bold group">
                        <div className="bg-gray-800 p-1 rounded group-hover:bg-gray-900 transition"><Plus size={16} /></div>
                        Agregar Tarjeta en Billetera
                      </button>
                    )}
                  </div>
                  <button onClick={handlePay} disabled={isPaying || !selectedCardId} className="w-full py-4 rounded-xl text-lg font-bold shadow-lg hover:brightness-110 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-[#222b3c]" style={{ backgroundColor: "#EAD8B1" }}>
                    {isPaying ? <Loader2 className="animate-spin" /> : <DollarSign size={20} />} {tBills("payNowBtn")}
                  </button>
                </>
              ) : (
                <div className="text-center py-12 text-gray-500"><Truck size={48} className="mx-auto mb-4 opacity-20" /><p className="text-sm px-4">Selecciona un courier a la izquierda para ver el total a pagar.</p></div>
              )}
            </div>
          </div>
        </div>

        {selectedRate && (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
            <div className="absolute bottom-full left-0 right-0 h-10 bg-gradient-to-t from-gray-200/50 to-transparent pointer-events-none" />
            <div className="bg-[#222b3c] rounded-t-3xl shadow-[0_-5px_25px_rgba(0,0,0,0.2)] p-5 animate-slideUp text-white">
              <div className="flex justify-between items-center gap-4">
                <div onClick={() => setShowMobileDetails(!showMobileDetails)} className="flex flex-col cursor-pointer">
                  <span className="text-[10px] text-[#EAD8B1] font-bold uppercase tracking-widest flex items-center gap-2 mb-1">
                    {tPickup("sumTotal")} {showMobileDetails ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                  </span>
                  <div className="text-3xl font-garamond font-bold leading-none text-white">${finalTotalAmount.toFixed(2)}</div>
                </div>
                <button onClick={handlePay} disabled={isPaying} className="bg-[#EAD8B1] text-[#222b3c] py-3.5 px-8 rounded-xl text-base font-bold shadow-lg active:scale-95 transition-transform flex items-center gap-2">
                  {isPaying ? <Loader2 className="animate-spin" /> : <CreditCard size={18} />} {tPickup("btnPay")}
                </button>
              </div>

              {showMobileDetails && (
                <div className="mt-5 pt-5 border-t border-gray-600 space-y-3 text-sm animate-fadeIn max-h-[60vh] overflow-y-auto">
                  <div className="flex justify-between text-gray-300">
                    <span>{t("freightCost")}</span>
                    <span>${servicePrice.toFixed(2)}</span>
                  </div>

                  {insuranceCost > 0 && (
                    <div className="flex justify-between text-blue-300">
                      <span className="flex items-center gap-1"><ShieldCheck size={14} /> + Ins (3%)</span>
                      <span>+${insuranceCost.toFixed(2)}</span>
                    </div>
                  )}

                  {handlingFee > 0 ? (
                    <div className="flex justify-between text-[#EAD8B1]">
                      <span>{t("feeHandling")}</span>
                      <span>+${handlingFee.toFixed(2)}</span>
                    </div>
                  ) : (
                    <div className="flex justify-between text-green-400">
                      <span>{t("feeHandling")}</span>
                      <span>{t("free")}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-gray-400">
                      <span>{t("processingFee")}</span>
                      <span>+${processingFee.toFixed(2)}</span>
                  </div>

                  {discount > 0 && (
                    <div className="flex justify-between text-green-400 font-bold">
                      <span>{t("discount")}</span>
                      <span>-${discount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="pt-3 border-t border-gray-600">
                    {discount > 0 ? (
                      <div className="bg-green-900/30 border border-green-500/30 p-3 rounded-lg flex items-center justify-between">
                         <p className="text-sm font-bold text-green-400 flex items-center gap-2">
                           <CheckCircle size={16} /> {couponMsg.text || "Promo Applied!"}
                         </p>
                      </div>
                    ) : (
                      <>
                        <div className="flex gap-2">
                          <input type="text" placeholder="Promo Code (Optional)" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-base text-white focus:outline-none focus:border-[#EAD8B1]" />
                          <button onClick={handleApplyCoupon} disabled={validatingCoupon || !couponCode} className="bg-gray-600 text-white px-3 rounded-lg text-xs hover:bg-gray-500 font-bold disabled:opacity-50">{validatingCoupon ? <Loader2 className="animate-spin" size={14} /> : "Apply"}</button>
                        </div>
                        {couponMsg.text && couponMsg.type === "error" && <p className="text-[10px] mt-2 font-bold flex items-center gap-1 text-red-400"><AlertCircle size={10} />{couponMsg.text}</p>}
                      </>
                    )}
                  </div>

                  {/* 🔥 CAJITA DORADA BILLETERA (MÓVIL) 🔥 */}
                  {walletBalance > 0 && (
                      <div className="mt-3 p-3 bg-gradient-to-r from-yellow-500/10 to-yellow-600/20 border border-yellow-500/30 rounded-xl mb-3">
                          <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                  <div className="bg-yellow-500/20 p-1.5 rounded-lg text-yellow-400">
                                      <DollarSign size={14} />
                                  </div>
                                  <div>
                                      {/* 👇 Título traducido usando tBills */}
                                      <p className="text-xs font-bold text-yellow-400 uppercase tracking-wide">{tBills('walletTitle')}</p>
                                      {/* 👇 Subtítulo traducido usando tBills */}
                                      <p className="text-[10px] text-yellow-400/80">{tBills('walletBalance')}: ${walletBalance.toFixed(2)}</p>
                                  </div>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                  <input type="checkbox" className="sr-only peer" checked={useWallet} onChange={() => setUseWallet(!useWallet)} />
                                  <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-yellow-500"></div>
                              </label>
                          </div>
                          {useWallet && appliedWalletAmount > 0 && (
                              <div className="mt-2 pt-2 border-t border-yellow-500/20 flex justify-between text-xs font-bold text-yellow-400">
                                  {/* 👇 Tercera frase traducida usando tBills (con texto por defecto por si acaso) */}
                                  <span>{tBills('walletApplied') || "Aplicado"}:</span>
                                  <span>-${appliedWalletAmount.toFixed(2)}</span>
                              </div>
                          )}
                      </div>
                  )}

                  <div className="pt-4 border-t border-gray-600 pb-4">
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Tarjeta Seleccionada</label>
                    {cards.length > 0 ? (
                      <div className="space-y-2">
                        <div className="relative bg-gray-700 rounded-lg border border-gray-600">
                          <select value={selectedCardId} onChange={(e) => setSelectedCardId(e.target.value)} className="w-full p-2.5 bg-transparent text-white text-sm font-bold outline-none">
                            {cards.map((c: any) => (<option key={c.id} value={c.id} className="text-black">•••• {c.last4} ({c.brand})</option>))}
                          </select>
                        </div>
                        <button onClick={handleAddCardRedirect} className="text-xs text-[#EAD8B1] font-bold flex items-center gap-1 hover:underline"><ExternalLink size={12} /> Gestionar en Configuración</button>
                      </div>
                    ) : (
                      <button onClick={handleAddCardRedirect} className="w-full py-2 bg-gray-700 text-white font-bold rounded-lg border border-gray-600 flex items-center justify-center gap-2"><Plus size={14} /> Ir a Agregar Tarjeta</button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}