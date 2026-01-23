'use client';

import { Search } from 'lucide-react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce'; // Si no tienes esta librería, usa el timeout abajo

export default function SearchConsolidations() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  // Función simple para buscar sin librerías externas
  const handleSearch = (term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set('q', term);
    } else {
      params.delete('q');
    }
    replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="relative flex-1 max-w-md">
      <label htmlFor="search" className="sr-only">Buscar</label>
      <input
        className="peer block w-full rounded-xl border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500"
        placeholder="Buscar por cliente o tracking..."
        onChange={(e) => handleSearch(e.target.value)}
        defaultValue={searchParams.get('q')?.toString()}
      />
      <Search className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-blue-500" />
    </div>
  );
}