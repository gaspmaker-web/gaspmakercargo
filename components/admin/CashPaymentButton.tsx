'use client';

import { useState, useEffect, useRef } from 'react';
import { DollarSign, Loader2, X, User, Package, Calendar, Printer, RotateCcw } from 'lucide-react';
import ConsolidationScanner from './ConsolidationScanner';

interface PackageItem {
  id: string;
  gmcTrackingNumber: string;
  carrierTrackingNumber?: string | null;
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

// Inline signature canvas — no external dependency needed
function SignatureCanvas({ onSave, onClear }: { onSave: (dataUrl: string) => void; onClear: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const hasStrokes = useRef(false);

  function getPos(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    const ctx = canvasRef.current!.getContext('2d')!;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    drawing.current = true;
    hasStrokes.current = true;
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext('2d')!;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1e3a5f';
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function endDraw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    drawing.current = false;
    if (hasStrokes.current) {
      onSave(canvasRef.current!.toDataURL('image/png'));
    }
  }

  function clear() {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasStrokes.current = false;
    onClear();
  }

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={600}
        height={160}
        className="w-full border-2 border-dashed border-gray-300 rounded-xl bg-white touch-none cursor-crosshair"
        style={{ height: 160 }}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={endDraw}
      />
      <button
        type="button"
        onClick={clear}
        className="absolute top-2 right-2 text-xs text-gray-400 hover:text-red-500 flex items-center gap-1"
      >
        <RotateCcw size={12} /> Clear
      </button>
    </div>
  );
}

export default function CashPaymentButton({
  shipmentId,
  shipmentNumber,
  autoOpen = false,
  deliverOnly = false,
  onClose,
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
  const [undoing, setUndoing] = useState(false);
  const [showUndoConfirm, setShowUndoConfirm] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (autoOpen) loadDetails();
  }, [autoOpen]);

  async function handleUndo() {
    setUndoing(true);
    try {
      const res = await fetch('/api/admin/consolidations/undo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shipmentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      alert(`✅ Envío cancelado. ${data.packagesReleased} paquete(s) liberados al almacén.`);
      setShowModal(false);
      onClose?.();
      window.location.reload();
    } catch (e: any) {
      alert('❌ Error: ' + e.message);
    } finally {
      setUndoing(false);
      setShowUndoConfirm(false);
    }
  }

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
        body: JSON.stringify({
          shipmentId,
          deliverySignature: signatureDataUrl ?? undefined,
        }),
      });
      if (res.ok) {
        setPaid(true);
        const printWindow = window.open('', '_blank');
        if (printWindow && details) {
          const date = details.courierService?.replace('Cita: ', '') || '';
          const sigHtml = signatureDataUrl
            ? `<div class="section">
                <div class="label">Recipient Signature</div>
                <div style="border:1px solid #e5e7eb; border-radius:8px; padding:12px; background:#fff; margin-top:6px;">
                  <img src="${signatureDataUrl}" style="max-width:100%; height:80px; object-fit:contain;" />
                </div>
                <div style="font-size:11px; color:#6b7280; margin-top:4px;">✍️ Signed upon pickup — ${new Date().toLocaleString('en-US')}</div>
               </div>`
            : '';

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
                  <tr><th>Tracking</th><th>Description</th><th>Weight</th></tr>
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
              <div style="text-align:right; font-size:12px; color:#666;">Delivered by: ${staffName}</div>
              ${sigHtml}
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

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">

              {/* Client Info */}
              <div className="bg-gray-50 rounded-xl p-4 flex items-start gap-3">
                <User size={18} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="font-bold text-gray-800">{details.user.name}</p>
                  <p className="text-xs text-gray-500">{details.user.email}</p>
                  <p className="text-xs text-gray-500">Suite: {details.user.suiteNo} | Tel: {details.user.phone}</p>
                </div>
              </div>

              {/* Appointment + Packages */}
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

              {/* Scanner */}
              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Verify Before Delivery</p>
                <ConsolidationScanner
                  consolidationId={details.id}
                  gmcShipmentNumber={details.gmcShipmentNumber}
                  packages={details.packages.map(pkg => ({
                    id: pkg.id,
                    gmcTrackingNumber: pkg.gmcTrackingNumber,
                    carrierTrackingNumber: pkg.carrierTrackingNumber ?? null,
                    description: pkg.description ?? null,
                    weightLbs: pkg.weightLbs ?? null,
                  }))}
                />
              </div>

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
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Your name..."
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                  />
                </div>
              </div>

              {/* ── RECIPIENT SIGNATURE ── */}
              <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-gray-400 uppercase">Recipient Signature</p>
                  {signatureDataUrl && (
                    <span className="text-xs text-green-600 font-semibold">✓ Signed</span>
                  )}
                </div>
                <SignatureCanvas
                  onSave={(dataUrl) => setSignatureDataUrl(dataUrl)}
                  onClear={() => setSignatureDataUrl(null)}
                />
                <p className="text-xs text-gray-400 mt-2 text-center">
                  Client signs above to confirm receipt of packages
                </p>
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 bg-gray-50 border-t flex flex-col gap-3">
              {showUndoConfirm ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex gap-2">
                  <button onClick={handleUndo} disabled={undoing} className="flex-1 bg-red-600 text-white py-2 rounded-lg font-bold text-sm hover:bg-red-700 disabled:opacity-50">
                    {undoing ? 'Deshaciendo...' : 'Sí, deshacer envío'}
                  </button>
                  <button onClick={() => setShowUndoConfirm(false)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-bold text-sm">No, volver</button>
                </div>
              ) : (
                <button onClick={() => setShowUndoConfirm(true)} className="w-full border border-red-200 text-red-600 py-2 rounded-xl font-bold text-sm hover:bg-red-50 transition">
                  ↩️ Deshacer Envío
                </button>
              )}
              <div className="flex justify-between items-center gap-3">
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
        </div>
      )}
    </>
  );
}