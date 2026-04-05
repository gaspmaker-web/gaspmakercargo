import React from 'react';
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Mailbox, AlertTriangle, Clock, ShieldCheck, Mail, Trash2, XCircle, MapPin, Users, AlertCircle, FileSearch, Image as ImageIcon, UserCheck } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import EnvelopeImage from './EnvelopeImage'; 
import MailItemActions from './MailItemActions'; 
import UpgradeBanner from '@/components/UpgradeBanner';
import DocumentViewerButton from './DocumentViewerButton';
import MailPickupButton from './MailPickupButton'; 

interface Props {
  params: { locale: string };
}

export default async function BuzonPage({ params: { locale } }: Props) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/${locale}/login-cliente`);
  }

  const t = await getTranslations({ locale, namespace: 'Buzon' });

  // 🔥 NUEVO: Traemos las tarjetas guardadas del usuario para el Upgrade
  const savedCards = await prisma.paymentMethod.findMany({
    where: { userId: session.user.id }
  });

  const subscription = await prisma.mailboxSubscription.findUnique({
    where: { userId: session.user.id },
    include: { 
        user: true,
        additionalRecipients: true 
    }
  });

  const mailItems = await prisma.mailItem.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' }
  });

  const isPremium = subscription?.planType === 'PREMIUM_1499' || 
                    subscription?.planType === 'Premium Cargo' || 
                    subscription?.planType === 'PREMIUM';

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const scansThisMonth = mailItems.filter(item => 
    (item.status === 'SCAN_REQUESTED' || item.status === 'SCANNED_READY') && 
    new Date(item.updatedAt) >= startOfMonth
  ).length;

  const hasFreeScansLeft = isPremium && scansThisMonth < 30;
  const MAX_STORAGE_DAYS = isPremium ? 60 : 30;

  const isKycMissing = subscription?.status === 'PENDING_USPS' && !subscription.uspsForm1583Url;
  const isKycInReview = subscription?.status === 'PENDING_USPS' && !!subscription.uspsForm1583Url;
  const isKycRejected = subscription?.status === 'REJECTED';

  const activeAdditionals = subscription?.additionalRecipients?.filter(person => person.status === "ACTIVE") || [];
  const hasActiveAdditional = activeAdditionals.length > 0;

  let isActive = subscription?.status === 'ACTIVE';
  if (!isActive && hasActiveAdditional) {
    isActive = true;
  }

  const approvedNames: string[] = [];
  if (subscription?.status === 'ACTIVE' && subscription?.user?.name) {
    approvedNames.push(subscription.user.name);
  }
  activeAdditionals.forEach(person => {
    approvedNames.push(person.fullName);
  });

  return (
    <div className="min-h-screen bg-transparent py-8 px-4 sm:px-6 lg:px-8 font-sans tabular-nums text-gray-800 tracking-normal">
      <div className="max-w-4xl mx-auto space-y-6 pt-2">

        {/* BANNERS DE ALERTA DEL TITULAR PRINCIPAL */}
        {isKycMissing && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-4 animate-in fade-in">
            <div className="bg-orange-100 p-3 rounded-full shrink-0">
              <AlertTriangle className="text-orange-600" size={24} />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-orange-800 font-bold text-lg mb-1">{t('actionRequiredTitle')}</h2>
              <p className="text-orange-700 text-sm mb-4 leading-relaxed">{t('actionRequiredDesc')}</p>
              <Link href={`/${locale}/dashboard-cliente/mailbox-setup/kyc`} className="inline-block bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 px-6 rounded-xl transition-colors shadow-sm text-sm">
                {t('btnCompleteVerification')}
              </Link>
            </div>
          </div>
        )}

        {isKycRejected && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-4 animate-in fade-in">
            <div className="bg-red-100 p-3 rounded-full shrink-0">
              <XCircle className="text-red-600" size={24} />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-red-800 font-bold text-lg mb-1">{t('rejectedTitle')}</h2>
              <p className="text-red-700 text-sm mb-2 leading-relaxed">{t('rejectedDesc')}</p>
              <div className="bg-white/60 p-3 rounded-lg border border-red-100 text-red-900 text-sm font-semibold mb-4">
                "{subscription?.rejectionReason || t('defaultRejectionReason')}"
              </div>
              <Link href={`/${locale}/dashboard-cliente/mailbox-setup/kyc`} className="inline-block bg-gray-900 hover:bg-black text-white font-bold py-2.5 px-6 rounded-xl transition-colors shadow-sm text-sm">
                {t('btnReupload')}
              </Link>
            </div>
          </div>
        )}

        {isKycInReview && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-4 animate-in fade-in">
            <div className="bg-blue-100 p-3 rounded-full shrink-0">
              <Clock className="text-blue-600" size={24} />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-blue-800 font-bold text-lg mb-1">{t('inReviewTitle')}</h2>
              <p className="text-blue-700 text-sm leading-relaxed">{t('inReviewDesc')}</p>
            </div>
          </div>
        )}

        {/* 🔥 AHORA LE PASAMOS LAS TARJETAS AL COMPONENTE */}
        <UpgradeBanner currentPlan={subscription?.planType} savedCards={savedCards} />

        {/* HEADER DEL BUZÓN */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-8 relative overflow-hidden">
          
          <div className="absolute top-0 right-0 w-64 h-64 bg-gmc-dorado-principal/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>

          <div className="flex flex-col md:flex-row items-center text-center md:text-left gap-4 md:gap-5 relative z-10 w-full md:w-auto">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-2xl shadow-inner border border-gray-200/50 shrink-0">
              <Mailbox className="text-gmc-dorado-principal" size={36} strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-2 tracking-tight">{t('virtualMailbox')}</h2>
              {isActive ? (
                <div className="inline-flex items-center justify-center gap-1.5 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-200 mx-auto md:mx-0">
                  <ShieldCheck size={14} /> {t('activeReady')}
                </div>
              ) : (
                <div className="inline-flex items-center justify-center gap-1.5 bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold border border-gray-200 mx-auto md:mx-0">
                  <Clock size={14} /> {t('statusPending')}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl w-full md:w-[320px] shadow-sm relative z-10 shrink-0 mx-auto md:mx-0 flex flex-col overflow-hidden">
            <div className="p-5 text-center md:text-left">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-3 flex items-center justify-center md:justify-start gap-2">
                  <MapPin size={12} className="text-gray-400" /> {t('yourAddress')}
                </p>
                
                {isActive ? (
                  <div className="space-y-1.5 text-sm font-medium text-gray-800">
                    {approvedNames.length > 0 && (
                      <div className="mb-2">
                        {approvedNames.map((name, index) => (
                          <p key={index} className="font-bold text-gray-900 text-base leading-tight">{name}</p>
                        ))}
                      </div>
                    )}
                    
                    <div className="mt-1">
                      <p className="text-blue-700 font-extrabold bg-blue-50 border border-blue-100 inline-block px-2.5 py-0.5 rounded text-xs tracking-wider">
                        Suite #{subscription?.user?.suiteNo || "----"}
                      </p>
                    </div>
                    <div className="pt-1 space-y-0.5">
                      <p className="text-gray-600">1861 NW 22nd St</p>
                      <p className="text-gray-600">Miami, FL 33142</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-4 px-2 text-gray-400">
                    <ShieldCheck size={28} className="mb-3 text-gray-300" strokeWidth={1.5} />
                    <p 
                      className="text-xs text-center font-medium leading-relaxed" 
                      dangerouslySetInnerHTML={{ __html: t('pendingSuite') }} 
                    />
                  </div>
                )}
            </div>

            {isActive && subscription?.status !== 'ACTIVE' && (
                <div className="bg-gray-50 border-t border-gray-200 p-4">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Titular</p>
                    <p className="font-bold text-gray-800 text-sm truncate mb-2">{subscription?.user?.name || 'GASP PHONE'}</p>
                    <span className="inline-flex items-center gap-1.5 text-[10px] bg-orange-100 text-orange-700 px-2.5 py-1 rounded-md font-bold uppercase tracking-wider border border-orange-200">
                        <Clock size={12} /> {t('statusPending')}
                    </span>
                </div>
            )}
          </div>
        </div>

        {/* CARROUSEL DE PERSONAS AUTORIZADAS */}
        {subscription?.additionalRecipients && subscription.additionalRecipients.length > 0 && (
            <div className="pt-2">
                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2 uppercase tracking-wider">
                  <Users size={18} className="text-blue-600" /> {t('authorizedPersons')}
                </h3>
                
                <div className="flex overflow-x-auto gap-4 pb-2 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                  {subscription.additionalRecipients.map((rec) => (
                      <div key={rec.id} className={`min-w-[280px] sm:min-w-[320px] snap-start shrink-0 p-4 rounded-2xl border ${
                          rec.status === 'REJECTED' ? 'bg-red-50 border-red-200' : 
                          rec.status === 'ACTIVE' ? 'bg-green-50/40 border-green-200' : 
                          'bg-gray-50 border-gray-200'
                      }`}>
                          <div className="flex justify-between items-start mb-2">
                              <p className="font-bold text-gray-900 truncate pr-2">{rec.fullName}</p>
                              
                              {rec.status === 'ACTIVE' && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0">{t('activeStatus')}</span>}
                              {rec.status === 'PENDING_USPS' && <span className="text-[10px] bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0">{t('inReviewTitle')}</span>}
                              {rec.status === 'REJECTED' && <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0">{t('rejectedTitle')}</span>}
                          </div>

                          {rec.status === 'REJECTED' && (
                              <div className="mt-3">
                                  <div className="bg-white/60 p-2 rounded-lg border border-red-100 mb-3">
                                      <p className="text-xs text-red-700 font-medium flex items-start gap-1.5">
                                          <AlertCircle size={14} className="shrink-0 mt-0.5" />
                                          "{rec.rejectionReason}"
                                      </p>
                                  </div>
                                  <Link 
                                      href={`/${locale}/dashboard-cliente/mailbox-setup/kyc-fix?id=${rec.id}`} 
                                      className="block w-full text-center bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2.5 rounded-xl transition-colors shadow-sm"
                                  >
                                      {t('btnReupload')}
                                  </Link>
                              </div>
                          )}
                      </div>
                  ))}
                </div>
            </div>
        )}

        {/* LISTA DE CORRESPONDENCIA CON ALERTA DE CADUCIDAD */}
        <div className="pt-4">
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
               {t('receivedEnvelopes')}
               <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs font-bold">{mailItems.length}</span>
            </h3>
            
            {/* COMPONENTE DE PICKUP */}
            <MailPickupButton 
               pendingMailItems={mailItems
                 .filter(item => item.status === 'UNREAD' || item.status === 'SCANNED_READY')
                 .map(item => ({
                     id: item.id,
                     senderName: item.senderName,
                     trackingNumber: item.trackingNumber,
                     receivedAt: item.receivedAt
                 }))} 
            />
          </div>
          
          {mailItems.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-3xl p-10 flex flex-col items-center justify-center text-center shadow-sm">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-5 border border-gray-100">
                <Mail className="text-gray-300" size={36} strokeWidth={1.5} />
              </div>
              <h4 className="text-gray-900 font-bold text-lg mb-2">{t('emptyInboxTitle')}</h4>
              <p className="text-gray-500 text-sm max-w-sm leading-relaxed">{t('emptyInboxDesc')}</p>
            </div>
          ) : (
            <div className="max-h-[600px] overflow-y-auto pr-2 pb-4 space-y-4 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-300 transition-colors">
              {mailItems.map((item) => {
                const hasScannedDocument = !!item.scannedDocUrl;
                const isPdf = hasScannedDocument && item.scannedDocUrl?.toLowerCase().includes('.pdf');

                const diffInMs = new Date().getTime() - new Date(item.receivedAt).getTime();
                const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
                const daysLeft = MAX_STORAGE_DAYS - diffInDays;
                
                const requiresAction = item.status === 'UNREAD' || item.status === 'SCANNED_READY';

                return (
                  <div key={item.id} className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center shadow-sm hover:shadow-md transition-shadow">
                    
                    <EnvelopeImage imageUrl={item.envelopeImageUrl} senderName={item.senderName} />

                   <div className="flex-1 w-full">
                      {item.senderName && (
                        <p className="font-bold text-gray-900 leading-tight mb-1">{item.senderName}</p>
                      )}
                      
                      {item.trackingNumber && (
                        <div className="mb-1.5">
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                            <FileSearch size={12} className="text-slate-400" />
                            Ref: {item.trackingNumber}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          <p className="text-xs text-gray-500 font-medium">{new Date(item.receivedAt).toLocaleDateString()}</p>
                          
                          {item.status === 'PICKUP_SCHEDULED' && (
                              <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded uppercase font-bold tracking-wider flex items-center gap-1.5 shadow-sm">
                                  <MapPin size={12} /> {t('pickupScheduled')}
                              </span>
                          )}
                          
                          {item.status === 'DELIVERED_PHYSICAL' && (
                              <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded uppercase font-bold tracking-wider flex items-center gap-1.5 shadow-sm">
                                  <UserCheck size={12} /> {t('deliveredPhysical')}
                              </span>
                          )}

                          {requiresAction && daysLeft > 0 && (
                            <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider flex items-center gap-1.5 border transition-all ${
                                daysLeft <= 10 
                                  ? 'bg-red-50 text-red-700 border-red-200 animate-pulse' 
                                  : 'bg-orange-50 text-orange-600 border-orange-200'
                            }`}>
                                <Clock size={12} /> {t('expiresIn')} {daysLeft} {t('days')}
                            </span>
                          )}

                          {requiresAction && daysLeft <= 0 && (
                            <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded uppercase font-bold tracking-wider flex items-center gap-1.5 shadow-sm">
                                <Trash2 size={12} /> {t('expiredStatus')}
                            </span>
                          )}
                          
                          {item.weightOz && item.weightOz > 0 ? (
                              <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                                  {item.weightOz} oz
                              </span>
                          ) : null}
                          
                          {item.isDamaged && (
                              <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded uppercase font-bold tracking-wider flex items-center gap-1 shadow-sm">
                                  <AlertTriangle size={10} /> {t('damaged')}
                              </span>
                           )}
                      </div>

                      {hasScannedDocument && (
                        <div className="mt-3">
                          <DocumentViewerButton 
                              url={item.scannedDocUrl!} 
                              isPdf={isPdf} 
                              btnText={t('viewDocument')} 
                          />
                        </div>
                      )}

                    </div>
                    
                    <MailItemActions 
                      mailItemId={item.id} 
                      currentStatus={item.status} 
                      isPremium={isPremium} 
                      hasFreeScansLeft={hasFreeScansLeft}
                    />

                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}