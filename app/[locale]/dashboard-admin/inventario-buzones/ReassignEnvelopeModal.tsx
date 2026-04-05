"use client";

import React, { useState, useTransition } from 'react';
import { X, RefreshCw, AlertTriangle, Search, CheckCircle2, Loader2 } from 'lucide-react';
import { reassignEnvelope } from './reassignAction';

export default function ReassignEnvelopeModal({ 
    mailItemId, 
    imageUrl, 
    isExpired,
    currentName,
    currentSuite
}: { 
    mailItemId: string, 
    imageUrl: string, 
    isExpired: boolean,
    currentName: string,
    currentSuite: string
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [newSuite, setNewSuite] = useState('');
    const [message, setMessage] = useState<{type: 'error' | 'success', text: string} | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleReassign = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSuite) return;
        
        setMessage(null);
        startTransition(async () => {
            const res = await reassignEnvelope(mailItemId, newSuite);
            if (res.success) {
                setMessage({ type: 'success', text: '¡Reasignado con éxito!' });
                setTimeout(() => {
                    setIsOpen(false);
                    setMessage(null);
                    setNewSuite('');
                }, 2000);
            } else {
                setMessage({ type: 'error', text: res.error || 'Ocurrió un error' });
            }
        });
    };

    return (
        <>
            {/* 1. LA FOTITO PEQUEÑA QUE REEMPLAZARÁ LA ACTUAL */}
            <div 
                onClick={() => setIsOpen(true)}
                className="w-10 h-10 rounded border border-gray-200 overflow-hidden shrink-0 relative cursor-pointer hover:ring-2 hover:ring-blue-500 hover:scale-105 transition-all shadow-sm"
                title="Ver imagen y reasignar"
            >
                <img src={imageUrl} alt="Sobre" className="w-full h-full object-cover" />
                {isExpired && <div className="absolute inset-0 bg-red-500/20 border-2 border-red-500 rounded pointer-events-none"></div>}
            </div>

            {/* 2. LA VENTANA EMERGENTE (MODAL) */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col md:flex-row shadow-2xl relative">
                        
                        {/* Botón cerrar móvil */}
                        <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 bg-gray-100 p-2 rounded-full md:hidden z-10">
                            <X size={20} className="text-gray-600" />
                        </button>

                        {/* Lado Izquierdo: Imagen Grande */}
                        <div className="w-full md:w-3/5 bg-slate-100 flex items-center justify-center p-4 min-h-[300px]">
                            <img src={imageUrl} alt="Documento" className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-sm border border-slate-200" />
                        </div>

                        {/* Lado Derecho: Controles de Reasignación */}
                        <div className="w-full md:w-2/5 p-6 md:p-8 flex flex-col bg-white">
                            <div className="hidden md:flex justify-end mb-2">
                                <button onClick={() => setIsOpen(false)} className="bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-colors">
                                    <X size={20} className="text-slate-600" />
                                </button>
                            </div>

                            <h2 className="text-2xl font-black text-gray-900 mb-6">Detalles del Sobre</h2>

                            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl mb-8 shadow-inner">
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Cliente Actual</p>
                                <p className="font-bold text-gray-900 text-lg truncate">{currentName}</p>
                                <p className="text-blue-600 font-black">Suite #{currentSuite}</p>
                            </div>

                            <div className="border-t border-gray-100 pt-8 mt-auto">
                                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <RefreshCw size={18} className="text-orange-500" /> 
                                    ¿Error? Asignar a otra Suite
                                </h3>
                                
                                <form onSubmit={handleReassign} className="space-y-4">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input 
                                            type="text" 
                                            value={newSuite}
                                            onChange={(e) => setNewSuite(e.target.value)}
                                            placeholder="Ej: 44897" 
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none focus:border-orange-400 focus:bg-white uppercase transition-colors"
                                            required
                                        />
                                    </div>

                                    {message && (
                                        <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                            {message.type === 'success' ? <CheckCircle2 size={16} className="shrink-0"/> : <AlertTriangle size={16} className="shrink-0"/>}
                                            {message.text}
                                        </div>
                                    )}

                                    <button 
                                        type="submit" 
                                        disabled={isPending || !newSuite}
                                        className="w-full bg-slate-900 hover:bg-black text-white font-bold py-3 rounded-xl transition-colors disabled:bg-gray-300 flex justify-center items-center gap-2"
                                    >
                                        {isPending ? <Loader2 className="animate-spin" size={18} /> : 'Reasignar Sobre'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}