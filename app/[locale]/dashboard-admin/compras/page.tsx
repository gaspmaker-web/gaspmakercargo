import prisma from "@/lib/prisma";
import Link from "next/link";
import { Receipt, ExternalLink, Package, ChevronDown, CheckCircle, Edit, XCircle } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function AdminShopperOrdersPage({ params }: { params: { locale: string } }) {
  const orders = await prisma.shopperOrder.findMany({
    include: { user: true, items: true },
    orderBy: { createdAt: "desc" }
  });

  // Filter out cancelled orders from main list
  const activeOrders = orders.filter(o => o.status !== 'CANCELLED');
  const cancelledOrders = orders.filter(o => o.status === 'CANCELLED');

  const StatusBadge = ({ status }: { status: string }) => {
    const map: Record<string, { label: string; cls: string }> = {
      PENDING_QUOTE:  { label: 'PENDING QUOTE',      cls: 'text-gray-400' },
      QUOTED:         { label: 'AWAITING PAYMENT',   cls: 'text-yellow-600' },
      PAID:           { label: 'PAYMENT COMPLETED',  cls: 'text-green-600' },
      PURCHASED:      { label: 'PURCHASED',          cls: 'text-purple-600' },
      SHIPPED:        { label: 'SHIPPED',            cls: 'text-blue-600' },
      DELIVERED:      { label: 'DELIVERED',          cls: 'text-emerald-600' },
      CANCELLED:      { label: 'CANCELLED',          cls: 'text-red-500' },
    };
    const s = map[status] || { label: status, cls: 'text-gray-400' };
    return <span className={`text-[10px] sm:text-xs font-black uppercase tracking-wider ${s.cls}`}>{s.label}</span>;
  };

  const OrderCard = ({ order, locale }: { order: any; locale: string }) => (
    <details
      key={order.id}
      className="group bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 open:ring-2 open:ring-[#e6c200]/50 open:shadow-md"
    >
      <summary className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer list-none hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
            order.status === 'PAID' || order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
            order.status === 'QUOTED' ? 'bg-yellow-100 text-yellow-700' :
            order.status === 'CANCELLED' ? 'bg-red-100 text-red-500' : 'bg-gray-100 text-gray-600'
          }`}>
            {order.status === 'CANCELLED' ? <XCircle size={24} /> : <Receipt size={24} />}
          </div>
          <div>
            <h3 className="font-black text-gray-900 text-lg">{order.user?.name || "Unknown Client"}</h3>
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
        <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
          <div className="text-left sm:text-right">
            {order.totalAmount ? (
              <p className="font-black text-xl text-gray-900">${order.totalAmount.toFixed(2)}</p>
            ) : (
              <p className="text-xs text-gray-400 italic">No quote</p>
            )}
            <StatusBadge status={order.status} />
          </div>
          <ChevronDown className="text-gray-400 group-open:rotate-180 transition-transform duration-300" />
        </div>
      </summary>

      <div className="p-6 border-t border-gray-100 bg-gray-50/30">

        {/* Cancel reason */}
        {order.status === 'CANCELLED' && (order as any).cancelReason && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-xs font-black text-red-600 uppercase tracking-wider mb-1">Cancellation Reason</p>
            <p className="text-sm text-red-800">{(order as any).cancelReason}</p>
          </div>
        )}

        <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2 uppercase text-xs tracking-wider">
          <Package size={16} /> Requested Items ({order.items.length})
        </h4>

        <div className="space-y-3 mb-6">
          {order.items.map((item: any) => (
            <div key={item.id} className="bg-white p-4 rounded-xl border border-gray-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <p className="font-bold text-gray-900 text-sm">{item.quantity}x Item</p>
                <a href={item.productUrl} target="_blank" className="text-blue-600 hover:underline text-xs flex items-center gap-1 mt-1 truncate max-w-sm">
                  <ExternalLink size={12} /> {item.productUrl}
                </a>
                {item.details && <p className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded border border-gray-100">📝 {item.details}</p>}
              </div>
              <div className="sm:text-right bg-gray-50 sm:bg-transparent p-3 sm:p-0 rounded-lg">
                <p className="text-[10px] text-gray-400 font-bold uppercase">Declared Price</p>
                <p className="font-black text-gray-900">${item.declaredPrice?.toFixed(2) || "0.00"}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-200">
          {order.status === "PENDING_QUOTE" && (
            <Link href={`/${locale}/dashboard-admin/compras/${order.id}`}
              className="w-full sm:w-auto bg-black text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 shadow-lg">
              Create Quote
            </Link>
          )}
          {order.status === "QUOTED" && (
            <Link href={`/${locale}/dashboard-admin/compras/${order.id}`}
              className="w-full sm:w-auto bg-yellow-100 text-yellow-800 px-8 py-3 rounded-xl font-bold hover:bg-yellow-200 transition-colors flex items-center justify-center gap-2">
              <Edit size={18} /> Edit Quote
            </Link>
          )}
          {(order.status === "PAID" || order.status === "PURCHASED") && (
            <div className="w-full sm:w-auto bg-green-100 text-green-800 px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 border border-green-200">
              <CheckCircle size={20} /> Payment Received — Ready to purchase
            </div>
          )}
          {order.status === "CANCELLED" && (
            <div className="w-full sm:w-auto bg-red-50 text-red-600 px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 border border-red-200">
              <XCircle size={20} /> Cancelled
            </div>
          )}
        </div>
      </div>
    </details>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-10">
      <div className="max-w-6xl mx-auto">

        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <Receipt className="text-[#e6c200]" size={32} />
            Purchase Requests (Shopper)
          </h1>
          <p className="text-gray-500 mt-2">Manage your clients' quotes and purchases.</p>
        </div>

        {/* Active orders */}
        <div className="space-y-4">
          {activeOrders.length === 0 ? (
            <div className="bg-white p-10 text-center rounded-2xl border border-gray-200">
              <p className="text-gray-500 font-bold">No active Shopper orders.</p>
            </div>
          ) : (
            activeOrders.map(order => <OrderCard key={order.id} order={order} locale={params.locale} />)
          )}
        </div>

        {/* Cancelled orders — collapsed section */}
        {cancelledOrders.length > 0 && (
          <details className="mt-10 group">
            <summary className="cursor-pointer list-none flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors mb-4">
              <XCircle size={16} />
              Cancelled Orders ({cancelledOrders.length})
              <ChevronDown size={14} className="group-open:rotate-180 transition-transform" />
            </summary>
            <div className="space-y-4 opacity-60">
              {cancelledOrders.map(order => <OrderCard key={order.id} order={order} locale={params.locale} />)}
            </div>
          </details>
        )}

      </div>
    </div>
  );
}