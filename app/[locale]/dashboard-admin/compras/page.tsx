import prisma from "@/lib/prisma";
import Link from "next/link";
import { Receipt, ExternalLink, Package, ChevronDown, CheckCircle, Edit } from "lucide-react";

// Forzamos a que la página siempre cargue datos frescos de la base de datos
export const dynamic = 'force-dynamic';

export default async function AdminShopperOrdersPage({ params }: { params: { locale: string } }) {
  // Obtenemos todas las órdenes junto con los datos del usuario y los artículos
  const orders = await prisma.shopperOrder.findMany({
    include: { 
      user: true, 
      items: true 
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-10">
      <div className="max-w-6xl mx-auto">
        
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <Receipt className="text-[#e6c200]" size={32} /> 
            Solicitudes de Compra (Shopper)
          </h1>
          <p className="text-gray-500 mt-2">Administra las cotizaciones y compras de tus clientes.</p>
        </div>

        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="bg-white p-10 text-center rounded-2xl border border-gray-200">
              <p className="text-gray-500 font-bold">No hay órdenes de Shopper todavía.</p>
            </div>
          ) : (
            orders.map((order) => (
              /* 🔥 EL TRUCO DEL ACORDEÓN: Usamos <details> y la clase 'group' de Tailwind */
              <details 
                key={order.id} 
                className="group bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 open:ring-2 open:ring-[#e6c200]/50 open:shadow-md"
              >
                {/* 📌 CABECERA DEL ACORDEÓN (Siempre visible) */}
                <summary className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer list-none hover:bg-gray-50 transition-colors">
                  
                  {/* Datos del Cliente */}
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                      order.status === 'PAID' ? 'bg-green-100 text-green-700' : 
                      order.status === 'QUOTED' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      <Receipt size={24} />
                    </div>
                    <div>
                      <h3 className="font-black text-gray-900 text-lg">{order.user?.name || "Cliente Desconocido"}</h3>
                      <p className="text-sm text-gray-500">{order.user?.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600 border border-gray-200">
                          #{order.id.slice(-6).toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-400 font-medium">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Estado, Precio y Flechita */}
                  <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-left sm:text-right">
                      {order.totalAmount ? (
                        <p className="font-black text-xl text-gray-900">${order.totalAmount.toFixed(2)}</p>
                      ) : (
                        <p className="text-xs text-gray-400 italic">Sin cotizar</p>
                      )}
                      <span className={`text-[10px] sm:text-xs font-black uppercase tracking-wider ${
                        order.status === "PAID" ? "text-green-600" :
                        order.status === "QUOTED" ? "text-yellow-600" : "text-gray-400"
                      }`}>
                        {order.status === "PAID" ? "PAGO COMPLETADO" : 
                         order.status === "QUOTED" ? "ESPERANDO PAGO" : "PENDIENTE COTIZAR"}
                      </span>
                    </div>
                    {/* Flecha que gira sola al abrir el acordeón */}
                    <ChevronDown className="text-gray-400 group-open:rotate-180 transition-transform duration-300" />
                  </div>
                </summary>

                {/* 📌 CUERPO DEL ACORDEÓN (Se oculta y muestra al hacer clic) */}
                <div className="p-6 border-t border-gray-100 bg-gray-50/30">
                  
                  <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2 uppercase text-xs tracking-wider">
                    <Package size={16} /> Artículos Solicitados ({order.items.length})
                  </h4>
                  
                  <div className="space-y-3 mb-6">
                    {order.items.map(item => (
                      <div key={item.id} className="bg-white p-4 rounded-xl border border-gray-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{item.quantity}x Artículo</p>
                          <a href={item.productUrl} target="_blank" className="text-blue-600 hover:underline text-xs flex items-center gap-1 mt-1 truncate max-w-sm">
                            <ExternalLink size={12} /> {item.productUrl}
                          </a>
                          {item.details && <p className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded border border-gray-100">📝 {item.details}</p>}
                        </div>
                        <div className="sm:text-right bg-gray-50 sm:bg-transparent p-3 sm:p-0 rounded-lg">
                          <p className="text-[10px] text-gray-400 font-bold uppercase">Precio Declarado</p>
                          <p className="font-black text-gray-900">${item.declaredPrice?.toFixed(2) || "0.00"}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 🔥 LÓGICA DE BOTONES INTELIGENTE */}
                  <div className="flex justify-end pt-4 border-t border-gray-200">
                    
                    {/* CASO 1: Pendiente -> Botón negro de Crear Cotización */}
                    {order.status === "PENDING_QUOTE" && (
                      <Link 
                        href={`/${params.locale}/dashboard-admin/compras/${order.id}`} 
                        className="w-full sm:w-auto bg-black text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 shadow-lg"
                      >
                        Crear Cotización
                      </Link>
                    )}

                    {/* CASO 2: Cotizado pero sin pagar -> Botón amarillo para Editar por si te equivocaste */}
                    {order.status === "QUOTED" && (
                      <Link 
                        href={`/${params.locale}/dashboard-admin/compras/${order.id}`} 
                        className="w-full sm:w-auto bg-yellow-100 text-yellow-800 px-8 py-3 rounded-xl font-bold hover:bg-yellow-200 transition-colors flex items-center justify-center gap-2"
                      >
                        <Edit size={18} /> Modificar Cotización
                      </Link>
                    )}

                    {/* CASO 3: Pagado -> Desaparece el botón de cotizar. Solo una alerta verde. */}
                    {order.status === "PAID" && (
                      <div className="w-full sm:w-auto bg-green-100 text-green-800 px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 border border-green-200">
                        <CheckCircle size={20} /> Pago Recibido - Listo para ir a comprar en Amazon
                      </div>
                    )}

                  </div>
                </div>
              </details>
            ))
          )}
        </div>

      </div>
    </div>
  );
}