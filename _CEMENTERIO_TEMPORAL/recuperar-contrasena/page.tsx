"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';

export default function RecoverPasswordPage() {
  const t = useTranslations('RecoverPassword');
  
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState(""); // Nuevo estado para errores

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setErrorMessage(""); // Limpiar errores previos

    try {
        // 🚀 AHORA SÍ: LLAMADA REAL A LA API
        const response = await fetch('/api/auth/recover', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }) 
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Error al enviar la solicitud');
        }

        // Si todo salió bien, mostramos la pantalla de éxito
        setIsSubmitted(true);

    } catch (error) {
        console.error("Error enviando correo", error);
        setErrorMessage("Hubo un problema al enviar el correo. Verifica que la dirección sea correcta o intenta más tarde.");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4 font-montserrat">
      
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        
        {/* LOGO O ICONO HEADER */}
        <div className="flex justify-center mb-6">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${isSubmitted ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                {isSubmitted ? <CheckCircle size={32} /> : <Mail size={32} />}
            </div>
        </div>

        {/* --- ESTADO: ÉXITO (CORREO ENVIADO) --- */}
        {isSubmitted ? (
            <div className="text-center animate-in fade-in zoom-in duration-300">
                <h2 className="text-2xl font-bold text-gray-800 mb-3 font-garamond">
                    {t('successTitle')}
                </h2>
                <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                    {t('successMessage')}
                </p>
                
                <Link 
                    href="/login-cliente" 
                    className="block w-full py-3 px-4 bg-gray-800 text-white rounded-xl font-bold text-sm hover:bg-gray-900 transition-colors shadow-lg"
                >
                    {t('backToLogin')}
                </Link>
            </div>
        ) : (
            /* --- ESTADO: FORMULARIO --- */
            <div className="animate-in fade-in duration-300">
                <div className="text-center mb-8">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2 font-garamond">
                        {t('title')}
                    </h1>
                    <p className="text-gray-500 text-sm">
                        {t('subtitle')}
                    </p>
                </div>

                {/* Mensaje de Error si falla la API */}
                {errorMessage && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-lg text-center font-medium">
                        {errorMessage}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">
                            {t('emailLabel')}
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-3.5 text-gray-400" size={20} />
                            <input 
                                type="email" 
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder={t('emailPlaceholder')}
                                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={isLoading || !email}
                        className="w-full bg-gmc-dorado-principal hover:bg-yellow-500 text-gray-900 py-3.5 rounded-xl font-bold text-sm shadow-md transition-all transform hover:scale-[1.02] flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="animate-spin" size={18} />
                                {t('loading')}
                            </>
                        ) : (
                            t('submit')
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <Link 
                        href="/login-cliente" 
                        className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <ArrowLeft size={16} />
                        {t('backToLogin')}
                    </Link>
                </div>
            </div>
        )}

      </div>
      
      {/* Footer simple */}
      <p className="mt-8 text-xs text-gray-400">
        © 2026 GaspMakerCargo. Security & Privacy.
      </p>
    </div>
  );
}