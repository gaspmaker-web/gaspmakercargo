'use client';

import React, { useState } from 'react';
import { 
  MoreHorizontal, Edit, Truck, X, Save, Loader2, Printer, 
  Package, User, Box, Ruler, MapPin, CheckCircle, Barcode, FileText 
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
// ⚠️ ASEGÚRATE DE QUE ESTE ARCHIVO EXISTA O EL BUILD FALLARÁ
import EditPackageAdminModal from './EditPackageAdminModal';

interface PackageActionsProps {
  pkg: any;
  locale: string;
  onDeliverStore?: () => void; 
}

export default function PackageActions({ pkg, locale, onDeliverStore }: PackageActionsProps) {
  const router = useRouter();
  
  // Estados de UI
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  
  // --- ESTADOS DE MODALES ---
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [showConsolidateModal, setShowConsolidateModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  
  // --- ESTADOS DE PROCESO ---
  const [finalWeight, setFinalWeight] = useState('');
  const [dims, setDims] = useState({ length: '', width: '', height: '' });
  const [trackingNumber, setTrackingNumber] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // --- ESTADOS DE ÉXITO ---
  const [dispatchSuccess, setDispatchSuccess] = useState(false);
  const [consolidateSuccess, setConsolidateSuccess] = useState(false);

  // ========================================================================
  // 🔥 LÓGICA DE VISIBILIDAD DE BOTONES
  // ========================================================================
  
  // Obtenemos el tracking sea paquete o consolidación
  const trackingString = pkg.gmcTrackingNumber || pkg.gmcShipmentNumber || '';

  const isPreAlert = pkg.status === 'PRE_ALERTA';
  const isReadyToShip = pkg.status === 'EN_PROCESO_ENVIO';
  const isConsolidationRequest = pkg.status === 'EN_PROCESO_CONSOLIDACION' || pkg.status === 'SOLICITUD_CONSOLIDACION';
  
  const isGaspMaker = pkg.selectedCourier?.toUpperCase().includes('GASP') || 
                      pkg.selectedCourier?.toUpperCase().includes('MAKER');

  // 🔥 REGLA INVENCIBLE: Si dice PICKUP, muestra el botón de mostrador
  const isStorePickup = pkg.status === 'PENDIENTE_RETIRO' || 
                        pkg.selectedCourier === 'CLIENTE_RETIRO' || 
                        pkg.isStorePickup === true ||
                        trackingString.toUpperCase().startsWith('PICKUP');

  // ========================================================================
  // 🖨️ FUNCIÓN PARA IMPRIMIR
  // ========================================================================
  const openPrintWindow = (type: '4x6' | 'mini') => {
      const format = type === 'mini' ? '30334' : '4x6';
      
      const currentTracking = (dispatchSuccess && trackingNumber) 
          ? trackingNumber 
          : (pkg.gmcTrackingNumber || pkg.gmcShipmentNumber || 'PENDING');

      const params = new URLSearchParams({
          tracking: currentTracking,
          clientName: pkg.user?.name || 'Cliente',
          suite: pkg.user?.suiteNo || 'N/A',
          weight: (pkg.weightLbs || 0).toString(),
          countryCode: pkg.user?.countryCode || 'US',
          date: new Date().toLocaleDateString(),
          description: pkg.description || 'Envío',
          format: format
      });

      const url = `/print/label?${params.toString()}`; 
      window.open(url, '_blank');
  };

  // ========================================================================
  // 📄 GENERAR COMMERCIAL INVOICE AUTOMÁTICO (CON ITEMS ADUANALES, PESO Y CONTACTO)
  // ========================================================================
  const handleGenerateInvoice = () => {
    const date = new Date().toLocaleDateString('en-US');
    
    // Total del paquete o caja
    const totalWeightNum = parseFloat(pkg.weightLbs || 0);
    const weightLbs = totalWeightNum.toFixed(2);
    
    const shippingCost = parseFloat(pkg.shippingTotalPaid || pkg.shippingSubtotal || 0).toFixed(2);
    
    let receiverName = pkg.user?.name || 'Cliente No Registrado';
    let receiverAddressBlock = 'Dirección no especificada';
    
    // Info de contacto del usuario
    const userPhone = pkg.user?.phone || 'No Provisto / Not Provided';
    const userEmail = pkg.user?.email || 'N/A';
    
    if (pkg.shippingAddress) {
        const parts = pkg.shippingAddress.split('|');
        if (parts.length > 1) {
            receiverName = parts[0].trim();
            receiverAddressBlock = parts[1].trim();
        } else {
            receiverAddressBlock = pkg.shippingAddress;
        }
    }

    const trackingForInvoice = pkg.finalTrackingNumber || pkg.carrierTrackingNumber || pkg.gmcTrackingNumber || pkg.gmcShipmentNumber || 'PENDIENTE';

    // 🔥 LA LICUADORA: Extraemos todos los items, sea paquete individual o consolidación 🔥
    let allItems: any[] = [];
    let calculatedDeclaredValue = 0;

    if (pkg.type === 'SHIPMENT' && pkg.packages && pkg.packages.length > 0) {
        // Es una consolidación: Recorremos cada paquete interno (Hijos)
        pkg.packages.forEach((childPkg: any) => {
            if (childPkg.customsItems && Array.isArray(childPkg.customsItems) && childPkg.customsItems.length > 0) {
                childPkg.customsItems.forEach((item: any) => {
                    allItems.push(item);
                    calculatedDeclaredValue += (parseFloat(item.value || 0) * (parseInt(item.qty) || 1));
                });
            } else {
                allItems.push({
                    qty: 1,
                    description: childPkg.description || 'Personal Effects',
                    value: childPkg.declaredValue || 0
                });
                calculatedDeclaredValue += parseFloat(childPkg.declaredValue || 0);
            }
        });
    } else if (pkg.customsItems && Array.isArray(pkg.customsItems) && pkg.customsItems.length > 0) {
        // Es un paquete individual con tabla de aduanas
        allItems = pkg.customsItems;
        allItems.forEach((item: any) => {
            calculatedDeclaredValue += (parseFloat(item.value || 0) * (parseInt(item.qty) || 1));
        });
    } else {
        // Es un paquete individual viejo (solo tiene texto y valor global)
        allItems = [{
            qty: 1,
            description: pkg.description || 'Personal Effects / Artículos Varios',
            value: pkg.declaredValue || 0
        }];
        calculatedDeclaredValue += parseFloat(pkg.declaredValue || 0);
    }

    // Cálculos Finales
    const declaredValueStr = calculatedDeclaredValue.toFixed(2);
    const totalInvoice = (calculatedDeclaredValue + parseFloat(shippingCost)).toFixed(2);

    // Sumamos la cantidad total de artículos para dividir el peso equitativamente
    let totalQty = allItems.reduce((acc: number, item: any) => acc + (parseInt(item.qty) || 1), 0);
    const weightPerUnit = totalQty > 0 ? (totalWeightNum / totalQty) : 0;

    // Generamos el HTML de las filas
    let itemsHtml = allItems.map((item: any) => {
        const qty = parseInt(item.qty) || 1;
        const desc = item.description || 'Item';
        const unitValue = parseFloat(item.value || 0).toFixed(2);
        const subtotal = (qty * parseFloat(unitValue)).toFixed(2);
        
        // Calculamos el peso correspondiente a esta fila (peso por unidad * cantidad)
        const lineWeight = (weightPerUnit * qty).toFixed(2);
        
        return `
          <tr>
            <td style="text-align: center;">${qty}</td>
            <td style="text-align: center;">US</td>
            <td>${desc}</td>
            <td style="text-align: center;">${lineWeight} lbs</td>
            <td style="text-align: right;">$${unitValue}</td>
            <td style="text-align: right;">$${subtotal}</td>
          </tr>
        `;
    }).join('');

    const invoiceWindow = window.open('', '_blank');
    if (!invoiceWindow) return alert("Por favor, permite las ventanas emergentes (pop-ups).");

    // 🔥 PLANTILLA HTML ACTUALIZADA CON DATOS DE CONTACTO Y CÁLCULOS DINÁMICOS 🔥
    invoiceWindow.document.write(`
      <html>
        <head>
          <title>Commercial Invoice - ${trackingForInvoice}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; line-height: 1.5; }
            h1 { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; text-transform: uppercase; letter-spacing: 2px; }
            .flex-container { display: flex; justify-content: space-between; margin-bottom: 30px; margin-top: 30px; }
            .box { width: 45%; border: 1px solid #ccc; padding: 15px; border-radius: 4px; background: #fafafa; }
            .box h3 { margin-top: 0; color: #555; border-bottom: 1px solid #ddd; padding-bottom: 5px; font-size: 14px; text-transform: uppercase; }
            .box p { margin: 4px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
            th { background-color: #f4f4f4; padding: 10px; border: 1px solid #ccc; text-align: left; }
            td { padding: 8px; border: 1px solid #ddd; }
            .summary { width: 50%; float: right; margin-top: 30px; }
            .summary table th { background: transparent; text-align: right; border: none; padding-right: 15px; }
            .summary table td { text-align: right; font-weight: bold; border: none; }
            .footer { clear: both; padding-top: 60px; font-size: 12px; color: #666; text-align: justify; }
            .signature-line { border-bottom: 1px solid #333; width: 300px; margin-top: 40px; display: inline-block; }
          </style>
        </head>
        <body>
          <h1>Commercial Invoice</h1>
          
          <table style="width: 100%; border: none; margin-top: 0;">
            <tr>
              <td style="border: none; padding: 0;"><strong>Invoice Date:</strong> ${date}</td>
              <td style="border: none; padding: 0; text-align: right;"><strong>Carrier:</strong> ${pkg.selectedCourier || 'N/A'}</td>
            </tr>
            <tr>
              <td style="border: none; padding: 0;"><strong>Type:</strong> ${pkg.isConsolidated ? 'Consolidado' : 'Paquete Individual'}</td>
              <td style="border: none; padding: 0; text-align: right;"><strong>Tracking Number:</strong> ${trackingForInvoice}</td>
            </tr>
          </table>

          <div class="flex-container">
            <div class="box">
              <h3>Sender / Exporter:</h3>
              <p><strong>${pkg.user?.name || 'Cliente'}</strong></p>
              <p>Suite: ${pkg.user?.suiteNo || 'N/A'}</p>
              <p>Phone: ${userPhone}</p>
              <p>Email: ${userEmail}</p>
              <p style="margin-top: 8px;">Miami, FL 33142<br/>United States</p>
            </div>
            <div class="box">
              <h3>Recipient / Importer:</h3>
              <p><strong>${receiverName}</strong></p>
              <p>${receiverAddressBlock.replace(/,/g, '<br/>')}</p>
              <p style="margin-top: 8px;"><strong>Phone:</strong> ${userPhone}</p>
              <p><strong>Email:</strong> ${userEmail}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: center;">Origin</th>
                <th>Description of Contents</th>
                <th style="text-align: center;">Weight</th>
                <th style="text-align: right;">Unit Value</th>
                <th style="text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="summary">
            <table>
              <tr><th>Total Gross Weight:</th><td>${weightLbs} lbs</td></tr>
              <tr><th>Total Declared Value (USD):</th><td>$${declaredValueStr}</td></tr>
              <tr><th>Freight & Processing:</th><td>$${shippingCost}</td></tr>
              <tr><th style="font-size: 16px; color: #000; padding-top: 10px;">Total Invoice Amount:</th><td style="font-size: 16px; color: #000; padding-top: 10px;">$${totalInvoice}</td></tr>
            </table>
          </div>

          <div class="footer">
            <p>I / We hereby certify that the information on this invoice is true and correct and that the contents of this shipment are as stated above. These commodities, technology, or software were exported from the United States in accordance with the Export Administration Regulations. Diversion contrary to U.S. law is prohibited.</p>
            <div style="margin-top: 50px;">
              <span class="signature-line"></span><br/>
              <strong>Signature / Name:</strong> ${pkg.user?.name || 'Authorized Agent'}
            </div>
          </div>
        </body>
      </html>
    `);
    
    invoiceWindow.document.close();
    invoiceWindow.focus();
    setTimeout(() => { invoiceWindow.print(); }, 500);
    setIsMenuOpen(false);
  };

  // --- LÓGICA DE CONSOLIDACIÓN (ADMIN) ---
  const handleConsolidate = async () => {
      if (!finalWeight || !dims.length || !dims.width || !dims.height) {
          return alert("Por favor ingresa el Peso y las 3 Medidas (Largo, Ancho, Alto).");
      }
      
      setIsSaving(true);
      try {
          const res = await fetch('/api/admin/consolidate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  userId: pkg.userId, 
                  finalWeight: finalWeight,
                  finalDimensions: {
                      length: dims.length,
                      width: dims.width,
                      height: dims.height
                  }
              })
          });
          
          const data = await res.json();
          if (res.ok) {
              setConsolidateSuccess(true); 
              router.refresh();
          } else {
              alert("Error: " + data.message);
          }
      } catch (e) {
          alert("Error de conexión");
      } finally {
          setIsSaving(false);
      }
  };

  // --- LÓGICA DE DESPACHO (GMC) ---
  React.useEffect(() => { 
      if (showDispatchModal && isGaspMaker && !trackingNumber) { 
          const randomNum = Math.floor(100000 + Math.random() * 900000); 
          setTrackingNumber(`GMC-DEL-${randomNum}`); 
      } 
  }, [showDispatchModal, isGaspMaker]);

  const handleDispatch = async () => { 
      if (!trackingNumber) return alert("Ingresa tracking"); 
      setIsSaving(true); 
      try { 
          const res = await fetch('/api/packages/dispatch', { 
              method: 'POST', 
              headers: { 'Content-Type': 'application/json' }, 
              body: JSON.stringify({ packageId: pkg.id, finalTrackingNumber: trackingNumber }) 
          }); 
          
          if (res.ok) { 
              setDispatchSuccess(true); 
              router.refresh(); 
          } else { 
              alert("Error."); 
          } 
      } catch (e) { 
          alert("Error conexión"); 
      } finally { 
          setIsSaving(false); 
      } 
  };

  // 🔥 AQUÍ ESTÁ LA CORRECCIÓN MÁGICA DE EASYPOST
  const handleBuyLabel = async () => { 
      if (!confirm(`¿Comprar Label?`)) return; 
      setIsSaving(true); 
      try { 
          const res = await fetch('/api/packages/buy-label', { 
              method: 'POST', headers: { 'Content-Type': 'application/json' }, 
              body: JSON.stringify({ packageId: pkg.id }) 
          }); 
          const data = await res.json(); 
          
          if (res.ok) { 
              alert(`✅ Label comprado exitosamente: ${data.tracking}`); 
              
              if (data.label) {
                  window.open(data.label, '_blank');
              }
              
              router.refresh(); 
          } 
          else { alert(`Error: ${data.error}`); } 
      } catch (e) { alert("Error al conectar con EasyPost"); } 
      finally { setIsSaving(false); } 
  };

  // --- COMPONENTE REUTILIZABLE: BOTONES DE IMPRESIÓN ---
  const PrintButtons = () => (
      <div className="flex gap-3 mt-4 animate-in fade-in zoom-in-95">
          <button 
              onClick={() => openPrintWindow('4x6')}
              className="flex-1 bg-slate-800 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-black transition-colors"
          >
              <Printer size={18}/> Etiqueta 4x6"
          </button>
          <button 
              onClick={() => openPrintWindow('mini')}
              className="flex-1 bg-white border-2 border-slate-200 text-slate-700 py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
          >
              <Barcode size={18}/> Barcode Mini
          </button>
      </div>
  );

  return (
    <div className="relative flex justify-end">
      <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
        <MoreHorizontal size={20} />
      </button>

      {isMenuOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)} />
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 z-20 overflow-hidden font-montserrat animate-in fade-in zoom-in-95 duration-100 text-sm">

            {/* 1. EDITAR */}
            <button onClick={() => { setIsEditOpen(true); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-gray-700">
              <Edit size={16} className="text-gray-400" /> Editar Detalles
            </button>
            
            {/* 2. IMPRIMIR (Menú Principal) */}
            <button onClick={() => { setShowPrintModal(true); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-gray-700">
              <Printer size={16} className="text-gray-400" /> Imprimir Etiqueta
            </button>

            {/* 🔥 3. NUEVO: GENERAR INVOICE ADUANAL 🔥 */}
            <button onClick={handleGenerateInvoice} className="w-full text-left px-4 py-3 hover:bg-orange-50 text-orange-700 flex items-center gap-3 font-medium transition-colors border-t border-gray-100">
              <FileText size={16} /> Descargar Invoice
            </button>

            <Link href={`/${locale}/dashboard-admin/clientes/${pkg.user?.id}`} className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-gray-700 border-t border-gray-100">
               <User size={16} className="text-gray-400" /> Ver Perfil Cliente
            </Link>

            {/* CONSOLIDAR */}
            {isConsolidationRequest && (
                 <button 
                    onClick={() => { setShowConsolidateModal(true); setIsMenuOpen(false); }}
                    className="w-full text-left px-4 py-3 bg-indigo-50 hover:bg-indigo-100 flex items-center gap-3 font-bold text-indigo-800 border-t border-indigo-100"
                >
                    <Box size={16} /> Procesar Consolidación
                </button>
            )}

            {/* PRE-ALERTA */}
            {isPreAlert && (
                 <Link href={`/${locale}/dashboard-admin/paquetes/${pkg.id}`} className="w-full text-left px-4 py-3 bg-yellow-50 hover:bg-yellow-100 flex items-center gap-3 font-bold text-yellow-800 border-t border-gray-100">
                    <Package size={16} /> Procesar Ingreso
                </Link>
            )}

            {/* DESPACHAR / API */}
            {isReadyToShip && !isStorePickup && (
                <>
                {!isGaspMaker && (
                    <button onClick={handleBuyLabel} disabled={isSaving} className="w-full text-left px-4 py-3 bg-purple-50 hover:bg-purple-100 flex items-center gap-3 font-bold text-purple-700 border-t border-gray-100">
                        <Printer size={16} /> Comprar Label (API)
                    </button>
                )}
                <button onClick={() => { setShowDispatchModal(true); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-blue-50 flex items-center gap-3 font-bold text-blue-700 border-t border-gray-100">
                    <Truck size={16} /> {isGaspMaker ? "Despachar (GMC)" : "Tracking Manual"}
                </button>
                </>
            )}

            {/* 🔥 EL BOTÓN PARA ENTREGAR EN TIENDA QUE ABRE EL MODAL DEL EMPLEADO 🔥 */}
            {isStorePickup && (
                <button 
                    onClick={() => { 
                        if (onDeliverStore) {
                            onDeliverStore(); 
                            setIsMenuOpen(false); 
                        } else {
                            alert("Error: Función de entrega no conectada.");
                        }
                    }} 
                    className="w-full text-left px-4 py-3 bg-emerald-50 hover:bg-emerald-100 flex items-center gap-3 text-emerald-700 font-bold border-t border-emerald-100 transition-colors"
                >
                    <MapPin size={16}/> Entregar en Tienda
                </button>
            )}

          </div>
        </>
      )}

      {/* --- MODAL SOLO IMPRIMIR (Desde el menú) --- */}
      {showPrintModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <Printer size={20}/> Imprimir Etiqueta
                    </h3>
                    <button onClick={() => setShowPrintModal(false)}><X size={20} className="text-gray-400"/></button>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg mb-4 text-center">
                    <p className="text-sm text-gray-500">Tracking:</p>
                    <p className="font-mono font-bold text-lg text-gray-800">{pkg.gmcTrackingNumber || pkg.gmcShipmentNumber}</p>
                </div>
                <PrintButtons />
            </div>
          </div>
      )}

      {/* --- MODAL CONSOLIDACIÓN --- */}
      {showConsolidateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-indigo-900">
                        {consolidateSuccess ? '¡Consolidación Exitosa!' : 'Datos de Consolidación'}
                    </h3>
                    <button onClick={() => setShowConsolidateModal(false)}><X size={20} className="text-gray-400 hover:text-red-500"/></button>
                </div>

                {consolidateSuccess ? (
                    <div className="text-center">
                        <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-3">
                            <CheckCircle size={32}/>
                        </div>
                        <p className="text-sm text-gray-600 mb-6">
                            El paquete ha sido consolidado. Imprime la etiqueta ahora.
                        </p>
                        <PrintButtons />
                        <button onClick={() => setShowConsolidateModal(false)} className="mt-4 text-xs text-gray-400 hover:text-gray-600">
                            Cerrar
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="bg-indigo-50 p-4 rounded-lg mb-4 text-xs text-indigo-800">
                            <p>Ingresa las medidas finales de la caja consolidada.</p>
                        </div>

                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Peso Final (Lbs)</label>
                        <input type="number" value={finalWeight} onChange={(e) => setFinalWeight(e.target.value)} placeholder="Ej: 70" className="w-full border border-gray-300 rounded-lg p-3 font-mono text-lg mb-4 focus:ring-2 focus:ring-indigo-500 outline-none" autoFocus />

                        <div className="grid grid-cols-3 gap-2 mb-6">
                            <div><label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Largo</label><input type="number" placeholder="In" className="w-full border p-2 rounded-lg text-center" value={dims.length} onChange={(e) => setDims({...dims, length: e.target.value})}/></div>
                            <div><label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Ancho</label><input type="number" placeholder="In" className="w-full border p-2 rounded-lg text-center" value={dims.width} onChange={(e) => setDims({...dims, width: e.target.value})}/></div>
                            <div><label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Alto</label><input type="number" placeholder="In" className="w-full border p-2 rounded-lg text-center" value={dims.height} onChange={(e) => setDims({...dims, height: e.target.value})}/></div>
                        </div>

                        <button onClick={handleConsolidate} disabled={isSaving} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all">
                            {isSaving ? <Loader2 className="animate-spin"/> : <Box size={18}/>} Guardar y Habilitar Pago
                        </button>
                    </>
                )}
            </div>
        </div>
      )}

      {/* 🛑 AQUI USAMOS EL MODAL DE EDICIÓN (DEBE EXISTIR) */}
      {isEditOpen && <EditPackageAdminModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} pkg={pkg} />}
      
      {/* --- MODAL DESPACHO --- */}
      {showDispatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-800">
                        {dispatchSuccess ? '¡Despacho Exitoso!' : (isGaspMaker ? "Despacho GMC" : "Tracking Manual")}
                    </h3>
                    <button onClick={() => setShowDispatchModal(false)}><X size={20} className="text-gray-400"/></button>
                </div>

                {dispatchSuccess ? (
                    <div className="text-center">
                        <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-3">
                            <CheckCircle size={32}/>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">Tracking Generado:</p>
                        <p className="font-mono font-bold text-xl text-blue-600 mb-6 bg-blue-50 p-2 rounded">{trackingNumber}</p>
                        
                        <PrintButtons />
                        
                        <button onClick={() => setShowDispatchModal(false)} className="mt-4 text-xs text-gray-400 hover:text-gray-600">
                            Cerrar
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="bg-blue-50 p-3 rounded-lg mb-4 text-sm"><p className="font-bold text-blue-800">{pkg.selectedCourier}</p></div>
                        <input type="text" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="Tracking..." className="w-full border p-3 rounded-lg mb-4 font-mono text-lg"/>
                        <button onClick={handleDispatch} disabled={isSaving} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg flex gap-2 justify-center">
                            {isSaving ? <Loader2 className="animate-spin"/> : <Save size={18}/>} Guardar
                        </button>
                    </>
                )}
            </div>
        </div>
      )}
    </div>
  );
}