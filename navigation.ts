import { createNavigation } from 'next-intl/navigation'; // <--- CAMBIO DE NOMBRE
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['es', 'en', 'fr', 'pt'],
  defaultLocale: 'es',
  localePrefix: 'as-needed'
});

// Creamos los componentes de navegación basados en esa configuración
export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);