import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { sendPasswordResetEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { email } })
    // Always return success to prevent email enumeration
    if (!user) return NextResponse.json({ success: true })

    // Delete any existing tokens for this email
    await prisma.passwordResetToken.deleteMany({ where: { email } })

    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await prisma.passwordResetToken.create({ data: { email, token, expiresAt } })
    await sendPasswordResetEmail(email, token)

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('Forgot password error:', e)
    return NextResponse.json({ error: 'Failed to send reset email' }, { status: 500 })
  }
}
