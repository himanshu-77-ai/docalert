import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { generateSlug } from '@/lib/utils'
import { sendVerificationEmail, sendWelcomeEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, workspaceName } = await req.json()
    if (!name || !email || !password || !workspaceName)
      return NextResponse.json({ error: 'All fields required' }, { status: 400 })
    if (password.length < 8)
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })

    const exists = await prisma.user.findUnique({ where: { email } })
    if (exists) return NextResponse.json({ error: 'Email already registered' }, { status: 409 })

    const hashed = await bcrypt.hash(password, 12)
    const slug = generateSlug(workspaceName) + '-' + Math.random().toString(36).slice(2, 6)
    const verifyToken = crypto.randomBytes(32).toString('hex')

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({ data: { name, email, password: hashed } })
      const workspace = await tx.workspace.create({ data: { name: workspaceName, slug, ownerId: newUser.id } })
      await tx.workspaceMember.create({ data: { workspaceId: workspace.id, userId: newUser.id, role: 'OWNER' } })
      await tx.emailVerificationToken.create({
        data: { userId: newUser.id, token: verifyToken, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) }
      })
      return newUser
    })

    // Send emails (non-blocking)
    sendVerificationEmail(email, verifyToken, name).catch(console.error)
    sendWelcomeEmail(email, name, workspaceName).catch(console.error)

    return NextResponse.json({ id: user.id }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
