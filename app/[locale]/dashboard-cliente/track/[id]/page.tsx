import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import TrackClient from './TrackClient'

export const dynamic = 'force-dynamic'

export default async function TrackPage(props: any) {
  const session = await auth()
  const params = await props.params
  const locale = params?.locale || 'en'
  const id = params?.id

  if (!session?.user) redirect(`/${locale}/login-cliente`)

  const pickup = await prisma.pickupRequest.findUnique({
    where: { id },
    select: {
      id: true,
      originAddress: true,
      dropOffAddress: true,
      status: true,
      driverId: true,
      driver: { select: { id: true, name: true } }
    }
  })

  if (!pickup || pickup.driverId === null) {
    redirect(`/${locale}/dashboard-cliente/historial-solicitudes`)
  }

  return (
    <TrackClient
      requestId={pickup.id}
      driverId={pickup.driverId}
      driverName={pickup.driver?.name ?? 'Driver'}
      origin={pickup.originAddress}
      destination={pickup.dropOffAddress ?? ''}
      status={pickup.status}
      locale={locale}
    />
  )
}
