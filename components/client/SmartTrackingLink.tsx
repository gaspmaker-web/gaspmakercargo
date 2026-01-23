import Link from 'next/link';
import { ExternalLink, Map } from 'lucide-react';

interface Props {
  trackingNumber: string;
  courier: string;
}

export default function SmartTrackingLink({ trackingNumber, courier }: Props) {
  // 1. Si es NUESTRO Courier (Gasp Maker Cargo)
  if (courier === 'Gasp Maker Cargo' || courier === 'GMC') {
    return (
      <Link 
        href={`/rastreo/${trackingNumber}`}
        className="flex items-center gap-2 text-blue-600 font-bold hover:underline bg-blue-50 px-3 py-1 rounded-lg border border-blue-100 transition-colors"
      >
        <Map size={16} />
        {trackingNumber}
      </Link>
    );
  }

  // 2. Si es Externo (UPS, FedEx, USPS) -> Link a EasyPost o web oficial
  return (
    <a 
      href={`https://www.google.com/search?q=${trackingNumber}`} 
      target="_blank" 
      rel="noopener noreferrer"
      className="flex items-center gap-2 text-gray-600 hover:text-blue-500 hover:underline"
    >
      <ExternalLink size={14} />
      {trackingNumber}
    </a>
  );
}