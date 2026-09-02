import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';


export async function POST(request: Request) {
  try {
    const prisma = (await import('@/lib/prisma')).default;
    const { auth } = await import('@/auth');
    const {
      sendPaymentReceiptEmail,
      sendAdminPaymentAlert,
      sendNotification
    } = await import('@/lib/notifications');

    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { calculateAuraLocalDelivery, DEFAULT_AURA_RATES } = await import('@/lib/aura-engine');
    const { getTenantId } = await import('@/lib/tenant-cache');
    const { getTenantRates } = await import('@/lib/tenant-rates');
    const tenantSlug = process.env.TENANT_SLUG || 'gaspmaker';
    const tenantIdAura = await getTenantId(tenantSlug);
    const tenantRatesData = tenantIdAura ? await getTenantRates(tenantIdAura) : {};
    const auraRates = {
  ...DEFAULT_AURA_RATES,
  base_0_40:    Number(tenantRatesData['local_base_0_40lbs']    ?? DEFAULT_AURA_RATES.base_0_40),
  base_41_50:   Number(tenantRatesData['local_base_41_50lbs']   ?? DEFAULT_AURA_RATES.base_41_50),
  base_51_60:   Number(tenantRatesData['local_base_51_60lbs']   ?? DEFAULT_AURA_RATES.base_51_60),
  base_61_70:   Number(tenantRatesData['local_base_61_70lbs']   ?? DEFAULT_AURA_RATES.base_61_70),
  base_71_80:   Number(tenantRatesData['local_base_71_80lbs']   ?? DEFAULT_AURA_RATES.base_71_80),
  base_81_90:   Number(tenantRatesData['local_base_81_90lbs']   ?? DEFAULT_AURA_RATES.base_81_90),
  base_91_100:  Number(tenantRatesData['local_base_91_100lbs']  ?? DEFAULT_AURA_RATES.base_91_100),
  base_101_110: Number(tenantRatesData['local_base_101_110lbs'] ?? DEFAULT_AURA_RATES.base_101_110),
  base_111_120: Number(tenantRatesData['local_base_111_120lbs'] ?? DEFAULT_AURA_RATES.base_111_120),
  base_121_130: Number(tenantRatesData['local_base_121_130lbs'] ?? DEFAULT_AURA_RATES.base_121_130),
  base_131_140: Number(tenantRatesData['local_base_131_140lbs'] ?? DEFAULT_AURA_RATES.base_131_140),
  base_141_150: Number(tenantRatesData['local_base_141_150lbs'] ?? DEFAULT_AURA_RATES.base_141_150),
  base_151_500: Number(tenantRatesData['local_base_151_500lbs'] ?? DEFAULT_AURA_RATES.base_151_500),
  base_501_600: Number(tenantRatesData['local_base_501_600lbs'] ?? DEFAULT_AURA_RATES.base_501_600),
  base_601_800: Number(tenantRatesData['local_base_601_800lbs'] ?? DEFAULT_AURA_RATES.base_601_800),
  base_801plus: Number(tenantRatesData['local_base_801plus']    ?? DEFAULT_AURA_RATES.base_801plus),
  rate_car_suv:   Number(tenantRatesData['local_per_mile_car_suv']   ?? DEFAULT_AURA_RATES.rate_car_suv),
  rate_minivan:   Number(tenantRatesData['local_per_mile_minivan']   ?? DEFAULT_AURA_RATES.rate_minivan),
  rate_cargo_van: Number(tenantRatesData['local_per_mile_cargo_van'] ?? DEFAULT_AURA_RATES.rate_cargo_van),
  rate_box_truck: Number(tenantRatesData['local_per_mile_box_truck'] ?? DEFAULT_AURA_RATES.rate_box_truck),
  pre_built_flat:   Number(tenantRatesData['local_pre_built_pallet_flat']  ?? DEFAULT_AURA_RATES.pre_built_flat),
  pre_built_radius: Number(tenantRatesData['local_pre_built_radius_miles'] ?? DEFAULT_AURA_RATES.pre_built_radius),
  base_radius:      Number(tenantRatesData['local_base_radius_miles']      ?? DEFAULT_AURA_RATES.base_radius),
};

// ==========================================
    // 🛡️ RECÁLCULO DE PRECIO EN EL SERVIDOR
    // ==========================================
    const PICKUP_SERVICE_TYPES = ['SHIPPING', 'DELIVERY'];
    const isPickupService = PICKUP_SERVICE_TYPES.includes((body.serviceType || '').toUpperCase());

    let subtotal = 0;
    let processingFee = 0;
    let totalPaid = 0;

    if (isPickupService) {
        const { getProcessingFee } = await import('@/lib/stripeCalc');

        const wLbs     = parseFloat(body.weightLbs) || 0;
        const dMiles   = parseFloat(body.distanceMiles) || 0;
        const vehicle  = (body.heavyVehicle || 'CARGO_VAN').toUpperCase();
        const pCount   = parseInt(body.palletCount) || 1;
        const palletMode = Boolean(body.isPalletMode);

       if (palletMode) {
    const boxTruckRates: Record<number, number> = { 3: 195, 4: 250, 5: 300, 6: 350 };
    const palletBoxTruck = Number(tenantRatesData[`local_pallet_box_truck_${pCount}`] ?? boxTruckRates[pCount] ?? 195);
    const palletCargoVan2 = Number(tenantRatesData['local_pallet_cargo_van_2'] ?? 125);
    const palletCargoVan1 = Number(tenantRatesData['local_pallet_cargo_van_1'] ?? 95);
    if (vehicle === 'BOX_TRUCK') {
        subtotal = palletBoxTruck;
    } else {
        subtotal = pCount === 2 ? palletCargoVan2 : palletCargoVan1;
    }
    if (dMiles > auraRates.base_radius) {
        const rate = vehicle === 'BOX_TRUCK' ? auraRates.rate_box_truck : auraRates.rate_cargo_van;
        subtotal += parseFloat(((dMiles - auraRates.base_radius) * rate).toFixed(2));
    }
        } else if (wLbs > 0) {
            // 🔒 Aura Engine — modo SIMULACIÓN (0-150 lbs)
            const aura = calculateAuraLocalDelivery(
    [{ length: 1, width: 1, height: 1, realWeight: wLbs }],
    dMiles,
    auraRates
);
            subtotal = aura.totalFare;
        } else {
            return NextResponse.json({ message: 'Peso inválido' }, { status: 400 });
        }

        processingFee = getProcessingFee(subtotal);
        totalPaid = parseFloat((subtotal + processingFee).toFixed(2));

    } else {
        // PICKUP_WAREHOUSE — handling fee del inventario real en BD, no hay riesgo
        subtotal      = parseFloat(body.subtotal) || 0;
        processingFee = parseFloat(body.processingFee) || 0;
        totalPaid     = parseFloat(body.totalPaid) || 0;
    }
 // ==========================================

    // ── Geocoding server-side ──────────────────────────────────────────────
    let lat: number | null = null
    let lng: number | null = null
    let latDest: number | null = null
    let lngDest: number | null = null

    const geocodeAddress = async (address: string) => {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}`
      const res = await fetch(url)
      const data = await res.json()
      if (data.status === 'OK' && data.results[0]) {
        return data.results[0].geometry.location as { lat: number; lng: number }
      }
      return null
    }

    if (body.originAddress) {
      const coords = await geocodeAddress(body.originAddress)
      if (coords) { lat = coords.lat; lng = coords.lng }
    }
    if (body.dropOffAddress) {
      const coords = await geocodeAddress(body.dropOffAddress)
      if (coords) { latDest = coords.lat; lngDest = coords.lng }
    }
    // ───────────────────────────────────────────────────────────────────────
    // ✅ Guardar en BD con precios del SERVIDOR
    // ==========================================
    const newRequest = await prisma.pickupRequest.create({
      data: {
        userId: session.user.id,
        serviceType: body.serviceType || 'SHIPPING',
        originAddress: body.originAddress,
        originCity: body.originCity,
        pickupDate: new Date(body.pickupDate),
        description: body.description,
        contactPhone: body.contactPhone,
        dropOffAddress: body.dropOffAddress || null,
        dropOffCity: body.dropOffCity || null,
        dropOffContact: body.dropOffContact || null,
        dropOffPhone: body.dropOffPhone || null,
        weightInfo: body.weightInfo || body.weightTier,
        volumeInfo: body.volumeInfo || body.volumeTier,
        weightLbs: body.weightLbs || null,
        distanceMiles: body.distanceMiles || null,
        isPalletMode: body.isPalletMode || false,
        extraStops: body.extraStops || null,
        lat,
        lng,
        latDest,
        lngDest,
        status: body.status || 'PENDIENTE',
        totalPaid,
        subtotal,
        processingFee,
        stripePaymentId: body.stripePaymentId || null
      },
    });

    // ==========================================
    // 📧 NOTIFICACIONES (sin cambios)
    // ==========================================
    if (body.status === 'PAGADO' && session.user.email) {

      const emailResult = await sendPaymentReceiptEmail(
        session.user.email,
        session.user.name || 'Cliente',
        `Pickup: ${body.serviceType}`,
        totalPaid,  // ✅ precio del servidor
        newRequest.id,
        `Ruta: ${body.originAddress} -> ${body.dropOffAddress || 'Almacén GMC'}`
      );

      await sendAdminPaymentAlert(
        session.user.name || 'Cliente',
        totalPaid,  // ✅ precio del servidor
        `Solicitud Pickup (${body.serviceType})`,
        newRequest.id
      );

      const formattedDate = new Date(body.pickupDate).toLocaleDateString();
      await sendNotification({
        userId: session.user.id,
        title: JSON.stringify({ key: "pickupConfirmedTitle" }),
        message: JSON.stringify({ key: "pickupConfirmedBody", date: formattedDate }),
        type: "SUCCESS"
      });

      if ((emailResult as any)?.error) {
        console.error("❌ ERROR RESEND:", (emailResult as any).error);
      }
    }

    return NextResponse.json(
      { success: true, message: 'Solicitud creada', data: newRequest },
      { status: 201 }
    );

  } catch (error) {
    console.error("Error API Pickup:", error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}