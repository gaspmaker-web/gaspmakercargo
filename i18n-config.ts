export const i18n = {
  defaultLocale: 'es',
  locales: ['es', 'en', 'fr', 'pt'],
  localePrefix: 'as-needed'
} as const;

export type Locale = (typeof i18n)['locales'][number];