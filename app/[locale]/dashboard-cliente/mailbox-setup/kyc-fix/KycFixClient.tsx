"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UploadCloud, AlertCircle, Loader2, UserX, ExternalLink, ShieldCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface Props {
  locale: string;
  recipientId: string;
  fullName: string;
  rejectionReason: string | null;
}

export default function KycFixClient({ locale, recipientId, fullName, rejectionReason }: Props) {
  const router = useRouter();
  const t = useTranslations('KycFix');
  
  const [loading, setLoading] = useState(false);
  const [docs, setDocs] = useState<{form1583: File|null, id1: File|null, id2: File|null}>({
    form1583: null, id1: null, id2: null
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!docs.form1583 || !docs.id1 || !docs.id2) {
      alert(t('alertMissingDocs'));
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("recipientId", recipientId);
      formData.append("form1583", docs.form1583);
      formData.append("id1", docs.id1);
      formData.append("id2", docs.id2);

      const res = await fetch('/api/mailbox/kyc/fix', {
        method: 'POST',
        body: formData, 
      });

      if (res.ok) {
        alert(t('alertSuccess'));
        router.push(`/${locale}/dashboard-cliente/buzon`);
      } else {
        const data = await res.json();
        alert(data.error || t('alertError'));
      }
    } catch (error) {
      console.error("Error:", error);
      alert(t('alertConnection'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent py-4 px-4 sm:px-6 lg:px-8 font-sans text-gray-800">
      <div className="max-w-2xl mx-auto space-y-6">
        
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-200">
            
            {/* 🔥 CORRECCIÓN: Encabezado centrado en móvil y alineado en PC */}
            <div className="flex flex-col md:flex-row items-center text-center md:text-left gap-4 mb-6 pb-6 border-b border-gray-100">
                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center shrink-0">
                    <UserX size={24} />
                </div>
                <div>
                    <h1 className="text-xl font-black text-gray-900">{t('title')}</h1>
                    <p className="text-gray-500 text-sm">{t('updating')} <strong className="text-gray-900">{fullName}</strong></p>
                </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row gap-3 items-center sm:items-start text-center sm:text-left">
                <AlertCircle className="text-red-600 shrink-0 sm:mt-0.5" size={20} />
                <div>
                    <h3 className="font-bold text-red-800 text-sm mb-1">{t('rejectionReason')}</h3>
                    <p className="text-red-700 text-sm">"{rejectionReason || t('defaultRejection')}"</p>
                </div>
            </div>

            <div className="mb-8 bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex flex-col sm:flex-row gap-4 items-center sm:items-start justify-between text-center sm:text-left">
                <div className="flex flex-col sm:flex-row gap-3 items-center sm:items-start">
                    <ShieldCheck className="text-blue-600 shrink-0 sm:mt-0.5" size={20} />
                    <div>
                        <h3 className="text-sm font-bold text-blue-900 mb-1">{t('needNotary')}</h3>
                        <p className="text-xs text-blue-700 leading-relaxed">{t('notaryDesc')}</p>
                    </div>
                </div>
                <a 
                  href="https://www.notarize.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="shrink-0 inline-flex items-center justify-center gap-2 border border-blue-200 bg-white hover:bg-blue-50 text-blue-700 font-bold px-4 py-2 rounded-xl transition text-xs shadow-sm w-full sm:w-auto"
                >
                  Notarize.com <ExternalLink size={14} />
                </a>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <label className="block text-sm font-bold text-gray-900 mb-2">{t('newForm1583')} <span className="text-red-500">*</span></label>
                    <input type="file" required accept=".pdf,image/*" onChange={(e) => setDocs({...docs, form1583: e.target.files?.[0] || null})} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-gray-900 file:text-white hover:file:bg-black cursor-pointer" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <label className="block text-sm font-bold text-gray-900 mb-2">{t('newId1')} <span className="text-red-500">*</span></label>
                        <input type="file" required accept="image/*,.pdf" onChange={(e) => setDocs({...docs, id1: e.target.files?.[0] || null})} className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-gray-200 file:text-gray-900 hover:file:bg-gray-300 cursor-pointer" />
                    </div>

                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <label className="block text-sm font-bold text-gray-900 mb-2">{t('newId2')} <span className="text-red-500">*</span></label>
                        <input type="file" required accept="image/*,.pdf" onChange={(e) => setDocs({...docs, id2: e.target.files?.[0] || null})} className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-gray-200 file:text-gray-900 hover:file:bg-gray-300 cursor-pointer" />
                    </div>
                </div>

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 mt-4"
                >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <UploadCloud size={20} />}
                    {loading ? t('btnUploading') : t('btnSubmit')}
                </button>
            </form>
        </div>
      </div>
    </div>
  );
}