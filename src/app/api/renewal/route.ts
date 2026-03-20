import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const tasks = await prisma.renewalTask.findMany({
      where: { workspaceId: session.workspace?.id },
      include: {
        document: { select: { id:true, name:true, category:true, expiryDate:true } },
        assignee: { select: { id:true, name:true, email:true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(tasks)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { documentId, assignedTo, notes, dueDate } = await req.json()
    if (!documentId) return NextResponse.json({ error: 'Document ID required' }, { status: 400 })
    const task = await prisma.renewalTask.create({
      data: {
        documentId,
        workspaceId: session.workspace?.id!,
        assignedTo: assignedTo || null,
        notes: notes || null,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
      include: {
        document: { select: { id:true, name:true, category:true, expiryDate:true } },
        assignee: { select: { id:true, name:true, email:true } },
      },
    })
    return NextResponse.json(task, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
