import AccountContent from "./AccountContent";

// 👇 VACUNA INFALIBLE: Esto obliga a Next.js a no construir esta página estáticamente
export const dynamic = "force-dynamic";

export default function AccountSettingsPage() {
  return <AccountContent />;
}



