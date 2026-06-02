import React from 'react';
import { ExternalLink, MapPin, Package, ShoppingCart, User, Hash, Phone, Map } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import prisma from '@/lib/prisma';

export const revalidate = 3600;

export default async function MiamiLockerPage() {
  const t = await getTranslations('MiamiLocker');
  
  const products = await prisma.amazonProduct.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' }
  });

  // Función para asignar colores Enterprise según categoría
  const getCategoryStyles = (category: string | null) => {
    switch (category) {
      case 'Diagnostic':
        return 'bg-purple-50 text-purple-600';
      case 'Battery':
        return 'bg-red-50 text-red-600';
      case 'Scanner':
      case 'OBDII Scanners':
        return 'bg-amber-50 text-amber-600';
      case 'Automotive':
        return 'bg-blue-50 text-blue-600';
      default:
        return 'bg-blue-50 text-blue-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-montserrat pb-24">
      
      {/* --- BLOQUE SUPERIOR: VISTA ENTERPRISE DE DIRECCIÓN --- */}
      <section className="bg-[#1a1f2e] text-white pt-24 pb-20 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gmc-dorado-principal/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <Package className="w-16 h-16 text-gmc-dorado-principal mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold font-garamond mb-4">
              {t('hero_title_part1')} <span className="text-gmc-dorado-principal">{t('hero_title_part2')}</span>
            </h1>
            <p className="text-gray-300 max-w-2xl mx-auto text-lg">
              {t('hero_subtitle')}
            </p>
          </div>

          {/* TARJETA ENTERPRISE DIVIDIDA EN 2 COLUMNAS */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2">
              
              {/* Columna Izquierda: Instrucciones */}
              <div className="p-8 md:p-12 border-b md:border-b-0 md:border-r border-white/10 flex flex-col justify-center">
                <div className="inline-block bg-gmc-dorado-principal/20 text-gmc-dorado-principal px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase mb-6">
                  {t('instruction_badge')}
                </div>
                <h2 className="text-2xl font-bold mb-4 font-garamond text-white">
                  {t('instruction_title')}
                </h2>
                <ul className="space-y-4 text-gray-400 text-sm">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">1</span>
                    {t('step_1')}
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">2</span>
                    {t('step_2')}
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gmc-dorado-principal/20 text-gmc-dorado-principal flex items-center justify-center font-bold">3</span>
                    {t('step_3')}
                  </li>
                </ul>
              </div>

              {/* Columna Derecha: Digital ID Card (Dirección) */}
              <div className="p-8 md:p-12 bg-[#111520] relative">
                <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                  <MapPin size={100} />
                </div>
                <h3 className="font-bold text-lg uppercase tracking-widest text-gray-400 mb-8 flex items-center gap-2">
                  <MapPin size={18} className="text-gmc-dorado-principal" /> 
                  {t('address_title')}
                </h3>
                
                <div className="space-y-5 font-mono text-sm">
                  {/* Fila Nombre */}
                  <div className="flex flex-col sm:flex-row sm:justify-between border-b border-white/5 pb-3 gap-1">
                    <span className="text-gray-500 flex items-center gap-2 uppercase text-xs"><User size={14}/> {t('address_name')}</span>
                    <span className="text-white font-bold tracking-wide">[Tu Nombre] </span>
                  </div>
                  {/* Fila Dirección 1 */}
                  <div className="flex flex-col sm:flex-row sm:justify-between border-b border-white/5 pb-3 gap-1">
                    <span className="text-gray-500 flex items-center gap-2 uppercase text-xs"><Map size={14}/> {t('address_line1')}</span>
                    <span className="text-white font-bold tracking-wide">1861 NW 22ND ST</span>
                  </div>
                  {/* Fila Suite */}
                  <div className="flex flex-col sm:flex-row sm:justify-between border-b border-white/5 pb-3 gap-1">
                    <span className="text-gray-500 flex items-center gap-2 uppercase text-xs"><Hash size={14}/> {t('address_line2')}</span>
                    <span className="text-white font-bold tracking-wide"> [SUITE NUMBER] </span>
                  </div>
                  {/* Fila Ciudad/Estado */}
                  <div className="flex flex-col sm:flex-row sm:justify-between border-b border-white/5 pb-3 gap-1">
                    <span className="text-gray-500 flex items-center gap-2 uppercase text-xs"><MapPin size={14}/> {t('address_city')} & {t('address_state')}</span>
                    <span className="text-white font-bold tracking-wide">Miami, FL 33142</span>
                  </div>
                  {/* Fila Teléfono */}
                  <div className="flex flex-col sm:flex-row sm:justify-between pb-1 gap-1">
                    <span className="text-gray-500 flex items-center gap-2 uppercase text-xs"><Phone size={14}/> {t('address_phone')}</span>
                    <span className="text-white font-bold tracking-wide">+1 (786) 282-0763</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* --- BLOQUE INFERIOR: AMAZON GRID (CON EL NUEVO GANCHO) --- */}
      <section className="max-w-7xl mx-auto px-4 mt-16 relative z-20">
        
        {/* Cabecera del Grid rediseñada para atrapar la intención de compra */}
        <div className="mb-10 text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 font-garamond mb-4">
            {t('hook_title')}
          </h2>
          <p className="text-gray-500 text-lg">
            {t('hook_subtitle')}
          </p>
        </div>

        <div className="flex items-center justify-between mb-8 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <span className="text-sm font-bold text-gray-500 flex items-center gap-2">
             <ShoppingCart size={18} className="text-blue-500" />
             Catálogo Oficial
          </span>
          <span className="text-xs font-bold text-white bg-gray-900 px-3 py-1.5 rounded-md shadow-sm">
            {products.length} {t('grid_products_count')}
          </span>
        </div>

        {/* El Grid Responsivo */}
        {products.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-dashed border-gray-200">
             <ShoppingCart className="mx-auto text-gray-300 mb-6" size={56} />
             <h3 className="text-2xl font-bold text-gray-400 mb-2">{t('empty_title')}</h3>
             <p className="text-gray-400">{t('empty_subtitle')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-2xl hover:-translate-y-1 hover:border-gmc-dorado-principal transition-all duration-300 group flex flex-col h-full">
                
                <div className="relative w-full aspect-square bg-white p-6 flex items-center justify-center border-b border-gray-50">
                  <img 
                    src={product.imageUrl || ''} 
                    alt={product.title || 'Product'} 
                    className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
<div className="p-6 flex-1 flex flex-col">
                  
                  {/* Contenedor fijo para la Etiqueta */}
                  <div className="mb-3 flex-shrink-0">
                    <span className={`text-[10px] uppercase font-bold tracking-wider inline-block px-2 py-1 rounded w-max ${getCategoryStyles(product.category)}`}>
                      {product.category || t('default_category')}
                    </span>
                  </div>
                  
                  {/* 🔥 CAJA RÍGIDA PARA EL TÍTULO (Alineación infalible) 🔥 */}
                  <div className="h-[72px] mb-4 overflow-hidden">
                    <h3 className="font-bold text-gray-800 text-sm line-clamp-3 leading-relaxed" title={product.title || ''}>
                      {product.title}
                    </h3>
                  </div>
                  
                  {/* Bloque empujado al fondo con mt-auto */}
                  <div className="mt-auto pt-2 flex flex-col justify-end">
                    <p className="text-3xl font-black text-gray-900 mb-5 font-mono tracking-tight">
                      {product.price}
                    </p>
                    
                    <a 
                      href={product.affiliateUrl || '#'} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full bg-[#FF9900] hover:bg-[#e68a00] text-black font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg"
                    >
                      {t('btn_amazon')} <ExternalLink size={18} />
                    </a>
                  </div>

                </div>

              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}