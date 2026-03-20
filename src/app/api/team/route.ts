import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canAddMember } from '@/lib/planLimits'
import { sendTeamInviteEmail } from '@/lib/email'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId: session.workspace?.id },
    include: { user: { select: { id:true, name:true, email:true, createdAt:true } } },
    orderBy: { joinedAt: 'asc' },
  })
  return NextResponse.json(members)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const check = await canAddMember(session.workspace?.id!)
  if (!check.allowed) return NextResponse.json({ error: check.reason }, { status: 403 })

  const { email, role } = await req.json()
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return NextResponse.json({ error: 'User not found. They must register on DocAlert first.' }, { status: 404 })

  const existing = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: session.workspace?.id!, userId: user.id } },
  })
  if (existing) return NextResponse.json({ error: 'User is already in this workspace' }, { status: 409 })

  const member = await prisma.workspaceMember.create({
    data: { workspaceId: session.workspace?.id!, userId: user.id, role: role || 'VIEWER' },
    include: { user: { select: { id:true, name:true, email:true } } },
  })

  // Send invite email (non-blocking)
  sendTeamInviteEmail(email, session.user.name || 'Someone', session.workspace?.name || 'DocAlert').catch(console.error)

  return NextResponse.json(member, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { memberId } = await req.json()
  // Can't remove owner
  const member = await prisma.workspaceMember.findUnique({ where: { id: memberId } })
  if (member?.role === 'OWNER') return NextResponse.json({ error: 'Cannot remove workspace owner' }, { status: 403 })
  await prisma.workspaceMember.delete({ where: { id: memberId, workspaceId: session.workspace?.id } })
  return NextResponse.json({ success: true })
}
