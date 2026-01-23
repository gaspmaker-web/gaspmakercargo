"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, getSession } from "next-auth/react"; 
import { useLocale, useTranslations } from "next-intl";

// --- LÓGICA MAESTRA DE IDIOMAS ---
const getLocaleFromCountry = (countryCode: string) => {
    const code = countryCode.toLowerCase();
    
    // 1. Grupo ESPAÑOL
    const esCountries = ['es', 'mx', 'co', 'ar', 'pe', 've', 'cl', 'ec', 'gt', 'cu', 'bo', 'do', 'hn', 'py', 'sv', 'ni', 'cr', 'pa', 'uy', 'gq'];
    
    // 2. Grupo PORTUGUÉS
    const ptCountries = ['pt', 'br', 'ao', 'mz', 'gw', 'cv', 'st', 'tl'];
    
    // 3. Grupo FRANCÉS
    const frCountries = ['fr', 'ht', 'sn', 'ml', 'cd', 'be', 'ch', 'mc'];

    // REGLAS DE NEGOCIO:
    if (esCountries.includes(code)) return 'es';
    if (ptCountries.includes(code)) return 'pt';
    if (frCountries.includes(code)) return 'fr';

    // 4. DEFAULT GLOBAL (Inglés)
    return 'en'; 
};

export default function LoginClient() {
  const router = useRouter();
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

    try {
      // 1. Autenticación
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.ok) {
        const session = await getSession();
        
        // 2. DETECCIÓN DE PAÍS -> IDIOMA
        let targetLocale = locale; 
        
        // 🚨 CORRECCIÓN: Usamos (as any) porque TypeScript base no conoce 'countryCode'
        if ((session?.user as any)?.countryCode) {
            targetLocale = getLocaleFromCountry((session!.user as any).countryCode);
        }
        
        // 3. REDIRECCIÓN FINAL
        // También aseguramos el rol con (as any) para evitar futuros errores
        const userRole = (session?.user as any)?.role;

        if (userRole === "ADMIN" || userRole === "WAREHOUSE") {
            router.push(`/${targetLocale}/dashboard-admin`);
        } else {
            router.push(`/${targetLocale}/dashboard-cliente`);
        }
        
        router.refresh();
      } else {
        setError(t("errors.invalidCredentials") || "Correo o contraseña incorrectos.");
        setIsLoading(false);
      }
    } catch (err) {
      console.error("SignIn error:", err);
      setError(t("errors.unexpected") || "Error al iniciar sesión.");
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen py-12 px-4 flex items-start justify-center">
      <div className="container max-w-md mx-auto bg-white p-6 md:p-8 rounded-xl shadow-2xl text-gasp-maker-dark-gray">
        <h1 className="text-center font-garamond text-4xl mb-2">{t("title") ?? "Acceso de Cliente"}</h1>
        <p className="text-center text-gray-600 mb-8">{t("subtitle") ?? "Por favor, ingresa tus credenciales."}</p>

        {error && <p role="alert" className="text-red-500 text-center mb-4">{error}</p>}

        <form onSubmit={handleFormSubmit}>
          <label className="sr-only" htmlFor="email">{t("emailLabel") ?? "Correo Electrónico"}</label>
          <input
            id="email"
            type="email"
            placeholder={t("emailPlaceholder") ?? "Correo Electrónico"}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!error}
          />

          <label className="sr-only" htmlFor="password">{t("passwordLabel") ?? "Contraseña"}</label>
          <input
            id="password"
            type="password"
            placeholder={t("passwordPlaceholder") ?? "Contraseña"}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={!!error}
          />

          <p className="text-right -mt-2 mb-4">
            <Link href={`/${locale}/recuperar-contrasena`} className="text-gmc-dorado-principal hover:underline text-sm">
              {t("forgotPassword") ?? "¿Olvidaste tu contraseña?"}
            </Link>
          </p>

          <button
            type="submit"
            disabled={isLoading}
            aria-busy={isLoading}
            className="w-full py-3 bg-gmc-dorado-principal text-white font-bold rounded-lg disabled:opacity-60"
          >
            {isLoading ? (t("loading") ?? "Cargando...") : (t("submit") ?? "Iniciar Sesión")}
          </button>
        </form>

        <p className="text-center text-sm mt-6">
          {t("noAccount") ?? "¿No tienes cuenta?"}{" "}
          <Link href={`/${locale}/registro-cliente`} className="text-gmc-dorado-principal hover:underline">
            {t("registerHere") ?? "Regístrate aquí."}
          </Link>
        </p>
      </div>
    </main>
  );
}