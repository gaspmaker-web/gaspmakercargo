"use client";

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Lock, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';
import { useTranslations } from 'next-intl'; // 🔥 Importamos el hook multilingüe

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token'); 
    
    // 🔥 Activamos el diccionario para esta pantalla
    const t = useTranslations('ResetPassword'); 

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!token) {
            setError(t('errorToken')); // 🔥 Error traducido
            return;
        }

        if (password !== confirmPassword) {
            setError(t('errorMismatch')); // 🔥 Error traducido
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch('/api/auth/reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Error");
            }

            setIsSuccess(true);
            
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="text-center animate-in fade-in zoom-in duration-300">
                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                        <CheckCircle size={32} />
                    </div>
                </div>
                {/* 🔥 Textos de éxito dinámicos */}
                <h2 className="text-2xl font-bold text-gray-800 mb-3 font-garamond">{t('successTitle')}</h2>
                <p className="text-gray-500 text-sm mb-8">{t('successMessage')}</p>
                <Link href="/login-cliente" className="block w-full py-3 px-4 bg-yellow-400 text-black rounded-xl font-bold text-sm shadow-lg hover:bg-yellow-500 transition-colors">
                    {t('backToLogin')}
                </Link>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-300">
            <div className="text-center mb-8">
                {/* 🔥 Textos de título dinámicos */}
                <h1 className="text-2xl font-bold text-gray-800 mb-2 font-garamond">{t('title')}</h1>
                <p className="text-gray-500 text-sm">{t('subtitle')}</p>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-lg font-bold text-center">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    {/* 🔥 Label dinámico */}
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">{t('passwordLabel')}</label>
                    <div className="relative">
                        <Lock className="absolute left-4 top-3.5 text-gray-400" size={18} />
                        <input 
                            type={showPassword ? "text" : "password"} 
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            minLength={6}
                            className="w-full pl-12 pr-12 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600">
                            {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                        </button>
                    </div>
                </div>

                <div>
                    {/* 🔥 Label dinámico */}
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">{t('confirmPasswordLabel')}</label>
                    <div className="relative">
                        <Lock className="absolute left-4 top-3.5 text-gray-400" size={18} />
                        <input 
                            type={showPassword ? "text" : "password"} 
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>

                <button 
                    type="submit" 
                    disabled={isLoading || !password || !confirmPassword}
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3.5 rounded-xl font-bold text-sm shadow-md flex justify-center items-center gap-2 disabled:opacity-50"
                >
                    {/* 🔥 Botón de submit dinámico */}
                    {isLoading ? <Loader2 className="animate-spin" size={18} /> : t('submit')}
                </button>
            </form>
        </div>
    );
}

export default function ResetClient() {
  const t = useTranslations('ResetPassword'); // 🔥 Lo usamos para el estado de carga también

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4 font-montserrat">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <Suspense fallback={<div className="text-center p-10 font-bold text-gray-500">{t('loading')}</div>}>
            <ResetPasswordForm />
        </Suspense>
      </div>
      <p className="mt-8 text-xs text-gray-400">© 2026 GaspMakerCargo. Security & Privacy.</p>
    </div>
  );
}