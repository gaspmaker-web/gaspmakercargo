import AccountContent from "./AccountContent";
// 👇 Importamos esta función especial para arreglar el conflicto de build con [locale]
import { unstable_setRequestLocale } from 'next-intl/server';

// Forzamos modo dinámico
export const dynamic = "force-dynamic";

// 👇 Recibimos 'params' con el locale (es OBLIGATORIO en carpetas [locale])
export default function AccountSettingsPage({ params: { locale } }: { params: { locale: string } }) {
  
  // 👇 VACUNA FINAL: Le decimos a next-intl "Oye, usa este idioma y no molestes en el Build"
  unstable_setRequestLocale(locale); 
  
  return <AccountContent />;
}


