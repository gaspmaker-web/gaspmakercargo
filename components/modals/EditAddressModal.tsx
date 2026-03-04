"use client";

import React, { useState, useEffect, Fragment, useMemo } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, MapPin, Building2, Phone, Globe, Hash, User } from 'lucide-react';
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
  onSave: (data: { fullName: string; address: string; cityZip: string; country: string; phone: string }) => void;
  currentData: { fullName?: string; address: string; cityZip: string; country: string; phone: string };
}

export default function EditAddressModal({ isOpen, onClose, onSave, currentData }: EditAddressModalProps) {
  const t = useTranslations('EditAddressModal');
  const tProfile = useTranslations('ProfilePage'); 
  const [isLoading, setIsLoading] = useState(false);

  const [fullName, setFullName] = useState(''); 
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [country, setCountry] = useState('');
  
  const [phoneCountryCode, setPhoneCountryCode] = useState('us');
  const [phoneNumber, setPhoneNumber] = useState('');

  const sortedCountries = useMemo(() => {
    return [...ALL_COUNTRIES].sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  useEffect(() => {
    if (isOpen) {
        setFullName(currentData.fullName || ''); 
        setAddress(currentData.address || '');
        setCountry(currentData.country ? currentData.country.toUpperCase() : 'US');
        
        const rawPhone = currentData.phone || '';
        let extractedCountryCode = 'us';
        let extractedNumber = rawPhone;

        const byLongestDial = [...sortedCountries].sort((a, b) => b.dial_code.length - a.dial_code.length);
        const matchedCountry = byLongestDial.find(c => rawPhone.startsWith(c.dial_code));

        if (matchedCountry) {
            const addrCountry = currentData.country?.toLowerCase();
            const addrCountryObj = sortedCountries.find(c => c.code.toLowerCase() === addrCountry);

            if (addrCountryObj && addrCountryObj.dial_code === matchedCountry.dial_code) {
                extractedCountryCode = addrCountryObj.code;
            } else {
                extractedCountryCode = matchedCountry.code;
            }
            extractedNumber = rawPhone.substring(matchedCountry.dial_code.length).trim();
        }
        
        setPhoneCountryCode(extractedCountryCode);
        setPhoneNumber(extractedNumber);

        const fullString = currentData.cityZip || '';
        
        const zipMatch = fullString.match(/\b\d{5}(?:-\d{4})?\b/);
        const foundZip = zipMatch ? zipMatch[0] : '';
        setZip(foundZip);

        let remainder = fullString.replace(foundZip, '').trim().replace(/,$/, ''); 
        
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
  }, [isOpen, currentData, sortedCountries]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const finalCityZip = `${city}, ${state} ${zip}`.trim().replace(/^, /, '').replace(/, $/, '');
    
    const selectedDialObj = sortedCountries.find(c => c.code === phoneCountryCode);
    const actualDialCode = selectedDialObj ? selectedDialObj.dial_code : '+1';
    const finalPhone = `${actualDialCode} ${phoneNumber}`.trim();

    try {
      await onSave({
        fullName, 
        address,
        cityZip: finalCityZip,
        country,
        phone: finalPhone
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        
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
                    <p className="text-sm text-gray-400 mt-1">{tProfile('deliveryDetailsPrompt')}</p>
                  </div>
                  <button 
                    onClick={onClose} 
                    className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  
                  {/* FULL NAME */}
                  <div className="group">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
                        {tProfile('fullNameRecipient')}
                    </label>
                    <div className="relative transition-all duration-300 group-focus-within:scale-[1.01]">
                        <div className="absolute left-4 top-3.5 text-gray-300 group-focus-within:text-gmc-dorado-principal transition-colors">
                            <User size={18} />
                        </div>
                        <input
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Jason Bosland"
                            className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-gray-700 font-medium outline-none focus:bg-white focus:border-gmc-dorado-principal focus:ring-4 focus:ring-gmc-dorado-principal/10 transition-all shadow-sm placeholder:text-gray-300"
                        />
                    </div>
                  </div>

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
                                value={zip}
                                onChange={(e) => setZip(e.target.value)} 
                                placeholder="Optional"
                                className="w-full pl-9 pr-2 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-gray-700 font-medium outline-none focus:bg-white focus:border-gmc-dorado-principal focus:ring-4 focus:ring-gmc-dorado-principal/10 transition-all shadow-sm font-mono text-center placeholder:text-gray-300 placeholder:text-xs"
                            />
                          </div>
                      </div>
                  </div>

                  {/* COUNTRY & PHONE GRID */}
                  <div className="space-y-4">
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
                                {sortedCountries.map((c) => (
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

                    {/* 🔥 PHONE DIVIDIDO 100% RESPONSIVE 🔥 */}
                    <div className="group">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
                            {t('labelPhone') || "Phone"}
                        </label>
                        <div className="flex gap-2">
                            
                            {/* Selector de Prefijo (Fijo para que no se apriete en móviles) */}
                            <div className="relative w-[120px] sm:w-[140px] shrink-0">
                                <select 
                                    value={phoneCountryCode}
                                    onChange={(e) => setPhoneCountryCode(e.target.value)}
                                    className="w-full pl-3 pr-7 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-gray-700 font-bold text-xs sm:text-sm outline-none focus:bg-white focus:border-gmc-dorado-principal focus:ring-4 focus:ring-gmc-dorado-principal/10 transition-all shadow-sm cursor-pointer appearance-none truncate"
                                >
                                    {sortedCountries.map((c) => (
                                        <option key={`phone-${c.code}`} value={c.code}>
                                            {c.code.toUpperCase()} {c.dial_code}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                </div>
                            </div>
                            
                            {/* Input del Número (Ocupa el resto) */}
                            <div className="relative flex-1">
                                <div className="absolute left-4 top-3.5 text-gray-300 group-focus-within:text-gmc-dorado-principal transition-colors">
                                    <Phone size={18} />
                                </div>
                                <input
                                    type="tel"
                                    required
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9 -]/g, ''))}
                                    placeholder="555-0000"
                                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-gray-700 font-medium outline-none focus:bg-white focus:border-gmc-dorado-principal focus:ring-4 focus:ring-gmc-dorado-principal/10 transition-all shadow-sm"
                                />
                            </div>

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