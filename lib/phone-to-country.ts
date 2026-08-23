/**
 * Detecta el país de un número de teléfono internacional
 * basado en los países soportados por Gasp Maker Cargo
 */
export function getCountryFromPhone(phone: string): string {
  const p = phone.replace(/\s+/g, '').trim();

  // Caribe - códigos específicos +1XXX
  if (p.startsWith('+1868')) return 'TT'; // Trinidad & Tobago
  if (p.startsWith('+1784')) return 'VC'; // San Vicente
  if (p.startsWith('+1246')) return 'BB'; // Barbados
  if (p.startsWith('+1767')) return 'DM'; // Dominica
  if (p.startsWith('+1473')) return 'GD'; // Granada
  if (p.startsWith('+1758')) return 'LC'; // Santa Lucía
  if (p.startsWith('+1268')) return 'AG'; // Antigua & Barbuda
  if (p.startsWith('+1340')) return 'VI'; // Islas Vírgenes EE.UU.
  if (p.startsWith('+1876')) return 'JM'; // Jamaica
  if (p.startsWith('+1809')) return 'DO'; // República Dominicana
  if (p.startsWith('+1829')) return 'DO'; // República Dominicana
  if (p.startsWith('+1849')) return 'DO'; // República Dominicana
  if (p.startsWith('+1590')) return 'MF'; // San Martín

  // Suramérica
  if (p.startsWith('+592'))  return 'GY'; // Guyana
  if (p.startsWith('+597'))  return 'SR'; // Surinam
  if (p.startsWith('+58'))   return 'VE'; // Venezuela
  if (p.startsWith('+57'))   return 'CO'; // Colombia
  if (p.startsWith('+56'))   return 'CL'; // Chile
  if (p.startsWith('+53'))   return 'CU'; // Cuba

  // Centroamérica / México
  if (p.startsWith('+52'))   return 'MX'; // México
  if (p.startsWith('+507'))  return 'PA'; // Panamá

  // Default Trinidad (mercado principal)
  return 'TT';
}