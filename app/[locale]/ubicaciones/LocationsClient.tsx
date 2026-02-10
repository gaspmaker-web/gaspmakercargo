"use client";

import { useTranslations } from 'next-intl';
import { MapPin, Phone, Clock, ExternalLink, Globe } from 'lucide-react';

interface Office {
    name: string;
    address: string;
    phone: string;
    hours?: string;
    mapUrl: string;
}

export default function LocationsClient() {
    const t = useTranslations('Locations');

    const offices: Office[] = [
        {
            name: "Miami Distribution Center (Locker)",
            address: "GASP MAKER 1861 NW 22nd St, Miami, FL 33142",
            phone: "(786) 282-0763",
            hours: "Mon-Fri: 9:00 AM - 4:00 PM",
            mapUrl: "https://maps.google.com/?q=1861+NW+22nd+St,+Miami,+FL+33142" // Corregido link real aproximado
        },
        {
            name: "Oficina Central Trinidad y Tobago",
            address: "150 BWIA Blvd, Piarco, Trinidad and Tobago",
            phone: "+1 868 468-9635",
            hours: "Mon-Sat: 9:00 AM - 7:00 PM",
            mapUrl: "https://maps.google.com/?q=150+BWIA+Blvd,+Piarco,+Trinidad+and+Tobago"
        },
        {
            name: "Barbados (GCG Ground Services)",
            address: "GCG Ground Services Ltd, Barbados",
            phone: "+1 246 428 1670 (ext 3535)",
            hours: "Mon-Fri: 8:00 AM - 4:00 PM",
            mapUrl: "https://maps.google.com/?q=GCG+Ground+Services+Ltd,+Barbados"
        },
        {
            name: "Kingston (AJAS Cargo)",
            address: "AJAS Cargo, Norman Manley Int'l Airport, Kingston",
            phone: "+1 876 945 6405 / 6408",
            mapUrl: "https://maps.google.com/?q=AJAS+Cargo,+Kingston"
        },
        {
            name: "St. Thomas (US Virgin Islands)",
            address: "Cyril E. King Airport, Airport Rd, Charlotte Amalie West, St Thomas 00802",
            phone: "+1 340 774 5100",
            mapUrl: "https://maps.google.com/?q=Cyril+E.+King+Airport"
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 font-montserrat">
            {/* HERO HEADER */}
            <div className="relative bg-[#1a1f2e] text-white pt-24 pb-32 px-4 text-center overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gmc-dorado-principal/10 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none"></div>
                
                <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-6">
                        <Globe size={12} className="text-gmc-dorado-principal" />
                        <span className="text-xs font-bold tracking-wider text-gray-200 uppercase">
                            Red Global Gasp Maker Cargo
                        </span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold font-garamond text-white tracking-tight">
                        {t('title')}
                    </h1>
                    <p className="text-gray-300 mt-4 text-lg max-w-2xl mx-auto font-light">
                        {t('subtitle')}
                    </p>
                </div>
            </div>

            {/* CARDS GRID */}
            <div className="max-w-7xl mx-auto px-4 -mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20 relative z-20">
                {offices.map((office, idx) => (
                    <div key={idx} className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 group flex flex-col h-full">
                        
                        {/* Icono Cabecera */}
                        <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                            <MapPin size={28} />
                        </div>
                        
                        {/* Título */}
                        <h3 className="text-xl font-bold text-gray-800 mb-4 font-garamond group-hover:text-gmc-dorado-principal transition-colors min-h-[56px]">
                            {office.name}
                        </h3>
                        
                        {/* Lista de Detalles */}
                        <div className="space-y-3 text-gray-600 text-sm flex-grow">
                            
                            {/* Dirección */}
                            <div className="flex items-start gap-3">
                                <MapPin size={16} className="text-gmc-dorado-principal shrink-0 mt-0.5" />
                                <p className="leading-relaxed font-montserrat">{office.address}</p>
                            </div>

                            {/* Teléfono (Números Alineados) */}
                            <div className="flex items-start gap-3">
                                <Phone size={16} className="text-gmc-dorado-principal shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-montserrat lining-nums">{office.phone}</p>
                                </div>
                            </div>

                            {/* Horario (Si existe) */}
                            {office.hours && (
                                <div className="flex items-center gap-3">
                                    <Clock size={16} className="text-gmc-dorado-principal shrink-0" />
                                    <p className="font-montserrat lining-nums">{office.hours}</p>
                                </div>
                            )}
                        </div>

                        {/* Botón Mapa */}
                        <div className="mt-6 pt-6 border-t border-gray-50">
                            <a 
                                href={office.mapUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-gmc-dorado-principal font-bold hover:text-yellow-600 transition-colors text-sm"
                            >
                                {t('viewMap')} <ExternalLink size={14}/>
                            </a>
                        </div>
                    </div>
                ))}
            </div>

            <div className="max-w-4xl mx-auto px-4 pb-20 text-center">
                <p className="text-xs text-gray-400">
                </p>
            </div>
        </div>
    );
}