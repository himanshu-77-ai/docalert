import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { status, notes, assignedTo, dueDate } = await req.json()
  const task = await prisma.renewalTask.update({
    where: { id: params.id, workspaceId: session.workspace?.id },
    data: {
      ...(status && { status, completedAt: status === 'COMPLETED' ? new Date() : null }),
      ...(notes !== undefined && { notes }),
      ...(assignedTo !== undefined && { assignedTo }),
      ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
    },
    include: {
      document: { select: { name:true, category:true, expiryDate:true } },
      assignee: { select: { name:true, email:true } },
    },
  })
  return NextResponse.json(task)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await prisma.renewalTask.delete({ where: { id: params.id, workspaceId: session.workspace?.id } })
  return NextResponse.json({ success: true })
}
