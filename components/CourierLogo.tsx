import Image from 'next/image';
import React from 'react';

interface Props {
  courierName?: string | null;
  className?: string;
  width?: number;
  height?: number;
}

export default function CourierLogo({ courierName, className = "", width = 100, height = 50 }: Props) {
  // 1. Limpiamos el nombre para evitar errores (mayúsculas/espacios)
  const name = courierName ? courierName.toLowerCase().trim() : "gasp";

  // 2. Mapeo EXACTO basado en tu carpeta 'public' (Imagen dc33)
  let src = "/gaspmakercargoproject.png"; // Logo por defecto (Gasp Maker)

  if (name.includes("fedex")) {
    src = "/fedex-express-6.svg";
  } else if (name.includes("dhl")) {
    src = "/dhl-1.svg";
  } else if (name.includes("ups")) {
    src = "/ups-united-parcel-service.svg";
  } else if (name.includes("usps") || name.includes("postal")) {
    src = "/usps-logo.svg";
  }

  // 3. Renderizado de Alta Calidad
  return (
    <div className={`relative flex items-center justify-center bg-white p-2 rounded-lg ${className}`}>
      <Image
        src={src}
        alt={courierName || "Courier Logo"}
        width={width}
        height={height}
        className="object-contain w-auto h-auto max-h-full" 
        priority // Carga prioritaria para que no parpadee
      />
    </div>
  );
}