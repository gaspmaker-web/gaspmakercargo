import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import DispatchClient from './DispatchClient'

export const dynamic = 'force-dynamic'

export default async function MonitorEnviosPage(props: any) {
  const session = await auth()
  const params = await props.params
  const locale = params?.locale || 'en'

  if (!session?.user) redirect(`/${locale}/login-cliente`)

  const drivers = await prisma.user.findMany({
    where: { role: 'DRIVER' },
    select: { id: true, name: true, countryCode: true },
    orderBy: { name: 'asc' }
  })

  const activeDeliveries = await prisma.pickupRequest.findMany({
    where: {
      status: { in: ['ACEPTADO', 'EN_CAMINO', 'EN_REPARTO', 'EN_RUTA'] },
      driverId: { not: null },
    },
    select: {
      id: true,
      originAddress: true,
      dropOffAddress: true,
      status: true,
      driverId: true,
      serviceType: true,
      pickupDate: true,
    },
    orderBy: { updatedAt: 'desc' }
  })

  const activeConsolidations = await prisma.consolidatedShipment.findMany({
    where: {
      status: { in: ['EN_REPARTO', 'OUT_FOR_DELIVERY', 'EN_CAMINO', 'EN_RUTA'] },
    },
    select: {
      id: true,
      gmcShipmentNumber: true,
      shippingAddress: true,
      status: true,
      weightLbs: true,
      destinationCountryCode: true,
      user: { select: { name: true } }
    },
    orderBy: { updatedAt: 'desc' }
  })

  return (
    <DispatchClient
      drivers={drivers}
      activeDeliveries={activeDeliveries}
      activeConsolidations={activeConsolidations}
      locale={locale}
    />
  )
}
