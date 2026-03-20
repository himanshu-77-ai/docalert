import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import DocumentsClient from '@/components/documents/DocumentsClient'

export default async function DocumentsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/login')
  const docs = await prisma.document.findMany({
    where: { workspaceId: session.workspace?.id },
    orderBy: { expiryDate: 'asc' },
  })
  return <DocumentsClient docs={JSON.parse(JSON.stringify(docs))} session={session} />
}
