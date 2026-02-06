"use client";

import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, MapPin, Building2, Phone, Globe, Hash } from 'lucide-react';
import { useTranslations } from 'next-intl'; 
import { ALL_COUNTRIES } from '@/lib/countries';

// --- CONSTANTES ---
const US_STATES = [
  { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' }, { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' }, { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' }, { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' }, { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' }, { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' }, { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' }, { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' }, { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' }, { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' }, { code: 'DC', name: 'District of Columbia' },
  { code: 'PR', name: 'Puerto Rico' }
];

interface EditAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { address: string; cityZip: string; country: string; phone: string }) => void;
  currentData: { address: string; cityZip: string; country: string; phone: string };
}

export default function EditAddressModal({ isOpen, onClose, onSave, currentData }: EditAddressModalProps) {
  const t = useTranslations('EditAddressModal');
  const [isLoading, setIsLoading] = useState(false);

  // Estados separados para control total
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [country, setCountry] = useState('');
  const [phone, setPhone] = useState('');

  // 🔥 LÓGICA INTELIGENTE: Desarmar el string "CityZip" al abrir
  useEffect(() => {
    if (isOpen) {
        setAddress(currentData.address || '');
        setCountry(currentData.country ? currentData.country.toUpperCase() : 'US');
        setPhone(currentData.phone || '');

        const fullString = currentData.cityZip || '';
        
        // 1. Extraer ZIP (5 dígitos)
        const zipMatch = fullString.match(/\b\d{5}(?:-\d{4})?\b/);
        const foundZip = zipMatch ? zipMatch[0] : '';
        setZip(foundZip);

        // 2. Limpiar para buscar Ciudad y Estado
        let remainder = fullString.replace(foundZip, '').trim().replace(/,$/, ''); 
        
        // 3. Extraer Estado (2 letras mayúsculas al final)
        let foundState = '';
        const parts = remainder.split(' ');
        const lastPart = parts[parts.length - 1];
        
        if (lastPart && lastPart.length === 2 && lastPart === lastPart.toUpperCase()) {
            foundState = lastPart;
            remainder = remainder.substring(0, remainder.lastIndexOf(lastPart)).trim().replace(/,$/, '');
        }
        
        setState(foundState);
        setCity(remainder);
    }
  }, [isOpen, currentData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // 🔥 RE-ARMADO: Juntamos todo para que la base de datos no sufra
    const finalCityZip = `${city}, ${state} ${zip}`.trim().replace(/^, /, '');

    try {
      await onSave({
        address,
        cityZip: finalCityZip,
        country,
        phone
      });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        
        {/* Fondo Oscuro con Blur (Efecto Moderno) */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95 translate-y-4"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100 translate-y-0"
              leaveTo="opacity-0 scale-95 translate-y-4"
            >
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-[2rem] bg-white p-8 text-left align-middle shadow-2xl transition-all font-montserrat border border-gray-100">
                
                {/* Cabecera */}
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-2xl font-bold text-gmc-gris-oscuro font-garamond tracking-tight">
                        {t('title') || "Shipping Address"}
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">Please enter your delivery details accurately.</p>
                  </div>
                  <button 
                    onClick={onClose} 
                    className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  
                  {/* Address Line 1 */}
                  <div className="group">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
                        {t('labelAddress') || "Address Line 1"}
                    </label>
                    <div className="relative transition-all duration-300 group-focus-within:scale-[1.01]">
                        <div className="absolute left-4 top-3.5 text-gray-300 group-focus-within:text-gmc-dorado-principal transition-colors">
                            <MapPin size={18} />
                        </div>
                        <input
                            type="text"
                            required
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="123 Main St, Apt 4B"
                            className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-gray-700 font-medium outline-none focus:bg-white focus:border-gmc-dorado-principal focus:ring-4 focus:ring-gmc-dorado-principal/10 transition-all shadow-sm placeholder:text-gray-300"
                        />
                    </div>
                  </div>

                  {/* GRID: CITY | STATE | ZIP */}
                  <div className="grid grid-cols-12 gap-4">
                      {/* CITY */}
                      <div className="col-span-12 sm:col-span-5 group">
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">City</label>
                          <div className="relative">
                            <div className="absolute left-4 top-3.5 text-gray-300 group-focus-within:text-gmc-dorado-principal">
                                <Building2 size={18} />
                            </div>
                            <input
                                type="text"
                                required
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                placeholder="Miami"
                                className="w-full pl-11 pr-3 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-gray-700 font-medium outline-none focus:bg-white focus:border-gmc-dorado-principal focus:ring-4 focus:ring-gmc-dorado-principal/10 transition-all shadow-sm"
                            />
                          </div>
                      </div>

                      {/* STATE */}
                      <div className="col-span-7 sm:col-span-4 group">
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">State</label>
                          <div className="relative">
                            <select
                                value={state}
                                onChange={(e) => setState(e.target.value)}
                                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-gray-700 font-medium outline-none focus:bg-white focus:border-gmc-dorado-principal focus:ring-4 focus:ring-gmc-dorado-principal/10 transition-all shadow-sm appearance-none cursor-pointer"
                            >
                                <option value="">Select...</option>
                                {US_STATES.map((s) => (
                                    <option key={s.code} value={s.code}>{s.code} - {s.name}</option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-300">
                                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </div>
                          </div>
                      </div>

                      {/* ZIP */}
                      <div className="col-span-5 sm:col-span-3 group">
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Zip</label>
                          <div className="relative">
                            <div className="absolute left-3 top-3.5 text-gray-300 group-focus-within:text-gmc-dorado-principal">
                                <Hash size={16} />
                            </div>
                            <input
                                type="text"
                                required
                                maxLength={5}
                                value={zip}
                                onChange={(e) => setZip(e.target.value.replace(/\D/g, ''))}
                                placeholder="33122"
                                className="w-full pl-9 pr-2 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-gray-700 font-medium outline-none focus:bg-white focus:border-gmc-dorado-principal focus:ring-4 focus:ring-gmc-dorado-principal/10 transition-all shadow-sm font-mono text-center"
                            />
                          </div>
                      </div>
                  </div>

                  {/* COUNTRY & PHONE GRID */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* COUNTRY */}
                    <div className="group">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
                            {t('labelCountry') || "Country"}
                        </label>
                        <div className="relative">
                            <div className="absolute left-4 top-3.5 text-gray-300 group-focus-within:text-gmc-dorado-principal">
                                <Globe size={18} />
                            </div>
                            <select
                                name="country"
                                value={country}
                                onChange={(e) => setCountry(e.target.value)}
                                required
                                className="w-full pl-11 pr-8 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-gray-700 font-medium outline-none focus:bg-white focus:border-gmc-dorado-principal focus:ring-4 focus:ring-gmc-dorado-principal/10 transition-all shadow-sm appearance-none"
                            >
                                <option value="">Select Country</option>
                                {ALL_COUNTRIES.map((c) => (
                                    <option key={c.code} value={c.code.toUpperCase()}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-300">
                                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </div>
                        </div>
                    </div>

                    {/* PHONE */}
                    <div className="group">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
                            {t('labelPhone') || "Phone"}
                        </label>
                        <div className="relative">
                            <div className="absolute left-4 top-3.5 text-gray-300 group-focus-within:text-gmc-dorado-principal">
                                <Phone size={18} />
                            </div>
                            <input
                                type="tel"
                                required
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="+1 786..."
                                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-gray-700 font-medium outline-none focus:bg-white focus:border-gmc-dorado-principal focus:ring-4 focus:ring-gmc-dorado-principal/10 transition-all shadow-sm"
                            />
                        </div>
                    </div>
                  </div>

                  {/* BOTONES DE ACCIÓN */}
                  <div className="flex gap-4 pt-4 mt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 py-3.5 px-6 rounded-2xl border-2 border-gray-100 text-gray-600 font-bold hover:bg-gray-50 hover:border-gray-200 hover:text-gray-800 transition-all active:scale-95"
                    >
                      {t('cancel') || "Cancel"}
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 py-3.5 px-6 rounded-2xl bg-gmc-dorado-principal text-gmc-gris-oscuro font-bold shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/30 hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-gray-800 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        t('save') || "Save Changes"
                      )}
                    </button>
                  </div>

                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}