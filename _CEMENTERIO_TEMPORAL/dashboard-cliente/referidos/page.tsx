import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import ReferralClient from '@/components/dashboard/ReferralClient';
import { headers } from 'next/headers'; // 1. Importamos headers

// Helper para generar un string aleatorio corto para garantizar unicidad
const generateRandomString = (length: number) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

export const metadata = {
  title: 'Gana $25 USD - Programa de Referidos | Gasp Maker Cargo',
};

// 🔥 RECIBIMOS PARAMS PARA EL IDIOMA
export default async function ReferralPage({ params }: { params: { locale: string } }) {
  const session = await auth();

  if (!session?.user) {
    redirect(`/${params.locale}/login-cliente`);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      referralCode: true,
      walletBalance: true, // 🔥 USAMOS EL NUEVO CAMPO DE BILLETERA
      suiteNo: true
    }
  });

  if (!user) redirect(`/${params.locale}/login-cliente`);

  let finalReferralCode = user.referralCode;

  // Si no tiene código, generamos uno nuevo con ALTA probabilidad de ser único
  if (!finalReferralCode) {
    // 1. Primera parte: Primer nombre limpio
    const cleanName = user.name?.split(' ')[0].toUpperCase().replace(/[^A-Z0-9]/g, '') || 'USER';
    
    // 2. Segunda parte: Número de suite (o fallback)
    const suitePart = user.suiteNo ? user.suiteNo.split('-')[1] || user.suiteNo.replace(/[^0-9]/g, '') : 'GMC';
    
    // 3. Tercera parte: Sufijo aleatorio de 4 caracteres (CLAVE PARA UNICIDAD)
    const randomSuffix = generateRandomString(4);

    // Código final: EJ: GERARDO-71475-X9Y2
    finalReferralCode = `${cleanName}-${suitePart}-${randomSuffix}`;

    // Guardamos el nuevo código
    try {
        await prisma.user.update({
            where: { id: session.user.id },
            data: { referralCode: finalReferralCode }
        });
    } catch (error) {
        console.error("Error crítico generando código de referido:", error);
        throw error; 
    }
  }

  // 🌍 GENERAR EL LINK AUTOMÁTICO (Servidor)
  // 2. Obtenemos el 'host' real (ej: gaspmakercargo.com) de la petición
  const headersList = headers();
  const host = headersList.get('host') || 'localhost:3000';
  
  // 3. Determinamos si es http o https (en producción suele ser https)
  // Nota: Si usas Vercel, x-forwarded-proto suele ser fiable, si no, asumimos https en producción
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  
  // 4. Construimos el link dinámico
  const referralLink = `${protocol}://${host}/${params.locale}/registro-cliente?ref=${finalReferralCode}`;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 font-montserrat">
       
       {/* Pasamos los datos listos al componente visual */}
       <ReferralClient 
          referralCode={finalReferralCode || 'ERROR'} 
          walletBalance={user.walletBalance || 0} 
          referralLink={referralLink}
       />
    </div>
  );
}