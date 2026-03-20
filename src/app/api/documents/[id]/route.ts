import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const doc = await prisma.document.update({
    where: { id: params.id },
    data: { ...body, expiryDate: new Date(body.expiryDate), issueDate: body.issueDate ? new Date(body.issueDate) : null },
  })
  return NextResponse.json(doc)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await prisma.document.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
