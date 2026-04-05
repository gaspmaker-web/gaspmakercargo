"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calculator, CheckCircle, Loader2 } from "lucide-react";

export default function QuoteOrderPage({ params }: { params: { id: string, locale: string } }) {
  const router = useRouter();
  const orderId = params.id;

  const [isLoading, setIsLoading] = useState(false);
  
  // 🔥 CORRECCIÓN: Ahora usamos strings ("") en lugar de un 0 fijo para evitar el "0300"
  const [itemsSubtotal, setItemsSubtotal] = useState<string | number>("");
  const [usTaxes, setUsTaxes] = useState<string | number>("");
  const [domesticShipping, setDomesticShipping] = useState<string | number>("5.00"); // Tarifa plana
  const [gmcShopperFee, setGmcShopperFee] = useState<string | number>("");

  // Cargamos los datos de la orden 
  useEffect(() => {
    fetch(`/api/shopper/quote?id=${orderId}`)
      .then(res => res.json())
      .then(data => {
        if (data.order && data.order.itemsSubtotal) {
          handleSubtotalChange(data.order.itemsSubtotal.toString());
        }
      });
  }, [orderId]);

  // 🔥 MAGIA REPARADA: Maneja el texto sin forzar el cero
  const handleSubtotalChange = (val: string) => {
    setItemsSubtotal(val);
    
    const num = parseFloat(val) || 0; // Si está vacío, internamente es 0
    if (num > 0) {
      setUsTaxes((num * 0.07).toFixed(2)); // 7% Florida Tax
      setGmcShopperFee((num * 0.10).toFixed(2)); // 10% Ganancia
    } else {
      setUsTaxes("");
      setGmcShopperFee("");
    }
  };

  // Transformamos todo a números reales SOLAMENTE PARA LA MATEMÁTICA
  const numSubtotal = parseFloat(itemsSubtotal.toString()) || 0;
  const numTaxes = parseFloat(usTaxes.toString()) || 0;
  const numShipping = parseFloat(domesticShipping.toString()) || 0;
  const numFee = parseFloat(gmcShopperFee.toString()) || 0;

  // LA FÓRMULA MATEMÁTICA EXACTA
  const subtotalBeforeStripe = numSubtotal + numTaxes + numShipping + numFee;
  
  // Fórmula inversa de Stripe (Para que el cliente absorba el 4.4% + $0.30)
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
          itemsSubtotal: numSubtotal, // 🔥 Le mandamos el nuevo subtotal a la base de datos
          usTaxes: numTaxes,
          domesticShipping: numShipping,
          gmcShopperFee: numFee,
          stripeFee,
          totalAmount: finalTotal
        })
      });

      if (res.ok) {
        alert("¡Cotización enviada al cliente con éxito!");
        router.push(`/${params.locale}/dashboard-admin/compras`);
      } else {
        alert("Error al guardar la cotización. Revisa la terminal (VS Code) para ver el error exacto.");
      }
    } catch (error) {
      alert("Error de conexión");
    } finally {
      setIsLoading(false);
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
              <Calculator className="text-[#e6c200]" /> Armar Cotización
            </h1>
          </div>
        </div>

        {/* FORMULARIO */}
        <div className="p-8 space-y-6">
          
          <div className="bg-blue-50 text-blue-900 p-5 rounded-2xl border border-blue-200 flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <label className="block font-black text-lg">🛒 Precio del Artículo (Subtotal) $</label>
              <p className="text-sm text-blue-700 font-medium">Modifícalo si el precio en la tienda cambió.</p>
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
              <label className="block text-sm font-bold text-gray-700 mb-2">🚚 Envío Interno USA (Fijo) $</label>
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
              <span>Subtotal de la Orden</span>
              <span>${subtotalBeforeStripe.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-red-500 text-sm font-bold items-center">
              <span className="flex items-center gap-1">💳 Processing Fee (Stripe 4.4% + 0.30)</span>
              <span>+ ${stripeFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-gray-900 text-2xl font-black mt-4 bg-gray-100 p-4 rounded-xl">
              <span>TOTAL A PAGAR:</span>
              <span>${finalTotal.toFixed(2)}</span>
            </div>
          </div>

          <button 
            onClick={handleSaveQuote}
            disabled={isLoading}
            className="w-full mt-6 bg-[#e6c200] text-black font-black text-lg py-5 rounded-xl hover:bg-yellow-500 transition-transform active:scale-95 shadow-lg flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : <CheckCircle />}
            {isLoading ? "Enviando al cliente..." : "Confirmar Cotización"}
          </button>
        </div>

      </div>
    </div>
  );
}