"use client";

import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { User, MapPin, Box, DollarSign, Camera, CheckCircle, Truck, CreditCard, Banknote, Loader2, Save, Globe, Plus, Trash2, FileText, Printer, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
// 🔥 IMPORTAMOS TU DICCIONARIO MAESTRO DE PAÍSES 🔥
import { ALL_COUNTRIES } from '@/lib/countries';

const US_STATES = [
  { id: 'AL', name: 'Alabama' }, { id: 'AK', name: 'Alaska' }, { id: 'AZ', name: 'Arizona' },
  { id: 'AR', name: 'Arkansas' }, { id: 'CA', name: 'California' }, { id: 'CO', name: 'Colorado' },
  { id: 'CT', name: 'Connecticut' }, { id: 'DE', name: 'Delaware' }, { id: 'FL', name: 'Florida' },
  { id: 'GA', name: 'Georgia' }, { id: 'HI', name: 'Hawaii' }, { id: 'ID', name: 'Idaho' },
  { id: 'IL', name: 'Illinois' }, { id: 'IN', name: 'Indiana' }, { id: 'IA', name: 'Iowa' },
  { id: 'KS', name: 'Kansas' }, { id: 'KY', name: 'Kentucky' }, { id: 'LA', name: 'Louisiana' },
  { id: 'ME', name: 'Maine' }, { id: 'MD', name: 'Maryland' }, { id: 'MA', name: 'Massachusetts' },
  { id: 'MI', name: 'Michigan' }, { id: 'MN', name: 'Minnesota' }, { id: 'MS', name: 'Mississippi' },
  { id: 'MO', name: 'Missouri' }, { id: 'MT', name: 'Montana' }, { id: 'NE', name: 'Nebraska' },
  { id: 'NV', name: 'Nevada' }, { id: 'NH', name: 'New Hampshire' }, { id: 'NJ', name: 'New Jersey' },
  { id: 'NM', name: 'New Mexico' }, { id: 'NY', name: 'New York' }, { id: 'NC', name: 'North Carolina' },
  { id: 'ND', name: 'North Dakota' }, { id: 'OH', name: 'Ohio' }, { id: 'OK', name: 'Oklahoma' },
  { id: 'OR', name: 'Oregon' }, { id: 'PA', name: 'Pennsylvania' }, { id: 'RI', name: 'Rhode Island' },
  { id: 'SC', name: 'South Carolina' }, { id: 'SD', name: 'South Dakota' }, { id: 'TN', name: 'Tennessee' },
  { id: 'TX', name: 'Texas' }, { id: 'UT', name: 'Utah' }, { id: 'VT', name: 'Vermont' },
  { id: 'VA', name: 'Virginia' }, { id: 'WA', name: 'Washington' }, { id: 'WV', name: 'West Virginia' },
  { id: 'WI', name: 'Wisconsin' }, { id: 'WY', name: 'Wyoming' }, { id: 'DC', name: 'District of Columbia' }
];

export default function PayAndGoClient() {
  const { register, control, handleSubmit, watch, formState: { errors }, reset } = useForm({
    defaultValues: {
      weightUnit: 'lbs',
      contentType: 'MERCHANDISE',
      customsItems: [{ description: '', quantity: 1, value: 0, weight: 0, weightUnit: 'oz', originCountry: 'US' }]
    }
  });
  
  const { fields: customsFields, append: appendCustoms, remove: removeCustoms } = useFieldArray({
    control,
    name: "customsItems"
  });
  
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const [rates, setRates] = useState<any[]>([]);
  const [loadingRates, setLoadingRates] = useState(false);
  const [selectedRate, setSelectedRate] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD'>('CASH');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);

  const watchWeight = watch('weight');
  const watchWeightUnit = watch('weightUnit');
  const watchCountry = watch('receiverCountry', 'US');
  const watchZip = watch('receiverZip');
  const watchCity = watch('receiverCity');
  const watchState = watch('receiverState');
  const watchDeclaredValue = watch('declaredValue');

  // 🔥 ORDENAMOS LA LISTA MAESTRA ALFABÉTICAMENTE 🔥
  const sortedCountries = [...ALL_COUNTRIES].sort((a, b) => a.name.localeCompare(b.name));

  const basePrice = selectedRate ? selectedRate.price : 0;
  const declaredValNum = parseFloat(watchDeclaredValue || '0');
  const insuranceFee = declaredValNum > 100 ? declaredValNum * 0.03 : 0;
  const subtotalPreStripe = basePrice + insuranceFee;
  const stripeFee = paymentMethod === 'CARD' ? subtotalPreStripe * 0.072 : 0;
  const finalTotalAmount = subtotalPreStripe + stripeFee;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const data = new FormData();
      data.append('file', file);
      data.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ml_default');
      const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: data });
      const json = await res.json();
      if (json.secure_url) setPhotoUrl(json.secure_url);
    } catch (error) { alert("Error subiendo foto"); } finally { setIsUploading(false); }
  };

  const handleQuote = async () => {
    if (!watchWeight) return alert("Ingresa el peso para cotizar.");
    setLoadingRates(true);
    try {
      const rawWeight = parseFloat(watchWeight);
      const weightInLbs = watchWeightUnit === 'oz' ? rawWeight / 16 : rawWeight;

      const res = await fetch("/api/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weight: weightInLbs,
          dimensions: {
            length: parseFloat(watch('length') || '10'),
            width: parseFloat(watch('width') || '10'),
            height: parseFloat(watch('height') || '10')
          },
          destination: { 
            countryCode: watchCountry,
            postalCode: watchZip,
            city: watchCity,
            state: watchState
          }
        }),
      });
      const data = await res.json();
      setRates(data.rates || []);
    } catch (error) {
      alert("Error cotizando");
    } finally {
      setLoadingRates(false);
    }
  };

  const onSubmit = async (data: any) => {
    if (!selectedRate) return alert("Selecciona una tarifa de envío primero.");
    if (!photoUrl) return alert("Toma una foto del paquete para el registro.");
    if (data.customsItems.length === 0) return alert("Debes agregar al menos 1 artículo en la Declaración de Aduanas.");

    setIsSubmitting(true);
    try {
      const finalPhone = `${data.senderPhoneCode} ${data.senderPhone}`;
      const rawWeight = parseFloat(data.weight);
      const finalWeightLbs = data.weightUnit === 'oz' ? rawWeight / 16 : rawWeight;
      const combinedDescription = data.customsItems.map((item: any) => item.description).join(", ");

      const payload = {
        ...data,
        weight: finalWeightLbs,
        senderPhone: finalPhone,
        description: combinedDescription,
        photoUrl,
        courier: selectedRate.carrier,
        service: selectedRate.service,
        rateId: selectedRate.id, 
        shipmentId: selectedRate.shipment_id,
        price: finalTotalAmount, 
        subtotal: basePrice,
        processingFee: stripeFee + insuranceFee,
        paymentMethod
      };

      const res = await fetch('/api/admin/pay-and-go', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      if (res.ok) {
        setSuccessData({ ...result, formData: payload });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        throw new Error(result.message || "Error al procesar Pay & Go");
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onInvalid = (errors: any) => {
    const missingFields = Object.keys(errors).join(", ");
    alert(`⚠️ Faltan campos obligatorios por llenar.\n\nRevisa: ${missingFields.toUpperCase()}`);
  };

  const handleGenerateInvoice = () => {
    if (!successData || !successData.formData) return;
    
    const fd = successData.formData;
    const date = new Date().toLocaleDateString('en-US');
    
    const totalValue = fd.customsItems.reduce((acc: number, item: any) => acc + (parseFloat(item.quantity) * parseFloat(item.value)), 0);
    const packageTotalWeightLbs = parseFloat(fd.weight);
    const totalInvoice = totalValue + parseFloat(fd.price);

    const itemsHtml = fd.customsItems.map((item: any) => {
      const weightInLbs = item.weightUnit === 'oz' 
        ? (parseFloat(item.weight) / 16).toFixed(2) 
        : parseFloat(item.weight).toFixed(2);

      return `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">${item.quantity}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${item.originCountry}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${item.description}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${weightInLbs} lbs</td>
          <td style="padding: 8px; border: 1px solid #ddd;">$${parseFloat(item.value).toFixed(2)}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">$${(item.quantity * item.value).toFixed(2)}</td>
        </tr>
      `;
    }).join('');

    const invoiceWindow = window.open('', '_blank');
    if (!invoiceWindow) return alert("Por favor, permite las ventanas emergentes (pop-ups) para generar la factura.");

    invoiceWindow.document.write(`
      <html>
        <head>
          <title>Commercial Invoice - ${successData.tracking}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; line-height: 1.5; }
            h1 { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; text-transform: uppercase; letter-spacing: 2px; }
            .flex-container { display: flex; justify-content: space-between; margin-bottom: 30px; margin-top: 30px; }
            .box { width: 45%; border: 1px solid #ccc; padding: 15px; border-radius: 4px; background: #fafafa; }
            .box h3 { margin-top: 0; color: #555; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
            th { background-color: #f4f4f4; padding: 10px; border: 1px solid #ccc; text-align: left; }
            .summary { width: 50%; float: right; margin-top: 30px; }
            .summary table th { background: transparent; text-align: right; }
            .summary table td { text-align: right; font-weight: bold; }
            .footer { clear: both; padding-top: 60px; font-size: 13px; color: #555; }
            .signature-line { border-bottom: 1px solid #333; width: 300px; margin-top: 40px; display: inline-block; }
          </style>
        </head>
        <body>
          <h1>Commercial Invoice</h1>
          
          <table style="width: 100%; border: none; margin-top: 0;">
            <tr>
              <td style="border: none;"><strong>Invoice Date:</strong> ${date}</td>
              <td style="border: none; text-align: right;"><strong>Carrier:</strong> ${fd.courier}</td>
            </tr>
            <tr>
              <td style="border: none;"><strong>Reason for Export:</strong> ${fd.contentType}</td>
              <td style="border: none; text-align: right;"><strong>Tracking Number:</strong> ${successData.tracking}</td>
            </tr>
          </table>

          <div class="flex-container">
            <div class="box">
              <h3>Sender / Exporter:</h3>
              <p><strong>${fd.senderName}</strong></p>
              <p>Phone: ${fd.senderPhone}</p>
              <p>Email: ${fd.senderEmail}</p>
              <p>Miami, FL 33166<br/>United States</p>
            </div>
            <div class="box">
              <h3>Recipient / Importer:</h3>
              <p><strong>${fd.receiverName}</strong></p>
              <p>${fd.receiverAddress}</p>
              <p>${fd.receiverCity}, ${fd.receiverState} ${fd.receiverZip}</p>
              <p><strong>${fd.receiverCountry}</strong></p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Qty</th>
                <th>Origin</th>
                <th>Description of Contents</th>
                <th>Weight</th>
                <th>Unit Value</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="summary">
            <table>
              <tr><th>Total Gross Weight:</th><td>${packageTotalWeightLbs.toFixed(2)} lbs</td></tr>
              <tr><th>Total Declared Value (USD):</th><td>$${totalValue.toFixed(2)}</td></tr>
              <tr><th>Freight & Processing Charges:</th><td>$${parseFloat(fd.price).toFixed(2)}</td></tr>
              <tr><th style="font-size: 18px; color: #000;">Total Invoice Amount:</th><td style="font-size: 18px; color: #000;">$${totalInvoice.toFixed(2)}</td></tr>
            </table>
          </div>

          <div class="footer">
            <p>I / We hereby certify that the information on this invoice is true and correct and that the contents of this shipment are as stated above. These commodities, technology, or software were exported from the United States in accordance with the Export Administration Regulations. Diversion contrary to U.S. law is prohibited.</p>
            <div style="margin-top: 50px;">
              <span class="signature-line"></span><br/>
              <strong>Signature / Name:</strong> ${fd.senderName}
            </div>
          </div>
        </body>
      </html>
    `);
    
    invoiceWindow.document.close();
    invoiceWindow.focus();
    setTimeout(() => {
      invoiceWindow.print();
    }, 500);
  };

  if (successData) {
    return (
      <div className="bg-white rounded-2xl p-10 text-center shadow-sm max-w-2xl mx-auto border-2 border-green-500 animate-in fade-in">
        <CheckCircle size={80} className="mx-auto text-green-500 mb-4" />
        <h2 className="text-3xl font-black text-gray-800 mb-2">¡Envío Procesado!</h2>
        <p className="text-gray-600 mb-6">El cliente y el paquete han sido registrados.</p>
        
        <div className="bg-gray-50 rounded-xl p-6 text-left space-y-3 mb-6 font-mono text-sm border border-gray-200">
          <p><strong>Tracking Oficial:</strong> <span className="text-blue-600 font-bold text-lg">{successData.tracking}</span></p>
          <p><strong>Cliente:</strong> {successData.formData?.senderName} ({successData.formData?.senderEmail})</p>
          <p><strong>Total Cobrado:</strong> ${successData.formData?.price?.toFixed(2)} ({successData.formData?.paymentMethod})</p>
        </div>

        {!successData.labelUrl && (
           <div className="mb-6 bg-red-50 text-red-600 border border-red-200 p-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2">
              <AlertTriangle size={16} /> 
              No se pudo generar el Label automático en EasyPost (Posible error de saldo o dirección).
           </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {successData.labelUrl && (
              <button onClick={() => window.open(successData.labelUrl, '_blank')} className="bg-slate-800 text-white px-6 py-3 rounded-xl font-bold hover:bg-black transition flex items-center justify-center gap-2 shadow-md animate-in zoom-in">
                <Printer size={20}/> Imprimir Label
              </button>
            )}
            
            <button onClick={handleGenerateInvoice} className="bg-orange-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-700 transition flex items-center justify-center gap-2 shadow-md">
              <FileText size={20}/> Descargar Invoice Aduanal
            </button>
            <button onClick={() => { reset(); setSuccessData(null); setPhotoUrl(null); setRates([]); setSelectedRate(null); }} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-md">
              <Plus size={20}/> Nuevo Drop & Go
            </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
      
      {/* COLUMNA 1: CLIENTE Y DESTINO */}
      <div className="space-y-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-sm font-bold text-blue-800 uppercase tracking-widest mb-4 flex items-center gap-2 border-b pb-2"><User size={18}/> 1. Datos del Cliente (Remitente)</h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block truncate">Nombre Completo</label>
              <input {...register("senderName", { required: true })} className="w-full h-11 px-3 border border-gray-300 rounded-lg focus:border-blue-500 outline-none" placeholder="Ej: Juan Pérez" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block truncate">Correo Electrónico (Se creará cuenta)</label>
              <input type="email" {...register("senderEmail", { required: true })} className="w-full h-11 px-3 border border-gray-300 rounded-lg focus:border-blue-500 outline-none" placeholder="juan@email.com" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block truncate">Teléfono</label>
              <div className="flex gap-2">
                <select defaultValue="+1" {...register("senderPhoneCode")} className="w-1/3 h-11 px-2 border border-gray-300 rounded-lg focus:border-blue-500 outline-none bg-white text-sm">
                  <option value="+1">🇺🇸 +1</option>
                  <option value="+58">🇻🇪 +58</option>
                  <option value="+1809">🇩🇴 +1 809</option>
                  <option value="+1829">🇩🇴 +1 829</option>
                  <option value="+1849">🇩🇴 +1 849</option>
                  <option value="+52">🇲🇽 +52</option>
                  <option value="+57">🇨🇴 +57</option>
                  <option value="+507">🇵🇦 +507</option>
                  <option value="+34">🇪🇸 +34</option>
                </select>
                <input type="tel" {...register("senderPhone", { required: true })} className="w-2/3 h-11 px-3 border border-gray-300 rounded-lg focus:border-blue-500 outline-none" placeholder="(555) 000-0000" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-sm font-bold text-orange-600 uppercase tracking-widest mb-4 flex items-center gap-2 border-b pb-2"><MapPin size={18}/> 2. Destinatario</h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block truncate">Nombre de quien recibe</label>
              <input {...register("receiverName", { required: true })} className="w-full h-11 px-3 border border-gray-300 rounded-lg focus:border-orange-500 outline-none" placeholder="Ej: María López" />
            </div>
            
            {/* 🔥 AQUÍ SE REEMPLAZÓ EL HARDCODE POR LA LISTA MAESTRA 🔥 */}
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block truncate">País</label>
              <select {...register("receiverCountry", { required: true })} className="w-full h-11 px-3 border border-gray-300 rounded-lg focus:border-orange-500 outline-none font-bold">
                  <option value="" disabled>Seleccione un país</option>
                  {sortedCountries.map((country) => (
                      <option key={country.code} value={country.code.toUpperCase()}>{country.name}</option>
                  ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block truncate">Dirección (Calle y Casa/Apto)</label>
              <input {...register("receiverAddress", { required: true })} className="w-full h-11 px-3 border border-gray-300 rounded-lg focus:border-orange-500 outline-none" placeholder="Ej: 123 Main St, Apt 4" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block truncate">Ciudad (City)</label>
                <input {...register("receiverCity", { required: true })} className="w-full h-11 px-3 border border-gray-300 rounded-lg focus:border-orange-500 outline-none" placeholder="Ej: Miami" />
              </div>
              
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block truncate">Estado (State)</label>
                {watchCountry === 'US' ? (
                  <select {...register("receiverState", { required: true })} className="w-full h-11 px-3 border border-gray-300 rounded-lg focus:border-orange-500 outline-none bg-white">
                    <option value="">Seleccionar...</option>
                    {US_STATES.map(state => (
                      <option key={state.id} value={state.id}>{state.name} ({state.id})</option>
                    ))}
                  </select>
                ) : (
                  <input {...register("receiverState", { required: true })} className="w-full h-11 px-3 border border-gray-300 rounded-lg focus:border-orange-500 outline-none" placeholder="Estado / Prov." />
                )}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block truncate">Código Postal (ZIP Code)</label>
              <input {...register("receiverZip", { required: true })} className="w-full h-11 px-3 border border-gray-300 rounded-lg focus:border-orange-500 outline-none" placeholder="Ej: 33122" />
            </div>

          </div>
        </div>
      </div>

      {/* COLUMNA 2: PAQUETE Y ADUANAS */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-4 flex items-center gap-2 border-b pb-2"><Box size={18} className="text-gmc-dorado-principal"/> 3. Detalles de la Caja</h2>
        
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4 items-end">
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block truncate">Peso Total</label>
              <div className="flex">
                <input type="number" step="0.01" {...register("weight", { required: true })} className="w-2/3 h-12 px-3 border-y-2 border-l-2 border-gray-200 rounded-l-xl focus:border-blue-500 outline-none text-xl font-bold text-center" placeholder="0.00" />
                <select {...register("weightUnit")} className="w-1/3 h-12 border-2 border-gray-200 rounded-r-xl bg-gray-50 text-gray-700 font-bold focus:border-blue-500 outline-none text-center cursor-pointer">
                  <option value="lbs">Lbs</option>
                  <option value="oz">Oz</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block truncate">Valor Declarado ($)</label>
              <input type="number" step="0.01" {...register("declaredValue")} className="w-full h-12 px-3 border-2 border-blue-100 bg-blue-50 rounded-xl focus:border-blue-500 outline-none text-lg font-bold text-blue-800 text-center" placeholder="0.00" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] font-bold text-gray-400 mb-1 block truncate">Largo (L)</label>
              <input type="number" {...register("length")} className="w-full p-2 border border-gray-300 rounded-lg text-center"/>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 mb-1 block truncate">Ancho (W)</label>
              <input type="number" {...register("width")} className="w-full p-2 border border-gray-300 rounded-lg text-center"/>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 mb-1 block truncate">Alto (H)</label>
              <input type="number" {...register("height")} className="w-full p-2 border border-gray-300 rounded-lg text-center"/>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 mb-2 block">Foto en Mostrador (Requerido)</label>
            <label className={`relative w-full h-28 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer overflow-hidden transition-all ${photoUrl ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}>
                {photoUrl ? (
                    <Image src={photoUrl} alt="Evidencia" fill className="object-cover opacity-80" />
                ) : (
                    <>
                        {isUploading ? <Loader2 className="animate-spin text-blue-600" size={24}/> : <Camera size={24} className="text-gray-400"/>}
                        <span className="text-xs font-bold text-gray-500">{isUploading ? 'Subiendo...' : 'Tomar Foto'}</span>
                    </>
                )}
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoUpload} disabled={isUploading}/>
            </label>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-bold text-indigo-800 uppercase mb-4 flex items-center gap-2">
              <Globe size={18}/> Declaración de Aduanas
            </h3>
            
            <div className="mb-4">
              <label className="text-xs font-bold text-gray-500 mb-1 block truncate">Tipo de Contenido (Contents Type)</label>
              <select {...register("contentType")} className="w-full h-11 px-3 border border-gray-300 rounded-lg focus:border-indigo-500 outline-none font-bold text-sm bg-indigo-50">
                <option value="MERCHANDISE">Mercancía (Merchandise)</option>
                <option value="GIFT">Regalo (Gift)</option>
                <option value="DOCUMENTS">Documentos (Documents)</option>
                <option value="SAMPLE">Muestra Comercial (Sample)</option>
                <option value="RETURNED_GOODS">Devolución (Returned Goods)</option>
                <option value="OTHER">Otro (Other)</option>
              </select>
            </div>

            <div className="space-y-4">
              {customsFields.map((item, index) => (
                <div key={item.id} className="p-4 bg-gray-50 border border-gray-200 rounded-xl relative">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-indigo-600 uppercase">Ítem #{index + 1}</span>
                    {customsFields.length > 1 && (
                      <button type="button" onClick={() => removeCustoms(index)} className="text-red-400 hover:text-red-600">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 mb-1 block truncate">Descripción Detallada (Inglés preferible)</label>
                      <input {...register(`customsItems.${index}.description`, { required: true })} className="w-full h-9 px-2 border border-gray-300 rounded-md text-sm" placeholder="Ej: Cotton T-Shirt" />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 items-end">
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 mb-1 block truncate">Cant. (Qty)</label>
                        <input type="number" {...register(`customsItems.${index}.quantity`, { required: true })} className="w-full h-9 px-2 border border-gray-300 rounded-md text-sm text-center outline-none focus:border-indigo-500" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 mb-1 block truncate">Valor Unit. ($)</label>
                        <input type="number" step="0.01" {...register(`customsItems.${index}.value`, { required: true })} className="w-full h-9 px-2 border border-gray-300 rounded-md text-sm text-center outline-none focus:border-indigo-500" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 mb-1 block truncate">Peso Unit.</label>
                        <div className="flex">
                          <input type="number" step="0.01" {...register(`customsItems.${index}.weight`, { required: true })} className="w-2/3 h-9 px-2 border-y border-l border-gray-300 rounded-l-md text-sm text-center outline-none focus:border-indigo-500" placeholder="0.0" />
                          <select {...register(`customsItems.${index}.weightUnit`)} className="w-1/3 h-9 border border-gray-300 rounded-r-md bg-gray-50 text-xs font-bold text-gray-700 outline-none focus:border-indigo-500 cursor-pointer">
                            <option value="oz">oz</option>
                            <option value="lbs">lbs</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div>
                      {/* 🔥 AQUÍ TAMBIÉN SE REEMPLAZÓ EL HARDCODE POR LA LISTA MAESTRA 🔥 */}
                      <label className="text-[10px] font-bold text-gray-500 mb-1 block truncate">País de Fabricación</label>
                      <select {...register(`customsItems.${index}.originCountry`)} className="w-full h-9 px-2 border border-gray-300 rounded-md text-sm outline-none focus:border-indigo-500">
                          {sortedCountries.map((country) => (
                              <option key={country.code} value={country.code.toUpperCase()}>{country.name}</option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button type="button" onClick={() => appendCustoms({ description: '', quantity: 1, value: 0, weight: 0, weightUnit: 'oz', originCountry: 'US' })} className="mt-3 w-full py-2 border-2 border-dashed border-indigo-200 text-indigo-600 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-50 transition">
              <Plus size={16} /> Agregar Otro Artículo
            </button>

          </div>

        </div>
      </div>

      {/* COLUMNA 3: COTIZACIÓN Y PAGO */}
      <div className="bg-[#222b3c] rounded-2xl p-6 shadow-xl text-white flex flex-col">
        <h2 className="text-sm font-bold text-[#EAD8B1] uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-gray-600 pb-2"><DollarSign size={18}/> 4. Cotización y Cobro</h2>
        
        <button type="button" onClick={handleQuote} disabled={loadingRates || !watchWeight || !watchZip || !watchCity} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-md flex justify-center items-center gap-2 mb-6 disabled:opacity-50">
          {loadingRates ? <Loader2 className="animate-spin"/> : <Truck size={18}/>} Calcular Tarifas
        </button>

        {rates.length > 0 && (
          <div className="space-y-3 flex-1 overflow-y-auto">
            {rates.map((rate, i) => (
              <div key={i} onClick={() => setSelectedRate(rate)} className={`p-3 rounded-xl border-2 cursor-pointer transition flex justify-between items-center ${selectedRate?.id === rate.id ? 'border-[#EAD8B1] bg-white/10' : 'border-gray-600 bg-gray-800 hover:border-gray-500'}`}>
                <div>
                  <p className="font-bold text-sm uppercase">{rate.carrier}</p>
                  <p className="text-[10px] text-gray-400">{rate.service}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-[#EAD8B1]">${rate.price.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 🔥 DESGLOSE DEL TOTAL DINÁMICO 🔥 */}
        {selectedRate && (
          <div className="mt-4 mb-4 bg-gray-800 p-4 rounded-xl border border-gray-700 space-y-2 text-sm animate-in fade-in">
            <div className="flex justify-between text-gray-300">
              <span>Costo de Flete:</span>
              <span>${basePrice.toFixed(2)}</span>
            </div>
            
            {insuranceFee > 0 && (
              <div className="flex justify-between text-orange-400 font-medium animate-in slide-in-from-left">
                <span>+ Ins (3%)</span>
                <span>${insuranceFee.toFixed(2)}</span>
              </div>
            )}

            {paymentMethod === 'CARD' && (
              <div className="flex justify-between text-red-400 font-medium animate-in slide-in-from-left">
                <span>Processing Fee:</span>
                <span>+${stripeFee.toFixed(2)}</span>
              </div>
            )}
            
            <div className="flex justify-between text-[#EAD8B1] font-bold text-lg pt-2 border-t border-gray-600 mt-2">
              <span>Total a Cobrar:</span>
              <span>${finalTotalAmount.toFixed(2)}</span>
            </div>
          </div>
        )}

        <div className="mt-auto pt-4 border-t border-gray-600">
            <label className="text-xs font-bold text-gray-400 uppercase mb-3 block">Método de Pago en Mostrador</label>
            <div className="grid grid-cols-2 gap-3 mb-6">
                <button type="button" onClick={() => setPaymentMethod('CASH')} className={`py-3 rounded-xl font-bold flex flex-col items-center justify-center gap-1 border-2 transition ${paymentMethod === 'CASH' ? 'border-green-500 bg-green-500/20 text-green-400' : 'border-gray-600 text-gray-400 hover:bg-gray-800'}`}>
                    <Banknote size={24}/> Efectivo
                </button>
                <button type="button" onClick={() => setPaymentMethod('CARD')} className={`py-3 rounded-xl font-bold flex flex-col items-center justify-center gap-1 border-2 transition ${paymentMethod === 'CARD' ? 'border-blue-500 bg-blue-500/20 text-blue-400' : 'border-gray-600 text-gray-400 hover:bg-gray-800'}`}>
                    <CreditCard size={24}/> Tarjeta (POS)
                </button>
            </div>

            <button type="submit" disabled={isSubmitting || !selectedRate || !photoUrl} className="w-full bg-[#EAD8B1] text-[#222b3c] py-4 rounded-xl text-lg font-black hover:brightness-110 shadow-lg flex justify-center items-center gap-2 disabled:opacity-50 disabled:grayscale transition">
                {isSubmitting ? <Loader2 className="animate-spin"/> : <Save size={24}/>} 
                {isSubmitting ? 'Procesando...' : `COBRAR $${finalTotalAmount.toFixed(2)}`}
            </button>
        </div>
      </div>

    </form>
  );
}