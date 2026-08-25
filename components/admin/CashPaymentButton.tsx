'use client';

import { useState, useEffect } from 'react';
import { DollarSign, Loader2, X, User, Package, Calendar, Clock, Printer } from 'lucide-react';

interface PackageItem {
  id: string;
  gmcTrackingNumber: string;
  description: string;
  weightLbs: number;
}

interface ShipmentDetails {
  id: string;
  gmcShipmentNumber: string;
  totalAmount: number;
  courierService: string;
  user: {
    name: string;
    email: string;
    phone: string;
    suiteNo: string;
  };
  packages: PackageItem[];
}

export default function CashPaymentButton({ 
    shipmentId, 
    shipmentNumber,
    autoOpen = false,
    deliverOnly = false,
    onClose
}: { 
    shipmentId: string; 
    shipmentNumber: string;
    autoOpen?: boolean;
    deliverOnly?: boolean;
    onClose?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [details, setDetails] = useState<ShipmentDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [paid, setPaid] = useState(false);
  const [staffName, setStaffName] = useState('');

  useEffect(() => {
    if (autoOpen) {
      loadDetails();
    }
  }, [autoOpen]);

  async function loadDetails() {
    setLoadingDetails(true);
    try {
      const res = await fetch(`/api/admin/consolidations/pickup-details?id=${shipmentId}`);
      const data = await res.json();
      setDetails(data);
      setShowModal(true);
    } catch {
      alert('Error loading details.');
    } finally {
      setLoadingDetails(false);
    }
  }

  async function handleConfirmCash() {
    if (!details) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/consolidations/cash-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shipmentId }),
      });
      if (res.ok) {
        setPaid(true);
        // Abrir ventana de impresión
        const printWindow = window.open('', '_blank');
        if (printWindow && details) {
          const date = details.courierService?.replace('Cita: ', '') || '';
          printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>Receipt - ${details.gmcShipmentNumber}</title>
              <style>
                body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
                .logo { font-size: 24px; font-weight: bold; }
                .section { margin-bottom: 15px; }
                .label { font-size: 11px; color: #666; text-transform: uppercase; }
                .value { font-size: 14px; font-weight: bold; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th { background: #f3f4f6; padding: 8px; text-align: left; font-size: 11px; }
                td { padding: 6px 8px; border-bottom: 1px solid #eee; font-size: 12px; }
                .total { font-size: 20px; font-weight: bold; text-align: right; margin-top: 15px; border-top: 2px solid #000; padding-top: 10px; }
                .paid-stamp { text-align: center; color: green; font-size: 32px; font-weight: bold; border: 3px solid green; padding: 10px; margin: 20px 0; transform: rotate(-5deg); display: inline-block; }
                .footer { text-align: center; font-size: 11px; color: #666; margin-top: 20px; }
              </style>
            </head>
            <body>
              <div class="header">
                <div class="logo">⚡ GASP MAKER CARGO</div>
                <p style="margin:5px 0; font-size:12px;">1861 NW 22nd St, Miami, FL 33142</p>
                <p style="margin:0; font-size:12px;">info@gaspmakercargo.com</p>
              </div>

              <div style="text-align:center; margin-bottom:15px;">
                <div class="paid-stamp">✓ PAID - CASH</div>
              </div>

              <div class="section">
                <div class="label">Receipt #</div>
                <div class="value">${details.gmcShipmentNumber}</div>
              </div>

              <div class="section">
                <div class="label">Date</div>
                <div class="value">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
              </div>

              <div class="section">
                <div class="label">Pickup Appointment</div>
                <div class="value">${date}</div>
              </div>

              <div class="section" style="background:#f9fafb; padding:12px; border-radius:8px;">
                <div class="label">Client</div>
                <div class="value">${details.user.name}</div>
                <div style="font-size:12px; color:#666;">${details.user.email}</div>
                <div style="font-size:12px; color:#666;">Suite: ${details.user.suiteNo} | Tel: ${details.user.phone}</div>
              </div>

              <div class="section">
                <div class="label">Packages (${details.packages.length})</div>
                <table>
                  <tr>
                    <th>Tracking</th>
                    <th>Description</th>
                    <th>Weight</th>
                  </tr>
                  ${details.packages.map(pkg => `
                    <tr>
                      <td style="font-family:monospace; font-size:11px;">${pkg.gmcTrackingNumber}</td>
                      <td>${pkg.description || '-'}</td>
                      <td>${pkg.weightLbs} lbs</td>
                    </tr>
                  `).join('')}
                </table>
              </div>

              <div class="total">TOTAL PAID: $${details.totalAmount?.toFixed(2)}</div>
              <div style="text-align:right; font-size:12px; color:#666;">Payment Method: CASH</div>

              <div class="footer">
                <p>Thank you for your business!</p>
                <p>gaspmakercargo.com</p>
              </div>
            </body>
            </html>
          `);
          printWindow.document.close();
          printWindow.print();
        }
        setTimeout(() => window.location.reload(), 1500);
      } else {
        const data = await res.json();
        alert(data.error || 'Error registering payment.');
      }
    } catch {
      alert('Connection error.');
    } finally {
      setLoading(false);
    }
  }

  if (paid) return <span className="text-green-600 font-bold text-xs">✅ Paid (Cash)</span>;

  return (
    <>
      <button
        onClick={loadDetails}
        disabled={loadingDetails}
        className="mt-2 w-full px-4 py-2 rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-2 bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
      >
  {loadingDetails ? <Loader2 size={14} className="animate-spin" /> : deliverOnly ? <Package size={14} /> : <DollarSign size={14} />}
  {deliverOnly ? 'Deliver to Client' : 'Mark as Paid (Cash)'}
</button>

      {showModal && details && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            
            {/* Header */}
           <div className={`p-4 flex justify-between items-center ${deliverOnly ? 'bg-emerald-600' : 'bg-green-600'}`}>
            <h3 className="font-bold text-white flex items-center gap-2">
    {deliverOnly ? <Package size={20} /> : <DollarSign size={20} />}
    {deliverOnly ? 'Deliver to Client' : 'Cash Payment'} — {details.gmcShipmentNumber}
</h3>
              <button onClick={() => setShowModal(false)} className="text-white hover:text-green-200">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">

              {/* Client Info */}
              <div className="bg-gray-50 rounded-xl p-4 flex items-start gap-3">
                <User size={18} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="font-bold text-gray-800">{details.user.name}</p>
                  <p className="text-xs text-gray-500">{details.user.email}</p>
                  <p className="text-xs text-gray-500">Suite: {details.user.suiteNo} | Tel: {details.user.phone}</p>
                </div>
              </div>

              {/* Appointment */}
              <div className="flex gap-4">
                <div className="bg-blue-50 rounded-xl p-3 flex-1 flex items-center gap-2">
                  <Calendar size={16} className="text-blue-500" />
                  <div>
                    <p className="text-xs text-gray-400">Appointment</p>
                    <p className="font-bold text-sm">
    {details.courierService === 'Recogida en Tienda' 
        ? 'Store Pickup' 
        : details.courierService?.replace('Cita: ', '')}
</p>
                  </div>
                </div>
                <div className="bg-purple-50 rounded-xl p-3 flex-1 flex items-center gap-2">
                  <Package size={16} className="text-purple-500" />
                  <div>
                    <p className="text-xs text-gray-400">Packages</p>
                    <p className="font-bold text-sm">{details.packages.length} items</p>
                  </div>
                </div>
              </div>

              {/* Package List */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Package List</p>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {details.packages.map((pkg) => (
                    <div key={pkg.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg text-xs">
                      <span className="font-mono text-gray-500">{pkg.gmcTrackingNumber}</span>
                      <span className="text-gray-700 truncate mx-2">{pkg.description}</span>
                      <span className="font-bold text-gray-600 shrink-0">{pkg.weightLbs} lbs</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              {/* Total */}
<div className="bg-green-50 rounded-xl p-4 flex justify-between items-center border border-green-200">
    <span className="font-bold text-gray-700">{deliverOnly ? 'TOTAL PAID:' : 'TOTAL TO COLLECT:'}</span>
    <span className="text-2xl font-bold text-green-700">${details.totalAmount?.toFixed(2)}</span>
</div>

{/* Delivered By */}
<div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
        Delivered By (Staff):
    </label>
    <div className="relative">
        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
        <input
            type="text"
            placeholder="Your name..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
            value={staffName}
            onChange={(e) => setStaffName(e.target.value)}
        />
    </div>
</div>

            </div>

            {/* Footer */}
            <div className="p-4 bg-gray-50 border-t flex justify-between items-center gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 font-bold text-sm hover:bg-gray-100 rounded-lg">
                Cancel
              </button>
              <button
                onClick={handleConfirmCash}
                disabled={loading || !staffName.trim()}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
                {loading ? 'Processing...' : deliverOnly ? 'Confirm Delivery & Print' : 'Confirm & Print Receipt'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}