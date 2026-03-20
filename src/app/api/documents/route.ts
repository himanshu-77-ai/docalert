import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canAddDocument } from '@/lib/planLimits'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { searchParams } = new URL(req.url)
    const docs = await prisma.document.findMany({
      where: {
        workspaceId: session.workspace?.id,
        ...(searchParams.get('category') && { category: searchParams.get('category') as any }),
        ...(searchParams.get('search') && {
        OR: [
          { name: { contains: searchParams.get('search')!, mode: 'insensitive' } },
          { documentNo: { contains: searchParams.get('search')!, mode: 'insensitive' } },
          { issuedBy: { contains: searchParams.get('search')!, mode: 'insensitive' } },
          { notes: { contains: searchParams.get('search')!, mode: 'insensitive' } },
        ],
      }),
      },
      orderBy: { expiryDate: 'asc' },
    })
    return NextResponse.json(docs)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const check = await canAddDocument(session.workspace?.id!)
    if (!check.allowed) return NextResponse.json({ error: check.reason }, { status: 403 })
    const body = await req.json()
    if (!body.name || !body.expiryDate) return NextResponse.json({ error: 'Name and expiry date required' }, { status: 400 })
    const doc = await prisma.document.create({
      data: {
        ...body,
        workspaceId: session.workspace?.id!,
        createdById: session.user.id,
        expiryDate: new Date(body.expiryDate),
        issueDate: body.issueDate ? new Date(body.issueDate) : null,
      },
    })
    return NextResponse.json(doc, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
