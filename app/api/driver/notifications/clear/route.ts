import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'

export async function DELETE() {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await prisma.notification.deleteMany({
      where: { userId: session.user.id }
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[driver/notifications/clear]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
