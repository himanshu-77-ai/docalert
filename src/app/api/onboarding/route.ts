import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Mark onboarding complete — we store it as a notification record (no schema change needed)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Check if already done
    const existing = await prisma.notification.findFirst({
      where: { userId: session.user.id, type: 'SYSTEM', title: 'onboarding_complete' },
    })
    if (existing) return NextResponse.json({ already: true })

    await prisma.notification.create({
      data: {
        userId: session.user.id,
        type: 'SYSTEM',
        channel: 'IN_APP',
        title: 'onboarding_complete',
        message: 'User completed onboarding',
        isRead: true,
      },
    })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const done = await prisma.notification.findFirst({
      where: { userId: session.user.id, type: 'SYSTEM', title: 'onboarding_complete' },
    })
    // Also check if they have documents already
    const docCount = await prisma.document.count({ where: { workspaceId: session.workspace?.id } })
    return NextResponse.json({ completed: !!done || docCount > 0, docCount })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
