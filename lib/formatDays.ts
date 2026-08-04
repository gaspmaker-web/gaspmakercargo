// lib/formatDays.ts
// Traduce códigos de días o días numéricos

const DAY_CODES = ['same_day', 'next_day', '2_3_days', '3_5_days', '5_7_days', '7_14_days', '14_21_days', '15_21_days'];

export function isDayCode(days: string): boolean {
  return DAY_CODES.includes(days);
}

export function formatDays(days: string, t: (key: string, opts?: any) => string): string {
  if (!days) return '';
  
  // Código predefinido traducible
  if (isDayCode(days)) return t(days);
  
  // ✅ Rango con customs — traducir la parte "(incl. customs)"
  if (days.includes('incl.')) {
    return days.replace('incl. customs', t('inclCustoms'));
  }

  // Rango simple sin customs (ej: "5-7 days")
  if (days.includes('-')) return days;

  // Días numéricos simples de EasyPost
  const match = days.match(/^(\d+)/);
  if (match) {
    const count = parseInt(match[1]);
    return `${count} ${count === 1 ? t('day') : t('days')}`;
  }
  
  return days;
}