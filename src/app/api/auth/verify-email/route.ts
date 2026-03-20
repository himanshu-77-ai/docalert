import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json()
    if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 })

    const verifyToken = await prisma.emailVerificationToken.findUnique({ where: { token } })
    if (!verifyToken) return NextResponse.json({ error: 'Invalid verification link' }, { status: 400 })
    if (verifyToken.expiresAt < new Date()) return NextResponse.json({ error: 'Verification link expired' }, { status: 400 })

    await prisma.$transaction([
      prisma.user.update({ where: { id: verifyToken.userId }, data: { isEmailVerified: true, emailVerified: new Date() } }),
      prisma.emailVerificationToken.delete({ where: { token } }),
    ])

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
