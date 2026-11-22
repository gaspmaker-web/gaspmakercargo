"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calculator, CheckCircle, Loader2, XCircle } from "lucide-react";

export default function QuoteOrderPage({ params }: { params: { id: string, locale: string } }) {
  const router = useRouter();
  const orderId = params.id;

  const [isLoading, setIsLoading] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const [itemsSubtotal, setItemsSubtotal] = useState<string | number>("");
  const [usTaxes, setUsTaxes] = useState<string | number>("");
  const [domesticShipping, setDomesticShipping] = useState<string | number>("5.00");
  const [gmcShopperFee, setGmcShopperFee] = useState<string | number>("");

  useEffect(() => {
    fetch(`/api/shopper/quote?id=${orderId}`)
      .then(res => res.json())
      .then(data => {
        if (data.order && data.order.itemsSubtotal) {
          handleSubtotalChange(data.order.itemsSubtotal.toString());
        }
      });
  }, [orderId]);

  const handleSubtotalChange = (val: string) => {
    setItemsSubtotal(val);
    const num = parseFloat(val) || 0;
    if (num > 0) {
      setUsTaxes((num * 0.07).toFixed(2));
      setGmcShopperFee((num * 0.10).toFixed(2));
    } else {
      setUsTaxes("");
      setGmcShopperFee("");
    }
  };

  const numSubtotal = parseFloat(itemsSubtotal.toString()) || 0;
  const numTaxes = parseFloat(usTaxes.toString()) || 0;
  const numShipping = parseFloat(domesticShipping.toString()) || 0;
  const numFee = parseFloat(gmcShopperFee.toString()) || 0;

  const subtotalBeforeStripe = numSubtotal + numTaxes + numShipping + numFee;
  const stripeFee = parseFloat(((subtotalBeforeStripe + 0.30) / (1 - 0.044) - subtotalBeforeStripe).toFixed(2));
  const finalTotal = subtotalBeforeStripe + stripeFee;

  const handleSaveQuote = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/shopper/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          itemsSubtotal: numSubtotal,
          usTaxes: numTaxes,
          domesticShipping: numShipping,
          gmcShopperFee: numFee,
          stripeFee,
          totalAmount: finalTotal
        })
      });
      if (res.ok) {
        alert("Quote sent to client successfully!");
        router.push(`/${params.locale}/dashboard-admin/compras`);
      } else {
        alert("Error saving quote. Check terminal for exact error.");
      }
    } catch (error) {
      alert("Connection error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    setIsCancelling(true);
    try {
      const res = await fetch(`/api/shopper/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, reason: cancelReason })
      });
      if (res.ok) {
        alert("Order cancelled and client notified.");
        router.push(`/${params.locale}/dashboard-admin/compras`);
      } else {
        alert("Error cancelling order.");
      }
    } catch (error) {
      alert("Connection error");
    } finally {
      setIsCancelling(false);
      setShowCancelConfirm(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-10">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">

        {/* HEADER */}
        <div className="bg-black text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="hover:bg-gray-800 p-2 rounded-full transition-colors">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-black flex items-center gap-2">
              <Calculator className="text-[#e6c200]" /> Build Quote
            </h1>
          </div>
          {/* Cancel button in header */}
          <button
            onClick={() => setShowCancelConfirm(true)}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors"
          >
            <XCircle size={16} />
            Cancel Order
          </button>
        </div>

        {/* CANCEL CONFIRM MODAL */}
        {showCancelConfirm && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="text-red-600" size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-gray-900">Cancel this order?</h2>
                  <p className="text-sm text-gray-500">The client will be notified.</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Reason (optional — shown to client)
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Item out of stock, unable to find product..."
                  rows={3}
                  className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 py-3 border border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Go Back
                </button>
                <button
                  onClick={handleCancelOrder}
                  disabled={isCancelling}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black transition-colors flex items-center justify-center gap-2"
                >
                  {isCancelling ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                  {isCancelling ? "Cancelling..." : "Yes, Cancel"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FORMULARIO */}
        <div className="p-8 space-y-6">

          <div className="bg-blue-50 text-blue-900 p-5 rounded-2xl border border-blue-200 flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <label className="block font-black text-lg">🛒 Item Price (Subtotal) $</label>
              <p className="text-sm text-blue-700 font-medium">Modify if the store price has changed.</p>
            </div>
            <input
              type="number"
              step="0.01"
              value={itemsSubtotal}
              onChange={(e) => handleSubtotalChange(e.target.value)}
              className="w-full md:w-1/3 p-4 bg-white border-2 border-blue-300 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none font-mono text-2xl text-right font-black shadow-inner"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">🏛️ US Taxes (7% Florida) $</label>
              <input
                type="number"
                step="0.01"
                value={usTaxes}
                onChange={(e) => setUsTaxes(e.target.value)}
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#e6c200] outline-none font-mono text-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">🚚 Internal USA Shipping (Fixed) $</label>
              <input
                type="number"
                step="0.01"
                value={domesticShipping}
                onChange={(e) => setDomesticShipping(e.target.value)}
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#e6c200] outline-none font-mono text-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-black text-gray-900 mb-2">💼 GMC Shopper Fee (10% Ganancia) $</label>
            <input
              type="number"
              step="0.01"
              value={gmcShopperFee}
              onChange={(e) => setGmcShopperFee(e.target.value)}
              className="w-full p-4 bg-yellow-50 border border-yellow-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#e6c200] outline-none font-mono text-xl text-green-700 font-black"
            />
          </div>

          {/* RESUMEN FINAL */}
          <div className="mt-8 border-t border-gray-200 pt-6 space-y-3">
            <div className="flex justify-between text-gray-500 text-sm">
              <span>Order Subtotal</span>
              <span>${subtotalBeforeStripe.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-red-500 text-sm font-bold items-center">
              <span className="flex items-center gap-1">💳 Processing Fee (Stripe 4.4% + 0.30)</span>
              <span>+ ${stripeFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-gray-900 text-2xl font-black mt-4 bg-gray-100 p-4 rounded-xl">
              <span>TOTAL TO PAY:</span>
              <span>${finalTotal.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={handleSaveQuote}
            disabled={isLoading}
            className="w-full mt-6 bg-[#e6c200] text-black font-black text-lg py-5 rounded-xl hover:bg-yellow-500 transition-transform active:scale-95 shadow-lg flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : <CheckCircle />}
            {isLoading ? "Sending to client..." : "Confirm Quote"}
          </button>
        </div>

      </div>
    </div>
  );
}