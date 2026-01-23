/**
 * Optimiza una URL de Cloudinary para reducir peso y consumo de ancho de banda.
 * Aplica transformaciones automáticas: f_auto (formato WebP/AVIF) y q_auto (calidad).
 * * @param url La URL original de la imagen
 * @returns La URL optimizada con parámetros de transformación
 */
export const optimizeCloudinaryUrl = (url: string | null | undefined) => {
  if (!url) return null;
  
  // Si no es una URL de Cloudinary, la devolvemos tal cual
  if (!url.includes('cloudinary.com')) return url; 

  // Si ya tiene parámetros de optimización, no hacemos nada
  if (url.includes('f_auto,q_auto')) return url;

  // Insertamos la transformación después de "/upload/"
  return url.replace('/upload/', '/upload/f_auto,q_auto/');
};