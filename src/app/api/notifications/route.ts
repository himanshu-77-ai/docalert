import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const notifs = await prisma.notification.findMany({
    where: { userId: session.user.id },
    include: { document: { select: { name: true, category: true } } },
    orderBy: { sentAt: 'desc' },
    take: 50,
  })
  return NextResponse.json(notifs)
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await prisma.notification.updateMany({ where: { userId: session.user.id, isRead: false }, data: { isRead: true } })
  return NextResponse.json({ success: true })
}
