"use client";

import { useEffect, useState } from "react";
import { Mail, CheckCircle, ArrowRight, ShieldAlert, Zap, Clock, Users, PlusCircle } from "lucide-react";
import Link from "next/link";
import { useTranslations } from 'next-intl';
import { useRouter } from "next/navigation";
import MailboxCheckoutModal from '@/components/dashboard/MailboxCheckoutModal';

interface MailboxStatus {
  hasPlan: boolean;
  status?: string;
  planType?: string;
  unreadCount?: number;
  message?: string;
  hasUploadedMainDocs?: boolean; 
  additionalPeopleCount?: number; 
}

interface VirtualMailboxCardProps {
  hasMailbox?: boolean;
  needsKycUpload?: boolean;
  planType?: string | null; 
  savedCards?: any[]; 
  hasUploadedMainDocs?: boolean; 
  additionalPeopleCount?: number;
  status?: string;
  isInsideInbox?: boolean;
}

export default function VirtualMailboxCard({ 
  hasMailbox, 
  needsKycUpload, 
  planType, 
  savedCards = [],
  hasUploadedMainDocs: propHasDocs,
  additionalPeopleCount: propPeopleCount,
  status: propStatus,
  isInsideInbox = false
}: VirtualMailboxCardProps = {}) {
  
  const t = useTranslations('VirtualMailboxCard'); 
  const router = useRouter();
  
  const [data, setData] = useState<MailboxStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/mailbox/status");
        if (res.ok) {
          const result = await res.json();
          setData(result);
        }
      } catch (error) {
        console.error("Error fetching mailbox status:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, []);

  const currentPlan = propStatus ? planType : (data?.planType || planType);
  const currentStatus = propStatus || data?.status;
  const hasDocs = propHasDocs !== undefined ? propHasDocs : (data?.hasUploadedMainDocs || false);
  const peopleCount = propPeopleCount !== undefined ? propPeopleCount : (data?.additionalPeopleCount || 0);

  const planString = String(currentPlan || '').toUpperCase();
  const isPremiumPlan = planString.includes('PREMIUM') || planString.includes('CARGO') || planString.includes('1499');
  const isBasicPlan = currentPlan && !isPremiumPlan;

  const maxSlots = isPremiumPlan ? 6 : 2;
  const usedSlots = 1 + peopleCount; 
  const remainingSlots = Math.max(0, maxSlots - usedSlots);

  if (loading && !propStatus) {
    return (
      <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100 h-full flex flex-col animate-pulse">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-gray-200 rounded-full shrink-0"></div>
          <div className="h-6 bg-gray-200 rounded-md w-1/2"></div>
        </div>
        <div className="space-y-2 mb-4 flex-1">
          <div className="h-3 bg-gray-200 rounded w-full"></div>
          <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          <div className="h-3 bg-gray-200 rounded w-4/6"></div>
        </div>
        <div className="w-full h-10 bg-gray-200 rounded-lg mt-auto shrink-0"></div>
      </div>
    );
  }

  if (!currentPlan && !hasMailbox) {
    return (
      <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100 relative overflow-hidden h-full flex flex-col">
        <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
          {t('badgeNew') || 'Nuevo'}
        </div>
        <div className="flex items-center gap-2 mb-2">
          <Mail className="text-blue-600" size={22} shrink-0 />
          <h2 className="text-lg font-bold text-gray-800">{t('titleSales') || 'Buzón Virtual'}</h2>
        </div>
        <p className="text-sm text-gray-600 mb-4 flex-1">{t('descSales') || 'Obtén tu dirección en Miami y gestiona tus compras.'}</p>
        <Link href="/dashboard-cliente/mailbox-setup" className="w-full bg-gray-900 text-white font-semibold py-2.5 rounded-lg hover:bg-gray-800 transition flex items-center justify-center gap-2 text-sm mt-auto shrink-0">
          {t('btnUnlock') || 'Activar Buzón'} <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  // 🔥 LA CORRECCIÓN MÁGICA: Separamos la lógica del Rechazo
  const isRejected = currentStatus === "REJECTED";
  const isPendingNoDocs = (currentStatus === "PENDING_USPS" || needsKycUpload) && !hasDocs;

  if (isRejected || isPendingNoDocs) {
    return (
      <>
        <MailboxCheckoutModal 
          isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} 
          planName={t('planPremium') || 'Premium Cargo'} price={14.99} savedCards={savedCards} 
          onSuccess={() => { setIsModalOpen(false); router.refresh(); }}
        />
        <div className="bg-red-50 rounded-xl shadow-md p-5 border border-red-200 h-full flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="text-red-600" size={22} shrink-0 />
            <h2 className="text-lg font-bold text-red-800">
                {/* Texto dinámico si está rechazado */}
                {isRejected ? (t('rejectedTitle') || 'Documentos Rechazados') : (t('legalTitle') || 'Legal Action Required')}
            </h2>
          </div>
          <p className="text-sm text-red-700 mb-4 flex-1">
              {isRejected 
                ? (t('rejectedDesc') || 'Tus documentos fueron rechazados. Por favor corrige y vuelve a subir la información.') 
                : (t('legalDesc') || 'By federal law (USPS), you must upload your notarized Form 1583 and 2 IDs to activate your mailbox.')}
          </p>
          <div className="mt-auto space-y-4 shrink-0">
              {isBasicPlan && (
                <div className="bg-gradient-to-br from-[#2a43d4] to-[#3b2b91] rounded-xl p-4 shadow-sm flex flex-col gap-3 text-white animate-in fade-in">
                  <div className="flex items-start gap-3">
                    <div className="bg-white/10 p-2 rounded-full shrink-0 flex items-center justify-center mt-0.5">
                      <Zap className="text-[#facc15]" size={16} />
                    </div>
                    <div>
                      <h3 className="font-bold text-[14px] leading-tight font-garamond">{t('upgradeTitle') || '¡Mejora tu plan a Premium Cargo!'}</h3>
                      <p className="text-blue-100 text-[11px] mt-1 leading-snug">{t('upgradeDesc') || 'Desbloquea escaneos gratis y agrega hasta 5 personas/empresas.'}</p>
                    </div>
                  </div>
                  <button onClick={() => setIsModalOpen(true)} className="w-full bg-[#facc15] hover:bg-[#eab308] text-yellow-950 font-bold py-2 px-3 rounded-lg transition-all shadow-sm flex items-center justify-center text-[13px] active:scale-95">
                    {t('upgradeBtn') || 'Hacer Upgrade ($14.99)'}
                  </button>
                </div>
              )}
              <Link href="/dashboard-cliente/mailbox-setup/kyc" className="w-full bg-red-600 text-white font-semibold py-2.5 rounded-lg hover:bg-red-700 transition flex items-center justify-center text-sm shadow-sm">
                {isRejected ? (t('btnFixDocs') || 'Corregir Documentos') : (t('btnUploadKyc') || 'Upload Documents (KYC)')}
              </Link>
          </div>
        </div>
      </>
    );
  }

  if (currentStatus === "PENDING_USPS" && hasDocs) {
    return (
      <div className="bg-amber-50 rounded-xl shadow-md p-5 border border-amber-200 h-full flex flex-col">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="text-amber-600" size={22} shrink-0 />
          <h2 className="text-lg font-bold text-amber-800">{t('inReviewTitle') || 'Documentos en Revisión'}</h2>
        </div>
        <p className="text-sm text-amber-700 mb-4 flex-1">
          {t('inReviewDesc') || 'Hemos recibido tus documentos legales. Nuestro equipo los está verificando y te notificaremos pronto.'}
        </p>
        <div className="mt-auto pt-4 border-t border-amber-200/60 shrink-0">
          <div className="flex justify-between items-center mb-4">
            <p className="text-xs text-amber-700 font-semibold flex items-center gap-1.5"><Users size={16}/> {t('availableSpaces') || 'Espacios disponibles:'}</p>
            <span className="bg-amber-200 text-amber-800 text-xs font-bold px-2 py-1 rounded-md">{remainingSlots} {t('of') || 'de'} {maxSlots}</span>
          </div>
          <div className="space-y-2">
            {!isInsideInbox && (
              <Link href="/dashboard-cliente/buzon" className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 rounded-lg transition shadow-sm flex items-center justify-center gap-2 text-sm">
                  {t('enterMailbox') || 'Entrar al Buzón'} <ArrowRight size={16} />
              </Link>
            )}
            {remainingSlots > 0 && (
              <Link href="/dashboard-cliente/mailbox-setup/kyc" className="bg-white border-2 border-amber-300 text-amber-700 hover:bg-amber-100 font-bold py-2 px-4 rounded-lg w-full transition-colors flex items-center justify-center gap-2 text-sm shadow-sm">
                <PlusCircle size={16} /> {t('addFamilyMember') || 'Agregar familiar / socio'}
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <MailboxCheckoutModal 
        isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} 
        planName={t('planPremium') || 'Premium Cargo'} price={14.99} savedCards={savedCards} 
        onSuccess={() => { setIsModalOpen(false); router.refresh(); }}
      />
      <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100 h-full flex flex-col">
        <div className="flex justify-between items-center border-b pb-3 mb-3">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 truncate">
            <Mail className="text-yellow-500" size={22} shrink-0 />
            <span className="truncate">{t('titleActive') || 'Buzón Activo'}</span>
          </h2>
          {data?.unreadCount && data.unreadCount > 0 ? (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse shadow-sm shrink-0">
              {data.unreadCount} {t('badgeNewMail')}
            </span>
          ) : (
            <span className="text-xs text-gray-500 flex items-center gap-1 font-medium shrink-0">
              <CheckCircle size={14} className="text-green-500" /> {t('upToDate') || 'Al día'}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600 mb-4 flex-1">
          {t('currentPlan') || 'Plan:'} <span className="font-semibold text-gray-900">{isPremiumPlan ? 'Premium Cargo' : 'Digital Basic'}</span>
        </p>
        <div className="mt-auto space-y-3 shrink-0">
          <Link href="/dashboard-cliente/buzon" className="w-full bg-gray-100 text-gray-800 font-semibold py-2.5 rounded-lg hover:bg-gray-200 transition flex items-center justify-center gap-2 text-sm border border-gray-200">
              {t('btnInbox') || 'Ir a mi Buzón'} <ArrowRight size={14} />
          </Link>
          {isBasicPlan && (
              <button onClick={() => setIsModalOpen(true)} className="w-full bg-gradient-to-br from-[#2a43d4] to-[#3b2b91] hover:from-[#2135a6] hover:to-[#2d216f] text-white text-xs font-bold py-2.5 rounded-lg transition shadow-sm flex justify-center items-center gap-2 active:scale-95">
                  <Zap size={14} className="text-[#facc15]" /> {t('upgradeBtn') || 'Upgrade a Premium'}
              </button>
          )}
          <div className="pt-3 border-t border-gray-100 mt-2">
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-500 font-semibold flex items-center gap-1.5"><Users size={14}/> {t('familyMembers') || 'Familiares'} ({usedSlots}/{maxSlots})</p>
              {remainingSlots > 0 ? (
                <Link href="/dashboard-cliente/mailbox-setup/kyc" className="text-blue-600 hover:text-blue-800 text-[11px] font-bold uppercase tracking-wider">
                  {t('addBtn') || '+ Agregar'}
                </Link>
              ) : (
                <span className="text-gray-400 text-[11px] font-bold uppercase">{t('limitReached') || 'Límite alcanzado'}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}