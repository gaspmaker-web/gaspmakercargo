"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ALL_COUNTRIES, Country } from '@/lib/countries';
import { useTranslations } from 'next-intl';

export default function RegisterClient() {
    const t = useTranslations('RegisterPage');
    const router = useRouter(); 
    
    // Lista de meses traducida
    const months = [
        t('months.1'), t('months.2'), t('months.3'), t('months.4'), 
        t('months.5'), t('months.6'), t('months.7'), t('months.8'), 
        t('months.9'), t('months.10'), t('months.11'), t('months.12')
    ];

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [emailConfirm, setEmailConfirm] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    
    // 1. Inicialización del país por defecto (USA)
    const [selectedCountry, setSelectedCountry] = useState<Country | undefined>(
        ALL_COUNTRIES.find(c => c.code === 'us')
    );
    
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [dobDay, setDobDay] = useState('');
    const [dobMonth, setDobMonth] = useState('');
    const [dobYear, setDobYear] = useState('');
    
    const sortedCountries = useMemo(() => {
        return [...ALL_COUNTRIES].sort((a, b) => a.name.localeCompare(b.name));
    }, []);

    const currentYear = new Date().getFullYear();
    const minYear = currentYear - 100;
    const maxYear = currentYear - 18;

    const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const countryCode = e.target.value;
        const country = ALL_COUNTRIES.find(c => c.code === countryCode);
        setSelectedCountry(country);
    };

    // Fallback para el código de área si no está definido
    const displayDialCode = selectedCountry?.dial_code || '+1';

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (email !== emailConfirm) {
            alert(t('alertEmailMismatch'));
            return;
        }
        if (password !== passwordConfirm) {
            alert(t('alertPasswordMismatch'));
            return;
        }
        
        if (!selectedCountry) {
            alert(t('alertSelectCountry'));
            return;
        }

        if (!phoneNumber.trim()) {
            alert(t('alertEnterPhone'));
            return;
        }
        
        if (!dobDay || !dobMonth || !dobYear) {
            alert(t('alertSelectDob'));
            return;
        }

        // 2. CONSTRUCCIÓN DE LA FECHA SEGURA (ISO 8601)
        const formattedYear = dobYear;
        const formattedMonth = String(dobMonth).padStart(2, '0');
        const formattedDay = String(dobDay).padStart(2, '0');
        
        const isoDateOfBirth = `${formattedYear}-${formattedMonth}-${formattedDay}T00:00:00.000Z`;

        const fullPhoneNumber = `${displayDialCode} ${phoneNumber}`;

        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/register', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                name: `${firstName} ${lastName}`,
                email: email,
                password: password,
                countryCode: selectedCountry.code, 
                phone: fullPhoneNumber,
                dateOfBirth: isoDateOfBirth 
              }),
            });
    
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.message || 'Algo salió mal durante el registro');
            }
    
            // 🔥 CAMBIO REALIZADO:
            // Eliminamos la línea: alert(t('alertSuccess'));
            // Ahora la redirección es limpia e inmediata.
            router.push('/login-cliente');
    
        } catch (error: any) {
            console.error(error);
            alert(`${t('alertError')} ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <main className="min-h-screen py-12 px-4">
            <div className="container max-w-2xl mx-auto bg-white p-6 md:p-8 rounded-xl shadow-2xl text-gasp-maker-dark-gray">
                
                <h1 className="text-center font-garamond text-4xl mb-2">{t('title')}</h1>
                <p className="text-center text-gray-600 mb-8">{t('subtitle')}</p>

                <form onSubmit={handleFormSubmit}>
                    
                    <div className="mb-4">
                        <label htmlFor="country-select" className="sr-only">{t('selectCountry')}</label>
                        <div className="relative">
                            <span className={`fi fi-${selectedCountry?.code?.toLowerCase()} absolute left-3 top-1/2 -translate-y-1/2 text-xl`}></span>
                            <select 
                                id="country-select" 
                                name="country" 
                                required
                                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-gasp-maker-gold focus:border-gasp-maker-gold appearance-none"
                                value={selectedCountry?.code || ''}
                                onChange={handleCountryChange}
                                disabled={isLoading}
                            >
                                <option value="" disabled>{t('selectCountry')}</option>
                                {sortedCountries.map((country) => (
                                    <option key={country.code} value={country.code}>{country.name}</option>
                                ))}
                            </select>
                            <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"></i>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <input type="text" id="first-name" name="first-name" placeholder={t('placeholderName')} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-gasp-maker-gold focus:border-gasp-maker-gold" value={firstName} onChange={(e) => setFirstName(e.target.value)} disabled={isLoading} />
                        <input type="text" id="last-name" name="last-name" placeholder={t('placeholderLastName')} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-gasp-maker-gold focus:border-gasp-maker-gold" value={lastName} onChange={(e) => setLastName(e.target.value)} disabled={isLoading} />
                    </div>

                    <div className="mb-4">
                        <label htmlFor="phone-number" className="sr-only">{t('placeholderPhone')}</label>
                        <div className="flex border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-gasp-maker-gold focus-within:border-gasp-maker-gold">
                            <span className="flex items-center px-3 py-3 bg-gray-100 text-gray-600 border-r border-gray-300">
                                <span className={`fi fi-${selectedCountry?.code?.toLowerCase()} mr-2 text-lg`}></span>
                                <span className="font-semibold">{displayDialCode}</span>
                            </span>
                            <input 
                                type="tel" 
                                id="phone-number" 
                                name="phone-number" 
                                placeholder={t('placeholderPhone')}
                                required
                                className="flex-1 px-4 py-3 bg-white focus:outline-none"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <input type="email" id="email" name="email" placeholder={t('placeholderEmail')} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-gasp-maker-gold focus:border-gasp-maker-gold mb-4" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} />
                    <input type="email" id="email-confirm" name="email-confirm" placeholder={t('placeholderEmailConfirm')} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-gasp-maker-gold focus:border-gasp-maker-gold mb-4" value={emailConfirm} onChange={(e) => setEmailConfirm(e.target.value)} disabled={isLoading} />
                    <input type="password" id="password" name="password" placeholder={t('placeholderPassword')} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-gasp-maker-gold focus:border-gasp-maker-gold mb-4" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} />
                    <input type="password" id="password-confirm" name="password-confirm" placeholder={t('placeholderPasswordConfirm')} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-gasp-maker-gold focus:border-gasp-maker-gold mb-4" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} disabled={isLoading} />

                    <div className="mb-6">
                        <p className="text-sm text-gray-600 mb-2">{t('ageWarning')}</p>
                        <div className="grid grid-cols-3 gap-2">
                            <select 
                                id="dob-day" 
                                name="dob-day" 
                                required 
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-gasp-maker-gold focus:border-gasp-maker-gold appearance-none" 
                                disabled={isLoading}
                                value={dobDay} 
                                onChange={(e) => setDobDay(e.target.value)} 
                            >
                                <option value="">{t('labelDay')}</option>
                                {Array.from({length: 31}, (_, i) => i + 1).map(day => <option key={day} value={day}>{day}</option>)}
                            </select>
                            <select 
                                id="dob-month" 
                                name="dob-month" 
                                required 
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-gasp-maker-gold focus:border-gasp-maker-gold appearance-none" 
                                disabled={isLoading}
                                value={dobMonth} 
                                onChange={(e) => setDobMonth(e.target.value)} 
                            >
                                <option value="">{t('labelMonth')}</option>
                                {/* VALUE NUMÉRICO: Enero = 1, Febrero = 2, etc. */}
                                {months.map((month, i) => <option key={i+1} value={i+1}>{month}</option>)}
                            </select>
                            <select 
                                id="dob-year" 
                                name="dob-year" 
                                required 
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-gasp-maker-gold focus:border-gasp-maker-gold appearance-none" 
                                disabled={isLoading}
                                value={dobYear} 
                                onChange={(e) => setDobYear(e.target.value)} 
                            >
                                <option value="">{t('labelYear')}</option>
                                {Array.from({length: maxYear - minYear + 1}, (_, i) => maxYear - i).map(year => <option key={year} value={year}>{year}</option>)}
                            </select>
                        </div>
                    </div>
                    
                    <div className="flex items-center mb-2">
                        <input type="checkbox" id="terms" name="terms" required className="h-4 w-4 text-gasp-maker-gold border-gray-300 rounded" disabled={isLoading} />
                        <label htmlFor="terms" className="ml-2 text-sm text-gray-600">
                            {t('termsText')} <Link href="/terms-of-service" className="text-gasp-maker-gold hover:underline">{t('termsLink')}</Link>
                        </label>
                    </div>
                    <div className="flex items-center mb-6">
                        <input type="checkbox" id="subscribe" name="subscribe" className="h-4 w-4 text-gasp-maker-gold border-gray-300 rounded" disabled={isLoading} />
                        <label htmlFor="subscribe" className="ml-2 text-sm text-gray-600">
                            {t('subscribeText')}
                        </label>
                    </div>

                    <button 
                        type="submit" 
                        className="w-full py-3 bg-gasp-maker-gold text-white font-bold rounded-lg hover:bg-gasp-maker-light-beige hover:text-gasp-maker-dark-gray transition-colors text-lg disabled:opacity-50"
                        disabled={isLoading}
                    >
                        {isLoading ? t('btnRegistering') : t('btnRegister')}
                    </button>
                </form>

                <p className="text-center text-sm mt-4 text-gray-600">
                    {t('alreadyAccount')} <Link href="/login-cliente" className="text-gasp-maker-gold hover:underline">{t('loginLink')}</Link>
                </p>
            </div>
        </main>
    );
}