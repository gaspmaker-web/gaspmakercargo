import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { imageUrl } = await req.json()

    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: imageUrl }
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[driver/profile/photo]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
