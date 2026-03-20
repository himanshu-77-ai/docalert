import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json()
    if (!token || !password) return NextResponse.json({ error: 'Token and password required' }, { status: 400 })
    if (password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })

    const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } })
    if (!resetToken) return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 })
    if (resetToken.used) return NextResponse.json({ error: 'Reset link already used' }, { status: 400 })
    if (resetToken.expiresAt < new Date()) return NextResponse.json({ error: 'Reset link has expired' }, { status: 400 })

    const hashed = await bcrypt.hash(password, 12)
    await prisma.$transaction([
      prisma.user.update({ where: { email: resetToken.email }, data: { password: hashed } }),
      prisma.passwordResetToken.update({ where: { token }, data: { used: true } }),
    ])

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
