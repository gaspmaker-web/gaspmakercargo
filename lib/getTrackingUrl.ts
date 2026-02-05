export const getTrackingUrl = (carrier: string | null | undefined, trackingNumber: string | null | undefined) => {
  if (!trackingNumber) return "#"; // Si no hay número, no hace nada

  const cleanCarrier = carrier ? carrier.toLowerCase().trim() : "";
  const cleanTracking = trackingNumber.trim();

  // 1. Detección para UPS
  if (cleanCarrier.includes("ups")) {
    return `https://www.ups.com/track?tracknum=${cleanTracking}`;
  }

  // 2. Detección para FedEx
  if (cleanCarrier.includes("fedex")) {
    return `https://www.fedex.com/fedextrack/?trknbr=${cleanTracking}`;
  }

  // 3. Detección para DHL
  if (cleanCarrier.includes("dhl")) {
    return `https://www.dhl.com/en/express/tracking.html?AWB=${cleanTracking}`;
  }

  // 4. Detección para USPS
  if (cleanCarrier.includes("usps")) {
    return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${cleanTracking}`;
  }

  // 5. Fallback: Si no sabemos qué courier es, usamos el rastreador universal de EasyPost
  return `https://track.easypost.com/${cleanTracking}`;
};