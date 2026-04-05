"use client";

import React, { useState, useEffect } from 'react';
import { CheckCircle2, FileDown, ShieldAlert, UploadCloud, AlertCircle, Loader2, Clock, ExternalLink, PlusCircle, Trash2, UserPlus, X } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import StripeSubscriptionForm from '@/components/StripeSubscriptionForm';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface AdditionalPerson {
  id: string;
  fullName: string;
  file1583: File | null;
  fileId1: File | null;
  fileId2: File | null;
}

export default function KycSetupPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('KycSetup');
  
  const isSuccess = searchParams.get('status') === 'success';
  const [loading, setLoading] = useState(false);

  const [isInitializing, setIsInitializing] = useState(true);

  const [maxPersons, setMaxPersons] = useState(0); 
  const [planType, setPlanType] = useState<string | null>(null);
  const [hasPrimaryDocs, setHasPrimaryDocs] = useState(false); 
  
  const [kycStatus, setKycStatus] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserPlan = async () => {
      try {
        const res = await fetch('/api/mailbox/status');
        const data = await res.json();
        
        if (data.hasPlan) {
          const planString = String(data.planType).toUpperCase();
          const isPremium = planString.includes('PREMIUM') || planString.includes('CARGO') || planString.includes('1499');
          
          const maxExtraAllowed = isPremium ? 5 : 1; 
          const alreadyAdded = data.additionalPeopleCount || 0; 
          const remainingSlots = Math.max(0, maxExtraAllowed - alreadyAdded);
          
          setMaxPersons(remainingSlots);
          setPlanType(isPremium ? 'PREMIUM' : 'BASIC');
          setHasPrimaryDocs(data.hasUploadedMainDocs || false);
          
          setKycStatus(data.titularStatus || data.status || null); 
        }
      } catch (error) {
        console.error("No se pudo verificar el plan del cliente", error);
      } finally {
        setIsInitializing(false);
      }
    };
    fetchUserPlan();
  }, []);

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [selectedPlanDetails, setSelectedPlanDetails] = useState({ name: '', price: '' });

  const [primaryDocs, setPrimaryDocs] = useState<{form1583: File|null, id1: File|null, id2: File|null}>({
    form1583: null, id1: null, id2: null
  });

  const [additionalPersons, setAdditionalPersons] = useState<AdditionalPerson[]>([]);

  const handleDoLater = () => {
    router.push(`/${locale}/dashboard-cliente/buzon`);
  };

  const handleAddPerson = () => {
    if (additionalPersons.length >= maxPersons) {
      alert(t('maxPersonsAlert') || 'Has alcanzado el límite de familiares en tu plan.');
      return;
    }
    setAdditionalPersons([...additionalPersons, {
      id: Math.random().toString(36).substring(7),
      fullName: '',
      file1583: null,
      fileId1: null,
      fileId2: null
    }]);
  };

  const handleRemovePerson = (id: string) => {
    setAdditionalPersons(additionalPersons.filter(p => p.id !== id));
  };

  const updateAdditionalPerson = (id: string, field: keyof AdditionalPerson, value: any) => {
    setAdditionalPersons(additionalPersons.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const needsPrimaryUpload = !hasPrimaryDocs || kycStatus === 'REJECTED';

    if (needsPrimaryUpload && (!primaryDocs.form1583 || !primaryDocs.id1 || !primaryDocs.id2)) {
      alert(t('alertMissingDocs'));
      return;
    }

    for (const person of additionalPersons) {
      if (!person.fullName.trim() || !person.file1583 || !person.fileId1 || !person.fileId2) {
        alert(`${t('missingDataAlert')} ${person.fullName || 'Faltan documentos'}`);
        return;
      }
    }

    setLoading(true);
    
    try {
      const formData = new FormData();
      
      if (primaryDocs.form1583) formData.append("primary_form1583", primaryDocs.form1583);
      if (primaryDocs.id1) formData.append("primary_id1", primaryDocs.id1);
      if (primaryDocs.id2) formData.append("primary_id2", primaryDocs.id2);

      const additionalData = additionalPersons.map(p => ({ id: p.id, fullName: p.fullName }));
      formData.append("additionalData", JSON.stringify(additionalData));

      additionalPersons.forEach(person => {
        formData.append(`add_${person.id}_form1583`, person.file1583 as File);
        formData.append(`add_${person.id}_id1`, person.fileId1 as File);
        formData.append(`add_${person.id}_id2`, person.fileId2 as File);
      });

      const res = await fetch('/api/mailbox/kyc', {
        method: 'POST',
        body: formData, 
      });

      if (res.ok) {
        // 🔥 Sin interrupciones. Redirección automática e instantánea al buzón
        router.push(`/${locale}/dashboard-cliente/buzon`);
      } else {
        const data = await res.json();
        alert(data.error || "Ocurrió un error.");
      }
    } catch (error) {
      console.error("Error subiendo archivos:", error);
      alert("Error de conexión. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  // 🔥 VARIABLE DE MODO CORRECCIÓN
  const isCorrectionMode = hasPrimaryDocs && kycStatus === 'REJECTED';

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 font-sans tabular-nums text-gray-800 tracking-normal relative">
      
      {clientSecret && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative">
            <button onClick={() => setClientSecret(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 bg-gray-100 rounded-full p-1 transition"><X size={20} /></button>
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <StripeSubscriptionForm clientSecret={clientSecret} planName={selectedPlanDetails.name} price={selectedPlanDetails.price} locale={locale} onCancel={() => setClientSecret(null)} />
            </Elements>
          </div>
        </div>
      )}

      <div className={`max-w-3xl mx-auto transition-all ${clientSecret ? 'blur-sm scale-[0.98] opacity-60' : ''}`}>
        
        {isSuccess && (
          <div className="mb-8 bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm animate-in fade-in slide-in-from-top-4">
            <div className="bg-green-100 p-2 rounded-full shrink-0"><CheckCircle2 className="text-green-600" size={24} /></div>
            <div>
              <h3 className="text-green-800 font-bold text-sm sm:text-base font-sans">{t('paymentSuccessTitle')}</h3>
              <p className="text-green-600 text-xs sm:text-sm">{t('paymentSuccessDesc')}</p>
            </div>
          </div>
        )}

        <div className="text-center w-full mb-10 mt-2 min-h-[60px] pt-4">
            <div className="inline-flex items-center justify-center p-3 bg-blue-50 rounded-full mb-4">
              <ShieldAlert className="text-blue-600" size={32} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2A3342] mb-3 tracking-tight font-sans">{t('title')}</h1>
            <p className="text-sm sm:text-base text-gray-500 max-w-xl mx-auto leading-relaxed">{t('subtitle')}</p>
        </div>

        <div className="bg-white shadow-sm border border-gray-200 rounded-3xl overflow-hidden">
          
          <div className="p-6 sm:p-8 border-b border-gray-100 flex gap-4 sm:gap-6 items-start">
            <div className="w-8 h-8 rounded-full bg-gray-900 text-white font-bold flex items-center justify-center shrink-0 mt-1">1</div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-2 font-sans">{t('step1Title')}</h2>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">{t('step1Desc')}</p>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4 text-sm text-yellow-800 flex items-start gap-3">
                <AlertCircle size={20} className="shrink-0 text-yellow-600 mt-0.5" />
                <p className="leading-relaxed" dangerouslySetInnerHTML={{ __html: t.raw('step1Warning') }}></p>
              </div>

              <a 
                href="https://about.usps.com/forms/ps1583.pdf" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold px-5 py-2.5 rounded-xl transition text-sm shadow-sm"
              >
                <FileDown size={18} /> {t('btnDownload')}
              </a>
            </div>
          </div>

          <div className="p-6 sm:p-8 border-b border-gray-100 flex gap-4 sm:gap-6 items-start bg-gray-50/30">
            <div className="w-8 h-8 rounded-full bg-gray-900 text-white font-bold flex items-center justify-center shrink-0 mt-1">2</div>
            <div className="w-full">
              <h2 className="text-lg font-bold text-gray-900 mb-2 font-sans">{t('step2Title')}</h2>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">{t('step2Desc')}</p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <a 
                  href="https://www.notarize.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-semibold px-4 py-2 rounded-xl transition text-sm shadow-sm"
                >
                  Notarize.com <ExternalLink size={14} className="text-gray-400" />
                </a>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 flex gap-4 sm:gap-6 items-start min-h-[400px]">
            <div className="w-8 h-8 rounded-full bg-gmc-dorado-principal text-black font-bold flex items-center justify-center shrink-0 mt-1">3</div>
            <div className="w-full">
              <h2 className="text-lg font-bold text-gray-900 mb-2 font-sans">{t('step3Title')}</h2>
              
              {isInitializing ? (
                <div className="flex flex-col items-center justify-center py-16 animate-in fade-in duration-300">
                  <Loader2 className="animate-spin text-gmc-dorado-principal mb-4" size={40} />
                  <p className="text-gray-500 font-medium text-sm">Sincronizando plan y validando documentos...</p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                    Upload your notarized documents. You can add family members to your account ({planType === 'BASIC' ? 'Max 1 additional' : 'Max 5 additional'}).
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in duration-500">
                    
                    {!isCorrectionMode && hasPrimaryDocs ? (
                      <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center shadow-sm">
                        <CheckCircle2 className="text-green-500 mx-auto mb-3" size={40} />
                        <h3 className="text-green-800 font-bold text-lg mb-1">{t('primaryAccountHolder')}</h3>
                        <p className="text-green-600 text-sm font-medium">
                          {t('primaryDocsInReview')}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-5">
                          {isCorrectionMode && (
                            <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-start gap-3">
                                <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={20} />
                                <div>
                                    <p className="text-red-800 font-bold text-sm">{t('rejectedDocsTitle') || 'Documentos Rechazados'}</p>
                                    <p className="text-red-600 text-xs mt-1">{t('rejectedDocsDesc') || 'Por favor, vuelve a subir tus archivos corregidos aquí para una nueva revisión.'}</p>
                                </div>
                            </div>
                          )}

                          <h3 className="text-md font-bold text-gray-800 border-b pb-2">{t('primaryAccountHolder')}</h3>
                          
                          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <label className="block text-sm font-bold text-gray-900 mb-2 font-sans">{t('lblForm1583')} <span className="text-red-500">*</span></label>
                            <input type="file" required accept=".pdf,image/*" onChange={(e) => setPrimaryDocs({...primaryDocs, form1583: e.target.files?.[0] || null})} className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-gray-900 file:text-white hover:file:bg-black transition-colors cursor-pointer" />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                <label className="block text-sm font-bold text-gray-900 mb-2 font-sans">{t('lblId1')} <span className="text-red-500">*</span></label>
                                <input type="file" required accept="image/*,.pdf" onChange={(e) => setPrimaryDocs({...primaryDocs, id1: e.target.files?.[0] || null})} className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-gray-200 file:text-gray-900 hover:file:bg-gray-300 transition-colors cursor-pointer" />
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                <label className="block text-sm font-bold text-gray-900 mb-2 font-sans">{t('lblId2')} <span className="text-red-500">*</span></label>
                                <input type="file" required accept="image/*,.pdf" onChange={(e) => setPrimaryDocs({...primaryDocs, id2: e.target.files?.[0] || null})} className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-gray-200 file:text-gray-900 hover:file:bg-gray-300 transition-colors cursor-pointer" />
                            </div>
                          </div>
                      </div>
                    )}

                    {/* 🔥 LA MAGIA: OCULTAMOS LOS FAMILIARES SI ESTÁ EN MODO CORRECCIÓN */}
                    {!isCorrectionMode && (
                      <>
                        {/* PERSONAS ADICIONALES */}
                        {additionalPersons.map((person, index) => (
                            <div key={person.id} className="p-5 bg-blue-50/50 border border-blue-100 rounded-2xl relative animate-in fade-in">
                                <button type="button" onClick={() => handleRemovePerson(person.id)} className="absolute top-4 right-4 text-red-400 hover:text-red-600 p-1 bg-white rounded-full shadow-sm transition"><Trash2 size={18} /></button>
                                <h3 className="text-md font-bold text-blue-900 mb-4 flex items-center gap-2"><UserPlus size={18}/> {t('additionalPerson')} {index + 1}</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-900 mb-1">{t('fullName')} <span className="text-red-500">*</span></label>
                                        <input type="text" required placeholder={t('fullNamePlaceholder')} value={person.fullName} onChange={(e) => updateAdditionalPerson(person.id, 'fullName', e.target.value)} className="w-full p-2.5 rounded-lg border border-gray-300 outline-none focus:border-blue-500 text-sm" />
                                    </div>
                                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                                        <label className="block text-sm font-bold text-gray-900 mb-1">{t('lblForm1583')} <span className="text-red-500">*</span></label>
                                        <input type="file" required accept=".pdf,image/*" onChange={(e) => updateAdditionalPerson(person.id, 'file1583', e.target.files?.[0] || null)} className="w-full text-xs text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-gray-100 file:text-gray-800 hover:file:bg-gray-200 cursor-pointer" />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="bg-white p-3 rounded-lg border border-gray-200">
                                            <label className="block text-sm font-bold text-gray-900 mb-1">{t('lblId1')} <span className="text-red-500">*</span></label>
                                            <input type="file" required accept="image/*,.pdf" onChange={(e) => updateAdditionalPerson(person.id, 'fileId1', e.target.files?.[0] || null)} className="w-full text-xs text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-gray-100 file:text-gray-800 hover:file:bg-gray-200 cursor-pointer" />
                                        </div>
                                        <div className="bg-white p-3 rounded-lg border border-gray-200">
                                            <label className="block text-sm font-bold text-gray-900 mb-1">{t('lblId2')} <span className="text-red-500">*</span></label>
                                            <input type="file" required accept="image/*,.pdf" onChange={(e) => updateAdditionalPerson(person.id, 'fileId2', e.target.files?.[0] || null)} className="w-full text-xs text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-gray-100 file:text-gray-800 hover:file:bg-gray-200 cursor-pointer" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* BOTÓN DE AGREGAR PERSONA O AVISO DE LÍMITE */}
                        {maxPersons > 0 ? (
                          additionalPersons.length < maxPersons && (
                              <button type="button" onClick={handleAddPerson} className={`w-full py-3 border-2 border-dashed font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${planType === 'BASIC' ? 'border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-gray-100' : 'border-blue-300 text-blue-600 hover:border-blue-500 hover:bg-blue-50'}`}>
                                  <PlusCircle size={20}/> {t('btnAddPerson')} ({additionalPersons.length}/{maxPersons})
                              </button>
                          )
                        ) : (
                          <div className="w-full py-3 bg-gray-100 text-gray-500 font-bold rounded-xl text-center text-sm border border-gray-200">
                            {t('maxPersonsLimitReached') || 'Has alcanzado el límite de familiares permitidos en tu plan actual.'}
                          </div>
                        )}
                      </>
                    )}

                    <div className="pt-6 flex flex-col sm:flex-row gap-3 border-t">
                      <button type="submit" disabled={loading} className="flex-1 bg-gray-900 hover:bg-black text-white font-bold py-4 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-70 disabled:scale-100 active:scale-95 text-base">
                        {loading ? <Loader2 className="animate-spin text-gmc-dorado-principal" size={20} /> : <UploadCloud size={20} className="text-gmc-dorado-principal" />}
                        {loading ? t('processing') : t('btnSubmit')}
                      </button>
                      <button type="button" onClick={handleDoLater} disabled={loading} className="flex-none bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-bold py-4 px-6 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95 text-sm">
                        <Clock size={18} className="text-gray-400" /> {t('btnDoLater')}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}