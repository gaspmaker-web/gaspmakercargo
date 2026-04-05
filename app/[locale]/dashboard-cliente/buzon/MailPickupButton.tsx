"use client";

import React, { useState, useEffect } from 'react';
import { MapPin, Calendar, Clock, CheckCircle, Loader2, X, FileText, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface MailItemMin {
  id: string;
  senderName: string | null;
  trackingNumber: string | null;
  receivedAt: Date | string;
}

interface MailPickupButtonProps {
  pendingMailItems: MailItemMin[];
}

export default function MailPickupButton({ pendingMailItems }: MailPickupButtonProps) {
    const router = useRouter();
    const t = useTranslations('Buzon'); 
    
    const [isPickupModalOpen, setIsPickupModalOpen] = useState(false);
    const [pickupDate, setPickupDate] = useState("");
    const [pickupTime, setPickupTime] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [timeError, setTimeError] = useState(""); 

    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    useEffect(() => {
        if (isPickupModalOpen) {
            setSelectedIds(pendingMailItems.map(item => item.id));
            setTimeError(""); 
        }
    }, [isPickupModalOpen, pendingMailItems]);

    if (pendingMailItems.length === 0) return null;

    const toggleSelection = (id: string) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleAll = () => {
        if (selectedIds.length === pendingMailItems.length) {
            setSelectedIds([]); 
        } else {
            setSelectedIds(pendingMailItems.map(item => item.id)); 
        }
    };

    const validatePickupDateTime = () => {
        setTimeError("");
        if (!pickupDate || !pickupTime) return false;

        const dateObj = new Date(pickupDate + "T" + pickupTime);
        const day = dateObj.getDay(); 
        const hour = parseInt(pickupTime.split(':')[0]);

        if (day === 0 || day === 6) {
            setTimeError(t('errorWeekend')); // 🔥 Texto Multilingüe
            return false;
        }

        if (hour < 9 || hour > 16) {
            setTimeError(t('errorTime')); // 🔥 Texto Multilingüe
            return false;
        }

        return true;
    };

    const handleConfirmPickup = async () => {
        if (selectedIds.length === 0) {
            alert(t('errorNoSelection')); // 🔥 Texto Multilingüe
            return;
        }
        if (!pickupDate || !pickupTime) {
            alert(t('pickupAlertSelect'));
            return;
        }

        if (!validatePickupDateTime()) {
            return; 
        }

        setIsProcessing(true);
        try {
            const res = await fetch('/api/mailbox/pickup', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mailItemIds: selectedIds, 
                    scheduledDate: pickupDate,
                    scheduledTime: pickupTime
                })
            });

            if (res.ok) {
                setIsPickupModalOpen(false);
                router.refresh(); 
                alert(t('pickupAlertSuccess'));
            } else {
                const data = await res.json();
                throw new Error(data.message || t('pickupAlertError'));
            }
        } catch (error) {
            console.error(error);
            alert(t('pickupAlertError'));
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <>
            <button 
                onClick={() => setIsPickupModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95"
            >
                <MapPin size={16} /> 
                <span className="hidden sm:inline">{t('pickupBtnDesktop')}</span>
                <span className="sm:hidden">{t('pickupBtnMobile')}</span>
            </button>

            {isPickupModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
                        <div className="bg-blue-50 p-4 border-b border-blue-100 flex justify-between items-center shrink-0">
                            <h3 className="font-bold text-blue-900 flex items-center gap-2">
                                <MapPin size={20}/> {t('pickupModalTitle')}
                            </h3>
                            <button onClick={() => setIsPickupModalOpen(false)} className="text-blue-400 hover:text-blue-700 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-6 text-sm font-bold border border-green-200 flex items-start gap-2">
                                <CheckCircle size={18} className="shrink-0 mt-0.5" /> 
                                {/* 🔥 Texto Multilingüe con conteo dinámico */}
                                {t('pickupFreeNotice', { count: selectedIds.length })}
                            </div>

                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 mb-6 max-h-48 overflow-y-auto">
                                <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-200">
                                    {/* 🔥 Texto Multilingüe */}
                                    <span className="text-xs font-bold text-gray-500 uppercase">{t('selectDocuments')}</span>
                                    <button onClick={toggleAll} className="text-xs text-blue-600 font-bold hover:underline">
                                        {/* 🔥 Texto Multilingüe dinámico */}
                                        {selectedIds.length === pendingMailItems.length ? t('unselectAll') : t('selectAll')}
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {pendingMailItems.map(item => (
                                        <label key={item.id} className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-gray-200">
                                            <input 
                                                type="checkbox" 
                                                checked={selectedIds.includes(item.id)}
                                                onChange={() => toggleSelection(item.id)}
                                                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                                            />
                                            <div className="flex flex-col min-w-0 flex-1">
                                                <span className="text-sm font-bold text-gray-800 line-clamp-1">
                                                    {/* 🔥 Texto Multilingüe */}
                                                    {item.senderName || t('unknownSender')}
                                                </span>
                                                <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                                    <FileText size={10}/>
                                                    {item.trackingNumber ? `Ref: ${item.trackingNumber}` : new Date(item.receivedAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                {/* 🔥 Texto Multilingüe */}
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                                    <Clock size={12} /> {t('officeHours')}
                                </p>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('pickupDateLabel')}</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20}/>
                                        <input 
                                            type="date" 
                                            min={new Date().toISOString().split('T')[0]}
                                            value={pickupDate}
                                            onChange={(e) => {
                                                setPickupDate(e.target.value);
                                                setTimeError(""); 
                                            }}
                                            className="w-full p-3 pl-10 border border-gray-200 rounded-xl outline-none focus:border-blue-500 text-gray-700"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('pickupTimeLabel')}</label>
                                    <div className="relative">
                                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20}/>
                                        <select 
                                            value={pickupTime}
                                            onChange={(e) => {
                                                setPickupTime(e.target.value);
                                                setTimeError(""); 
                                            }}
                                            className="w-full p-3 pl-10 border border-gray-200 rounded-xl outline-none focus:border-blue-500 appearance-none bg-white text-gray-700 cursor-pointer"
                                        >
                                            <option value="" disabled>{t('pickupTimePlaceholder')}</option>
                                            <option value="09:00">09:00 AM</option>
                                            <option value="10:00">10:00 AM</option>
                                            <option value="11:00">11:00 AM</option>
                                            <option value="12:00">12:00 PM</option>
                                            <option value="13:00">01:00 PM</option>
                                            <option value="14:00">02:00 PM</option>
                                            <option value="15:00">03:00 PM</option>
                                            <option value="16:00">04:00 PM</option>
                                        </select>
                                    </div>
                                </div>

                                {timeError && (
                                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs font-bold border border-red-200 flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
                                        <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                                        <span>{timeError}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 shrink-0">
                            <button onClick={() => setIsPickupModalOpen(false)} className="px-4 py-2 text-gray-600 font-bold text-sm hover:bg-gray-200 rounded-lg transition-colors">
                                {t('pickupCancel')}
                            </button>
                            <button 
                                onClick={handleConfirmPickup} 
                                disabled={isProcessing || selectedIds.length === 0}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold text-sm shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isProcessing ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                                {isProcessing ? t('pickupProcessing') : t('pickupConfirm')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}