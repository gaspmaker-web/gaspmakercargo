import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import prisma from '@/lib/prisma'

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET)

async function getClientFromToken(req: Request) {
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return null
  try {
    const { payload } = await jwtVerify(auth.slice(7), secret)
    return payload as { id: string; email: string; role: string }
  } catch { return null }
}

export async function PATCH(req: Request) {
  try {
    const payload = await getClientFromToken(req)
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { image } = body

    if (!image) return NextResponse.json({ error: 'No fields to update' }, { status: 400 })

    await prisma.user.update({
      where: { id: payload.id },
      data: { image },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[client/profile-mobile PATCH]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
