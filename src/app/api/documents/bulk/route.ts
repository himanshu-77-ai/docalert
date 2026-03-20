import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { action, ids } = await req.json()
  if (!ids?.length) return NextResponse.json({ error: 'No document IDs provided' }, { status: 400 })

  // Verify all docs belong to this workspace
  const docs = await prisma.document.findMany({
    where: { id: { in: ids }, workspaceId: session.workspace?.id },
  })
  if (docs.length !== ids.length)
    return NextResponse.json({ error: 'Some documents not found or unauthorized' }, { status: 403 })

  if (action === 'delete') {
    await prisma.document.deleteMany({ where: { id: { in: ids } } })
    return NextResponse.json({ success: true, deleted: ids.length })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
