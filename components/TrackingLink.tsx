import { getTrackingUrl } from "@/lib/getTrackingUrl";
import { ExternalLink } from "lucide-react"; // Asumo que usas lucide-react, si no, quita el icono

interface Props {
  carrier?: string | null;
  trackingNumber: string;
  className?: string; // Para poder darle estilos extra si quieres
}

export default function TrackingLink({ carrier, trackingNumber, className }: Props) {
  const url = getTrackingUrl(carrier, trackingNumber);

  return (
    <a
      href={url}
      target="_blank" // Abre en pestaña nueva
      rel="noopener noreferrer" // Seguridad
      className={`flex items-center gap-2 hover:text-blue-600 hover:underline transition-colors cursor-pointer ${className}`}
      title={`Rastrear en ${carrier || "la web"}`}
    >
      <span className="font-mono font-medium">{trackingNumber}</span>
      {/* Icono pequeño de link externo */}
      <ExternalLink size={14} className="text-gray-400" />
    </a>
  );
}