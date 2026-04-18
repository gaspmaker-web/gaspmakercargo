"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl"; 
import { useRouter, useParams } from "next/navigation"; 
import Link from "next/link"; 
import { CreditCard, ExternalLink, Package, Receipt, ShieldCheck, ShoppingBag, ListOrdered, Loader2, ChevronDown, ChevronUp } from "lucide-react";

export default function PersonalShopperPage() {
  const t = useTranslations("Shopper");
  const tBills = useTranslations("PendingBills"); // 🔥 Aprovechamos tus traducciones existentes
  
  const params = useParams();
  const locale = params?.locale || "en"; 

  // ESTADOS DEL CARRITO (Pestaña 1)
  const [productUrl, setProductUrl] = useState("");
  const [price, setPrice] = useState("");
  const [details, setDetails] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ESTADOS DEL HISTORIAL Y PAGOS (Pestaña 2)
  const [activeTab, setActiveTab] = useState<"new" | "quotes">("new");
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  
  // ESTADOS PARA EL PAGO
  const [savedCards, setSavedCards] = useState<any[]>([]);
  const [selectedCard, setSelectedCard] = useState<string>("");
  const [isPaying, setIsPaying] = useState<string | null>(null);

  // ESTADO: Controla qué tarjeta está abierta (Acordeón)
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Cargar órdenes previas y tarjetas
  const fetchOrdersAndCards = async () => {
    setIsLoadingOrders(true);
    try {
      const res = await fetch("/api/shopper");
      if (res.ok) {
        const data = await res.json();
        setMyOrders(data.orders);
        
        // Cargamos las tarjetas y seleccionamos la primera por defecto
        if (data.savedCards) {
          setSavedCards(data.savedCards);
          if (data.savedCards.length > 0) {
            setSelectedCard(data.savedCards[0].id);
          }
        }
        
        // Si hay una orden "QUOTED" (Lista para pagar), la abrimos por defecto para llamar la atención
        const firstQuoted = data.orders.find((o: any) => o.status === "QUOTED");
        if (firstQuoted) {
          setExpandedOrderId(firstQuoted.id);
        }
      }
    } catch (error) {
      console.error("Error cargando órdenes", error);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchOrdersAndCards();
  }, []);

  const handleAddToCart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productUrl || !price) return;
    const newItem = { id: Date.now(), url: productUrl, price: parseFloat(price), details, quantity };
    setCartItems([...cartItems, newItem]);
    setProductUrl(""); setPrice(""); setDetails(""); setQuantity(1);
  };

  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleSubmitOrder = async () => {
    if (cartItems.length === 0) return;
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/shopper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cartItems, itemsSubtotal: cartTotal }),
      });

      if (response.ok) {
        setCartItems([]); 
        fetchOrdersAndCards(); 
        setActiveTab("quotes"); 
      } else {
        alert("Hubo un error al enviar la orden. Intenta de nuevo.");
      }
    } catch (error) {
      alert("Error de conexión.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayment = async (orderId: string, totalAmount: number) => {
    if (!selectedCard) {
      alert("Por favor selecciona una tarjeta de crédito guardada.");
      return;
    }

    setIsPaying(orderId);
    try {
      const res = await fetch("/api/payments/charge", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountNet: totalAmount,
          paymentMethodId: selectedCard,
          description: `Pago de Personal Shopper Orden #${orderId.slice(-6).toUpperCase()}`,
          serviceType: "Personal Shopper",
          shopperOrderId: orderId
          // ❌ Sin enviar isTrinidad. El backend decide.
        })
      });

      if (res.ok) {
        fetchOrdersAndCards(); 
      } else {
        const errorData = await res.json();
        alert(errorData.message || "Error al procesar el pago.");
      }
    } catch (error) {
      alert("Error de conexión al procesar el pago.");
    } finally {
      setIsPaying(null);
    }
  };

  const toggleOrder = (orderId: string) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
    } else {
      setExpandedOrderId(orderId);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* HEADER DE LA SECCIÓN */}
        <div className="mb-6 border-b border-gray-200 pb-6 text-center sm:text-left">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center justify-center sm:justify-start gap-2">
            {t("title")} 🛍️
          </h1>
          <p className="mt-3 text-lg text-gray-600 font-medium">
            {t("subtitle")}
          </p>
        </div>

        {/* PESTAÑAS (TABS) */}
        <div className="flex gap-4 mb-8 border-b border-gray-200 pb-px overflow-x-auto">
          <button 
            onClick={() => setActiveTab("new")}
            className={`flex items-center gap-2 pb-3 px-2 font-bold text-sm sm:text-base border-b-4 transition-colors whitespace-nowrap ${activeTab === "new" ? "border-[#e6c200] text-gray-900" : "border-transparent text-gray-400 hover:text-gray-700"}`}
          >
            <ShoppingBag size={18} /> {t("tabNew") || "Nueva Compra"}
          </button>
          <button 
            onClick={() => setActiveTab("quotes")}
            className={`flex items-center gap-2 pb-3 px-2 font-bold text-sm sm:text-base border-b-4 transition-colors whitespace-nowrap ${activeTab === "quotes" ? "border-[#e6c200] text-gray-900" : "border-transparent text-gray-400 hover:text-gray-700"}`}
          >
            <ListOrdered size={18} /> {t("tabQuotes") || "Mis Cotizaciones"}
            {myOrders.filter(o => o.status === "QUOTED").length > 0 && (
              <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full animate-pulse">
                !
              </span>
            )}
          </button>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* PESTAÑA 1: NUEVA COMPRA */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "new" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100">
                <form onSubmit={handleAddToCart} className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">{t("urlLabel")}</label>
                    <input type="url" required value={productUrl} onChange={(e) => setProductUrl(e.target.value)} placeholder={t("urlPlaceholder")} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#e6c200] focus:border-transparent outline-none transition-all" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">{t("priceLabel")}</label>
                      <input type="number" step="0.01" required value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Ej. 49.99" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#e6c200] outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">{t("qtyLabel")}</label>
                      <input type="number" min="1" required value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#e6c200] outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">{t("detailsLabel")}</label>
                    <textarea value={details} onChange={(e) => setDetails(e.target.value)} placeholder={t("detailsPlaceholder")} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#e6c200] outline-none h-28 resize-none" />
                  </div>
                  <button type="submit" className="w-full bg-[#e6c200] text-black font-bold text-lg py-4 px-4 rounded-xl hover:bg-yellow-500 transition-colors shadow-md mt-2">
                    {t("addBtn")}
                  </button>
                </form>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 sticky top-24">
                <h2 className="text-xl font-black text-gray-900 mb-4">{t("cartTitle")}</h2>
                {cartItems.length === 0 ? (
                  <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <span className="text-4xl mb-2 block">🛒</span>
                    <p className="font-bold text-gray-600">{t("emptyCart")}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <ul className="divide-y divide-gray-100 max-h-64 overflow-y-auto pr-2">
                      {cartItems.map((item) => (
                        <li key={item.id} className="py-3 flex justify-between text-sm">
                          <div className="flex flex-col truncate pr-3">
                            <span className="font-bold text-gray-900 truncate">{item.quantity}x {t("item")}</span>
                            <span className="text-blue-600 text-xs truncate">{item.url}</span>
                          </div>
                          <div className="font-extrabold text-gray-900">${(item.price * item.quantity).toFixed(2)}</div>
                        </li>
                      ))}
                    </ul>
                    <div className="border-t border-gray-200 pt-4 flex justify-between text-gray-800 font-bold">
                      <span>{t("subtotal")}</span>
                      <span>${cartTotal.toFixed(2)}</span>
                    </div>
                    <button onClick={handleSubmitOrder} disabled={isSubmitting} className="w-full mt-4 bg-black text-white font-bold text-lg py-4 rounded-xl active:scale-95 shadow-lg">
                      {isSubmitting ? <Loader2 size={24} className="animate-spin mx-auto" /> : t("quoteBtn")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* PESTAÑA 2: MIS COTIZACIONES (Diseño Acordeón Profesional) */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "quotes" && (
          <div className="space-y-4 max-w-4xl mx-auto">
            {isLoadingOrders ? (
              <p className="text-center font-bold text-gray-500 py-10 animate-pulse flex items-center justify-center gap-2">
                <Loader2 size={18} className="animate-spin" />
                {t("loadingQuotes") || "Cargando cotizaciones..."}
              </p>
            ) : myOrders.length === 0 ? (
              <div className="bg-white p-10 text-center rounded-2xl border border-gray-200">
                <p className="text-gray-500 font-bold">{t("noOrders") || "Aún no tienes cotizaciones."}</p>
              </div>
            ) : (
              myOrders.map((order) => {
                const isExpanded = expandedOrderId === order.id;

                // ✅ NUEVA LÓGICA ENTERPRISE: Basada en la Tarjeta ✅
                const activeCardDetails = savedCards.find(c => c.id === selectedCard);
                const isTrinidadCard = activeCardDetails?.country?.toUpperCase() === 'TT';
                const tasaTTD = 7.30; 

                return (
                  <div key={order.id} className={`bg-white rounded-2xl shadow-sm border transition-all duration-300 overflow-hidden ${isExpanded ? 'border-gray-300 ring-2 ring-[#e6c200]/50 shadow-md' : 'border-gray-200 hover:border-gray-300'}`}>
                    
                    {/* ENCABEZADO RESUMIDO */}
                    <div 
                      onClick={() => toggleOrder(order.id)}
                      className={`p-4 sm:px-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 cursor-pointer select-none transition-colors ${isExpanded ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                           order.status === "QUOTED" ? "bg-yellow-100 text-yellow-700" : 
                           order.status === "PAID" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                        }`}>
                          <Receipt size={20} />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-sm sm:text-base">
                            {t("quote") || "Cotización"} #{order.id.slice(-6).toUpperCase()}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                            <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>{order.items.length} {order.items.length === 1 ? 'artículo' : 'artículos'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end pl-14 sm:pl-0">
                         <div className="text-left sm:text-right">
                            {order.totalAmount ? (
                              <p className="font-black text-gray-900">${order.totalAmount.toFixed(2)}</p>
                            ) : (
                              <p className="text-xs text-gray-400 italic">{t("calculating") || "Calculando..."}</p>
                            )}
                            <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider ${
                              order.status === "QUOTED" ? "text-yellow-600" : 
                              order.status === "PAID" ? "text-green-600" : "text-gray-400"
                            }`}>
                              {order.status === "QUOTED" ? (t("statusQuoted") || "Lista para Pagar") : 
                               order.status === "PAID" ? (t("statusPaid") || "Pagada") : (t("statusPending") || "En Revisión")}
                            </span>
                         </div>
                         <div className="text-gray-400">
                           {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                         </div>
                      </div>
                    </div>

                    {/* CUERPO EXPANDIDO */}
                    {isExpanded && (
                      <div className="p-4 sm:p-6 border-t border-gray-100 bg-white animate-in slide-in-from-top-2 duration-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          
                          {/* Lista de Artículos */}
                          <div>
                            <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
                              <Package size={16} /> {t("itemsRequested") || "Artículos Solicitados"}
                            </h4>
                            <div className="space-y-3">
                              {order.items.map((item: any) => (
                                <div key={item.id} className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-sm">
                                  <p className="font-bold text-gray-900">{item.quantity}x {t("item") || "Artículo"}</p>
                                  <a href={item.productUrl} target="_blank" className="text-blue-600 hover:underline text-xs flex items-center gap-1 mt-1 truncate">
                                    <ExternalLink size={12} className="shrink-0" /> {item.productUrl}
                                  </a>
                                  {item.details && <p className="text-xs text-gray-500 mt-2 bg-white p-2 rounded">📝 {item.details}</p>}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Resumen Financiero y Pago */}
                          <div>
                            <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
                              <ShieldCheck size={16} className="text-green-600" /> {t("financialSummary") || "Resumen Financiero"}
                            </h4>
                            
                            {order.status === "PENDING_QUOTE" ? (
                              <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                                <p className="text-sm font-bold text-yellow-800">{t("reviewingLinks") || "Estamos revisando tus links. Pronto verás el costo exacto aquí para poder pagar."}</p>
                              </div>
                            ) : (
                              <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                                <div className="space-y-2 text-sm text-gray-600 mb-4">
                                  <div className="flex justify-between"><span>{t("itemsCost") || "Costo de Artículos"}</span><span className="font-bold">${order.itemsSubtotal?.toFixed(2)}</span></div>
                                  <div className="flex justify-between"><span>{t("usTaxes") || "Taxes USA"}</span><span className="font-bold">${order.usTaxes?.toFixed(2)}</span></div>
                                  <div className="flex justify-between"><span>{t("domesticShipping") || "Envío USA"}</span><span className="font-bold">${order.domesticShipping?.toFixed(2)}</span></div>
                                  <div className="flex justify-between"><span>{t("gmcFee") || "GMC Fee"}</span><span className="font-bold">${order.gmcShopperFee?.toFixed(2)}</span></div>
                                  <div className="flex justify-between text-xs text-gray-400"><span>{t("cardFee") || "Procesamiento de Tarjeta"}</span><span>${order.stripeFee?.toFixed(2)}</span></div>
                                </div>
                                
                                <div className="pt-3 border-t-2 border-dashed border-gray-300 flex justify-between items-center mb-4">
                                  <span className="font-black text-gray-900">{t("totalToPay") || "Total a Pagar"}</span>
                                  <span className="text-2xl font-black text-gray-900">${order.totalAmount?.toFixed(2)}</span>
                                </div>

                               {/* ZONA DE PAGO */}
                                {order.status === "QUOTED" && (
                                  <div className="mt-4 space-y-3">
                                    {savedCards.length > 0 ? (
                                      <>
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                                          {t("payWith") || "Pagar con:"}
                                        </label>
                                        <select 
                                          value={selectedCard} 
                                          onChange={(e) => setSelectedCard(e.target.value)}
                                          className="w-full p-3 bg-white border border-gray-300 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-[#e6c200] cursor-pointer"
                                        >
                                          {savedCards.map(card => (
                                            <option key={card.id} value={card.id}>
                                              💳 {card.brand.toUpperCase()} terminada en •••• {card.last4}
                                            </option>
                                          ))}
                                        </select>

                                        {/* 🔥 ALERTA PAGO LOCAL TRINIDAD (NIVEL ENTERPRISE) 🔥 */}
                                        {isTrinidadCard && order.totalAmount > 0 && (
                                            <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-xl animate-in fade-in duration-300">
                                              <div className="flex items-center gap-2 mb-1">
                                                <span className="text-lg">🇹🇹</span>
                                                <p className="text-xs font-bold text-blue-600 uppercase tracking-wide">
                                                  {tBills('localPaymentEnabled') || "Pago Local Habilitado"}
                                                </p>
                                              </div>
                                              <p className="text-[10px] text-gray-500 mb-2">
                                                {tBills('localPaymentDesc') || "Cobro procesado en moneda local para evitar bloqueos del banco."} ({tBills('exchangeRateLabel') || "Tasa"}: 1 USD = {tasaTTD} TTD).
                                              </p>
                                              <div className="pt-2 border-t border-blue-500/20 flex justify-between text-sm font-black text-blue-600">
                                                <span>{tBills('amountToCharge') || "Monto a cargar"}:</span>
                                                <span>${(order.totalAmount * tasaTTD).toFixed(2)} TTD</span>
                                              </div>
                                            </div>
                                        )}

                                        <button 
                                          onClick={() => handlePayment(order.id, order.totalAmount)}
                                          disabled={isPaying === order.id}
                                          className="w-full bg-black text-white font-black py-3 rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 shadow-md disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                                        >
                                          {isPaying === order.id ? <Loader2 size={18} className="animate-spin" /> : <CreditCard size={18} />} 
                                          {isPaying === order.id ? (t("processing") || "Procesando...") : (t("payNow") || "Pagar con Tarjeta")}
                                        </button>
                                      </>
                                    ) : (
                                      <div className="text-center p-4 bg-red-50 text-red-600 rounded-lg border border-red-200 text-sm">
                                        <p className="font-bold">{t("noCards")}</p>
                                        <Link 
                                          href={`/${locale}/account-settings?tab=billing`} 
                                          className="underline mt-1 font-bold inline-block hover:text-red-800 transition-colors"
                                        >
                                          {t("addPaymentMethod")}
                                        </Link>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {order.status === "PAID" && (
                                  <div className="w-full mt-4 bg-green-100 text-green-800 font-black py-3 rounded-lg flex items-center justify-center gap-2 border border-green-200">
                                    <ShieldCheck size={20} /> {t("paymentCompleted") || "Pago Completado"}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

      </div>
    </div>
  );
}