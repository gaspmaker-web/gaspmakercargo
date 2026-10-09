"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { signIn, getSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { Fingerprint } from "lucide-react";

const getLocaleFromCountry = (countryCode: string) => {
    const code = countryCode?.toLowerCase() || 'us';
    const esCountries = ['es', 'mx', 'co', 'ar', 'pe', 've', 'cl', 'ec', 'gt', 'cu', 'bo', 'do', 'hn', 'py', 'sv', 'ni', 'cr', 'pa', 'uy', 'gq'];
    const ptCountries = ['pt', 'br', 'ao', 'mz', 'gw', 'cv', 'st', 'tl'];
    const frCountries = ['fr', 'ht', 'sn', 'ml', 'cd', 'be', 'ch', 'mc'];
    if (esCountries.includes(code)) return 'es';
    if (ptCountries.includes(code)) return 'pt';
    if (frCountries.includes(code)) return 'fr';
    return 'en';
};

// Redirige según rol
const redirectByRole = (userRole: string, countryCode: string, locale: string) => {
    const targetLocale = countryCode ? getLocaleFromCountry(countryCode) : locale;
    if (userRole === "ADMIN" || userRole === "WAREHOUSE") {
        window.location.href = `/${targetLocale}/dashboard-admin`;
    } else if (userRole === "DRIVER") {
        window.location.href = `/${targetLocale}/dashboard-driver`;
    } else {
        window.location.href = `/${targetLocale}/dashboard-cliente`;
    }
};

export default function LoginClient() {
  const locale = useLocale();
  const t = useTranslations("LoginPage");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  // Detecta si biometría está disponible en la app nativa
  useEffect(() => {
    const checkBiometric = async () => {
      try {
        if (typeof window === 'undefined') return;
        const { Capacitor } = await import('@capacitor/core');
        if (!Capacitor.isNativePlatform()) return;
        const { BiometricAuth } = await import('@aparajita/capacitor-biometric-auth');
        const info = await BiometricAuth.checkBiometry();
        // Solo mostramos si hay biometría disponible Y hay credenciales guardadas
        const savedEmail = localStorage.getItem('biometric_email');
        if (info.isAvailable && savedEmail) {
          setBiometricAvailable(true);
          setEmail(savedEmail);
        }
      } catch {
        // No es nativo o no tiene biometría
      }
    };
    checkBiometric();
  }, []);

  const handleBiometricLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { BiometricAuth } = await import('@aparajita/capacitor-biometric-auth');
      await BiometricAuth.authenticate({ reason: 'Verify your identity to log in' });

      // Biometría aprobada — recuperamos credenciales guardadas
      const savedEmail = localStorage.getItem('biometric_email');
      const savedPassword = localStorage.getItem('biometric_password');
      if (!savedEmail || !savedPassword) {
        setError('No saved credentials. Please log in with password first.');
        setIsLoading(false);
        return;
      }

      const result = await signIn("credentials", {
        email: savedEmail,
        password: savedPassword,
        redirect: false,
      });

      if (result?.ok) {
        let session = await getSession();
        if (!session?.user) {
          await new Promise(r => setTimeout(r, 500));
          session = await getSession();
        }
        const user = session?.user as any;
        if (user?.role) {
          redirectByRole(user.role.toUpperCase(), user.countryCode, locale);
        } else {
          window.location.reload();
        }
      } else {
        setError('Biometric login failed. Please use password.');
        setIsLoading(false);
      }
    } catch {
      // Usuario canceló biometría
      setIsLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.ok) {
        let session = await getSession();
        if (!session?.user) {
          await new Promise(r => setTimeout(r, 500));
          session = await getSession();
        }

        const user = session?.user as any;
        const userRole = user?.role?.toUpperCase();
        const countryCode = user?.countryCode;

        if (userRole) {
          // Guardamos credenciales para biometría futura (solo en nativo)
          try {
            const { Capacitor } = await import('@capacitor/core');
            if (Capacitor.isNativePlatform()) {
              localStorage.setItem('biometric_email', email);
              localStorage.setItem('biometric_password', password);
            }
          } catch {}

          redirectByRole(userRole, countryCode, locale);
        } else {
          window.location.reload();
        }
      } else {
        setError(t("errors.invalidCredentials") || "Credenciales inválidas.");
        setIsLoading(false);
      }
    } catch (err) {
      console.error(err);
      setError(t("errors.unexpected") || "Error inesperado.");
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen py-12 px-4 flex items-start justify-center">
      <div className="container max-w-md mx-auto bg-white p-6 md:p-8 rounded-xl shadow-2xl text-gasp-maker-dark-gray">
        <h1 className="text-center font-garamond text-4xl mb-2">{t("title") ?? "Acceso"}</h1>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm font-bold text-center">
            {error}
          </div>
        )}

        {/* Botón biometría — solo aparece en app nativa con credenciales guardadas */}
        {biometricAvailable && (
          <button
            type="button"
            onClick={handleBiometricLogin}
            disabled={isLoading}
            className="w-full mb-6 py-4 bg-[#1e2330] text-white font-bold rounded-xl flex items-center justify-center gap-3 shadow-lg active:scale-[0.98] transition disabled:opacity-50"
          >
            <Fingerprint size={24} className="text-[#E4B349]"/>
            <span>Log in with Biometrics</span>
          </button>
        )}

        <form onSubmit={handleFormSubmit}>
          <input
            type="email"
            placeholder={t("emailPlaceholder") ?? "Email"}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-gmc-dorado-principal outline-none"
            value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading}
          />
          <input
            type="password"
            placeholder={t("passwordPlaceholder") ?? "Password"}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-gmc-dorado-principal outline-none"
            value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading}
          />

          <div className="flex justify-end w-full -mt-2 mb-6">
            <Link
              href="/recuperar-contrasena"
              className="text-xs font-medium text-gray-500 hover:text-[#D4AF37] transition-colors"
            >
              {t("forgotPassword") ?? "¿Olvidaste tu contraseña?"}
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gmc-dorado-principal text-white font-bold rounded-lg disabled:opacity-50 hover:bg-opacity-90 transition-all flex justify-center items-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                <span>{t('processing') || 'Processing...'}</span>
              </>
            ) : (t("submit") ?? "Ingresar")}
          </button>
        </form>

        <p className="text-center text-sm mt-6">
          <Link href={`/${locale}/registro-cliente`} className="text-gmc-dorado-principal hover:underline font-bold">
            {t("registerHere") ?? "Crear Cuenta"}
          </Link>
        </p>
      </div>
    </main>
  );
}