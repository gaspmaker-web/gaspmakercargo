"use client";

import { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';

export default function PackageSearch() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  
  // Estado inicial basado en la URL actual (para no perder la búsqueda al recargar)
  const [term, setTerm] = useState(searchParams.get('q') || '');

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams);
    
    if (term.trim()) {
      params.set('q', term);
    } else {
      params.delete('q');
    }
    
    // Actualizamos la URL sin recargar toda la página
    router.replace(`${pathname}?${params.toString()}`);
  };

  const handleClear = () => {
    setTerm('');
    const params = new URLSearchParams(searchParams);
    params.delete('q');
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex w-full max-w-md gap-2 relative">
      <div className="relative flex-1">
        <input
          type="text"
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gmc-dorado-principal outline-none text-sm"
          placeholder="Buscar por Tracking, Cliente o Suite..."
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        
        {term && (
          <button 
            onClick={handleClear}
            className="absolute right-3 top-2.5 text-gray-400 hover:text-red-500"
          >
            <X size={16} />
          </button>
        )}
      </div>
      
      <button 
        onClick={handleSearch}
        className="bg-gmc-gris-oscuro text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-black transition-colors shadow-sm"
      >
        Buscar
      </button>
    </div>
  );
}