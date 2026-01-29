"use client";

import React, { useState } from 'react';
import { 
  Save, 
  Search,
  Globe, 
  Ship, 
  Plane,
  ShieldAlert,
  MapPin,
  DollarSign
} from 'lucide-react';

// Datos simulados iniciales (Esto vendrá de tu BD: tabla `CountryRates`)
const INITIAL_COUNTRIES = [
  { id: 'DO', name: 'República Dominicana', flag: '🇩🇴', airPrice: 2.50, seaPrice: 10.00, minRate: 5.00 },
  { id: 'VE', name: 'Venezuela', flag: '🇻🇪', airPrice: 3.90, seaPrice: 15.00, minRate: 10.00 },
  { id: 'CO', name: 'Colombia', flag: '🇨🇴', airPrice: 2.10, seaPrice: 8.50, minRate: 5.00 },
  { id: 'MX', name: 'México', flag: '🇲🇽', airPrice: 4.50, seaPrice: 0.00, minRate: 15.00 },
  { id: 'PA', name: 'Panamá', flag: '🇵🇦', airPrice: 2.75, seaPrice: 9.00, minRate: 5.00 },
  { id: 'CL', name: 'Chile', flag: '🇨🇱', airPrice: 6.00, seaPrice: 20.00, minRate: 20.00 },
];

export default function ConfiguracionPage() {
  
  const [countries, setCountries] = useState(INITIAL_COUNTRIES);
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrado de países
  const filteredCountries = countries.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Manejador de cambios en los inputs de la tabla
  const handleRateChange = (id: string, field: string, value: string) => {
    setCountries(prev => prev.map(country => 
      country.id === id ? { ...country, [field]: parseFloat(value) } : country
    ));
  };

  return (
    <div className="space-y-8 pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gmc-gris-oscuro font-garamond">
            Configuración de Tarifas
          </h1>
          <p className="text-gray-500 mt-1">
            Administra los precios por libra según el país de destino.
          </p>
        </div>
        <button 
          onClick={() => alert("Guardando tarifas en base de datos...")}
          className="flex items-center gap-2 bg-gmc-dorado-principal text-white px-6 py-2 rounded-lg hover:bg-yellow-600 transition-colors shadow-md font-medium"
        >
          <Save size={18} />
          <span>Guardar Todo</span>
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA: TARIFAS POR PAÍS (OCUPA 2/3) */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Barra de Búsqueda */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between gap-4">
             <div className="flex items-center gap-2 text-gray-800 font-bold">
                <Globe size={20} className="text-blue-600"/>
                <h3>Tarifas Internacionales</h3>
             </div>
             <div className="relative w-full max-w-xs">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
               <input 
                 type="text" 
                 placeholder="Buscar país..." 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-colors"
               />
             </div>
          </div>

          {/* Tabla de Tarifas */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-semibold uppercase text-xs">
                  <tr>
                    <th className="px-6 py-4">País</th>
                    <th className="px-6 py-4 w-32">
                        <div className="flex items-center gap-1"><Plane size={14}/> Aéreo /lb</div>
                    </th>
                    <th className="px-6 py-4 w-32">
                        <div className="flex items-center gap-1"><Ship size={14}/> Marítimo /ft³</div>
                    </th>
                    <th className="px-6 py-4 w-32">Tasa Mínima</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCountries.map((country) => (
                    <tr key={country.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-3 font-medium text-gray-800 flex items-center gap-2">
                        <span className="text-xl">{country.flag}</span>
                        {country.name}
                      </td>
                      
                      {/* Input Aéreo */}
                      <td className="px-6 py-3">
                        <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                            <input 
                                type="number" 
                                value={country.airPrice}
                                onChange={(e) => handleRateChange(country.id, 'airPrice', e.target.value)}
                                className="w-full pl-5 pr-2 py-1 border border-gray-200 rounded focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none font-semibold text-gray-700 text-right"
                            />
                        </div>
                      </td>

                      {/* Input Marítimo */}
                      <td className="px-6 py-3">
                        <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                            <input 
                                type="number" 
                                value={country.seaPrice}
                                onChange={(e) => handleRateChange(country.id, 'seaPrice', e.target.value)}
                                className="w-full pl-5 pr-2 py-1 border border-gray-200 rounded focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none font-semibold text-gray-700 text-right"
                            />
                        </div>
                      </td>

                      {/* Input Mínimo */}
                      <td className="px-6 py-3">
                        <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                            <input 
                                type="number" 
                                value={country.minRate}
                                onChange={(e) => handleRateChange(country.id, 'minRate', e.target.value)}
                                className="w-full pl-5 pr-2 py-1 border border-gray-200 rounded focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none font-semibold text-gray-700 text-right"
                            />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredCountries.length === 0 && (
                <div className="p-8 text-center text-gray-400">
                    No se encontraron países con ese nombre.
                </div>
            )}
          </div>
        </div>


        {/* COLUMNA DERECHA: GLOBALES Y CONTACTO (OCUPA 1/3) */}
        <div className="space-y-6">
            
            {/* VARIABLES GLOBALES */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
                <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                    <div className="p-2 bg-yellow-50 rounded-lg">
                        <ShieldAlert className="text-yellow-600" size={20} />
                    </div>
                    <h3 className="font-bold text-gray-800">Variables Globales</h3>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Seguro de Carga (%)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                    <input type="number" defaultValue="10" className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500 transition-all font-semibold" />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">Se aplica sobre el Valor Declarado.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">ITBIS / Impuestos (%)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                    <input type="number" defaultValue="18" className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500 transition-all font-semibold" />
                  </div>
                </div>
            </div>

            {/* DIRECCIÓN BODEGA */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
                <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                    <div className="p-2 bg-purple-50 rounded-lg">
                        <MapPin className="text-purple-600" size={20} />
                    </div>
                    <h3 className="font-bold text-gray-800">Dirección Miami</h3>
                </div>
                
                <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Dirección Física</label>
                   <textarea rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-purple-500" defaultValue="8250 NW 25th St, Unit 1, Miami, FL 33122"></textarea>
                </div>
            </div>

        </div>

      </div>
    </div>
  );
}