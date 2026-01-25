"use client";

import { useTranslations } from 'next-intl';
import { Star, Quote, Globe, CheckCircle } from 'lucide-react';

export default function TestimonialsClient() {
    const t = useTranslations('Testimonials');

    // Datos REALES de reseñas de Google
    const reviews = [
        {
            name: "Super Impact Windows & Doors 365",
            role: "Cuenta Corporativa",
            text: "Best exporting freight forwarding shipping company in Miami. Always helps us deliver all of our windows and doors products to the Caribbean Islands.",
            stars: 5,
            initial: "S"
        },
        {
            name: "Stacyann Headley",
            role: "Cliente Verificado",
            text: "I was introduced to this company through a friend... Mr. Gerardo is so professional, always quick to respond... Shipping was quick (literally received within a couple days). Consolidating my packages made it so much cheaper for customs clearing in Trinidad.",
            stars: 5,
            initial: "S"
        },
        {
            name: "NIS",
            role: "Cliente Verificado",
            text: "Most Reliable Shipper. I consolidate all my Shipments and have it ship to Trinidad. Once Shipped I receive my Shipment in 2 to 3 Business days. I Highly Recommend. Amazing company, very professional and very organised.",
            stars: 5,
            initial: "N"
        }
    ];

    return (
        <div className="min-h-screen bg-white font-montserrat">
            
            {/* --- HERO SECTION --- */}
            <div className="relative bg-[#1a1f2e] text-white pt-24 pb-32 px-4 text-center overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                    <div className="absolute top-10 right-10 w-64 h-64 bg-gmc-dorado-principal/10 rounded-full blur-[80px]"></div>
                    <div className="absolute bottom-10 left-10 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px]"></div>
                </div>

                <div className="relative z-10 max-w-4xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8">
                        <Star size={14} className="text-gmc-dorado-principal fill-gmc-dorado-principal" />
                        <span className="text-xs font-bold tracking-[3px] text-gray-200 uppercase">
                            {t('googleReviews')}
                        </span>
                    </div>
                    
                    <h1 className="text-4xl md:text-6xl font-bold font-garamond text-white tracking-tight mb-6">
                        {t('title')}
                    </h1>
                    <p className="text-gray-300 text-lg md:text-xl font-light max-w-2xl mx-auto leading-relaxed">
                        {t('subtitle')}
                    </p>
                </div>
            </div>

            {/* --- GRID DE TESTIMONIOS --- */}
            <div className="max-w-7xl mx-auto px-4 -mt-20 relative z-20 pb-24">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {reviews.map((review, idx) => (
                        <div key={idx} className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 flex flex-col hover:-translate-y-2 transition-transform duration-300">
                            <div className="flex items-center gap-1 text-gmc-dorado-principal mb-6">
                                {[...Array(review.stars)].map((_, i) => (
                                    <Star key={i} size={18} fill="currentColor" />
                                ))}
                            </div>
                            
                            <Quote size={40} className="text-blue-50 mb-6" />
                            
                            <p className="text-gray-600 leading-relaxed mb-8 flex-grow italic text-sm">
                                "{review.text}"
                            </p>
                            
                            <div className="flex items-center gap-4 mt-auto pt-6 border-t border-gray-50">
                                <div className="w-12 h-12 bg-[#1a1f2e] rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0">
                                    {review.initial}
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 text-sm">{review.name}</h4>
                                    <p className="text-[10px] text-gmc-dorado-principal font-bold uppercase tracking-wider">{review.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* --- BADGE DE EXPERIENCIA --- */}
            <div className="container mx-auto px-4 pb-24">
                <div className="bg-gray-50 rounded-[40px] p-12 text-center border border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent via-gmc-dorado-principal to-transparent opacity-50"></div>
                    
                    <div className="flex flex-col items-center gap-6 relative z-10">
                        <div className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center mb-2">
                            <Globe size={32} className="text-blue-600" />
                        </div>
                        
                        <h3 className="text-2xl md:text-3xl font-bold font-garamond text-gray-900 max-w-2xl">
                            {t('yearsExperience')}
                        </h3>
                        
                        <div className="flex flex-wrap justify-center gap-3 text-[10px] md:text-xs font-black tracking-[3px] uppercase">
                            <span className="px-4 py-2 bg-white rounded-full border border-gmc-dorado-principal/30 shadow-sm text-gmc-dorado-principal">
                                GMC LOGISTICS
                            </span>
                            <span className="px-4 py-2 bg-white rounded-full border border-gmc-dorado-principal/30 shadow-sm text-gmc-dorado-principal">
                                MIAMI HUB
                            </span>
                            <span className="px-4 py-2 bg-white rounded-full border border-gmc-dorado-principal/30 shadow-sm text-gmc-dorado-principal">
                                CARIBBEAN DIRECT
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}