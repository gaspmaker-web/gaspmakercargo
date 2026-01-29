"use client";

import React, { useState } from "react";
import Link from "next/link";
import { signIn, getSession } from "next-auth/react"; 
import { useLocale, useTranslations } from "next-intl";

// 1. ✅ HE RESTAURADO TU LÓGICA DE PAÍSES (INTACTA)
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

export default function LoginClient() {
  const locale = useLocale(); 
  const t = useTranslations("LoginPage"); 

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    console.log("🚀 [LOGIN] Iniciando autenticación...");

    try {
      // Intento de Login
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.ok) {
        console.log("✅ [LOGIN] Credenciales válidas. Analizando sesión...");
        
        // 2. ✅ ESTRATEGIA MIXTA: INTENTAR LEER ROL, SINO RECARGAR
        // Intentamos obtener la sesión actualizada
        let session = await getSession();
        
        // Pequeño retardo táctico para dar tiempo a la cookie (500ms)
        if (!session?.user) {
             await new Promise(r => setTimeout(r, 500));
             session = await getSession();
        }

        const user = session?.user as any;
        const userRole = user?.role?.toUpperCase(); 
        const countryCode = user?.countryCode;

        // Si logramos leer el usuario, aplicamos TU lógica de idiomas
        if (userRole) {
            let targetLocale = locale; 
            // 3. ✅ APLICAMOS TU LÓGICA DE IDIOMA POR PAÍS
            if (countryCode) {
                targetLocale = getLocaleFromCountry(countryCode);
            }

            console.log(`👤 [LOGIN] Rol: ${userRole} | País: ${countryCode} -> Idioma: ${targetLocale}`);

            if (userRole === "ADMIN" || userRole === "WAREHOUSE") {
                window.location.href = `/${targetLocale}/dashboard-admin`;
            } 
            else if (userRole === "DRIVER") { 
                window.location.href = `/${targetLocale}/dashboard-driver`;
            } 
            else {
                // Cliente por defecto
                window.location.href = `/${targetLocale}/dashboard-cliente`;
            }
        } else {
            // 4. 🛡️ FALLBACK (PLAN B): 
            // Si next-auth tarda en darnos la sesión, hacemos reload.
            // El Middleware (auth.config.ts) se encargará de redirigir (aunque quizás sin el cambio de idioma).
            console.warn("⚠️ [LOGIN] Sesión lenta. Forzando recarga segura.");
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

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gmc-dorado-principal text-white font-bold rounded-lg disabled:opacity-50 hover:bg-opacity-90 transition-all flex justify-center items-center gap-2"
          >
            {isLoading ? (
                <>
                 <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                 <span>Procesando...</span>
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