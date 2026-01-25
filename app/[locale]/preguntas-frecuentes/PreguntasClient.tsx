"use client";

import React from 'react';
import { useTranslations } from 'next-intl';
import { HelpCircle } from 'lucide-react';

export default function PreguntasClient() {
    // Usamos 'Navigation' o 'Common' para asegurar que siempre haya texto
    const t = useTranslations('Navigation'); 

    return (
        <div className="min-h-screen bg-gray-50 py-20 px-4 font-montserrat">
            <div className="max-w-3xl mx-auto text-center">
                <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
                    <div className="flex justify-center mb-6 text-gmc-dorado-principal">
                        <HelpCircle size={48} />
                    </div>
                    
                    <h1 className="text-3xl font-bold text-gray-900 mb-4 font-garamond">
                        Preguntas Frecuentes
                    </h1>
                    
                    <p className="text-gray-500 text-lg">
                        Estamos actualizando nuestra sección de ayuda para servirte mejor.
                        <br />
                        Pronto encontrarás aquí todas las respuestas que necesitas.
                    </p>

                    <div className="mt-8 pt-8 border-t border-gray-100">
                        <p className="text-sm text-gray-400">
                            ¿Necesitas ayuda urgente? Contáctanos por WhatsApp.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}