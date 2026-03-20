import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import RenewalClient from '@/components/dashboard/RenewalClient'

export default async function RenewalPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/login')

  const tasks = await prisma.renewalTask.findMany({
    where: { workspaceId: session.workspace?.id },
    include: {
      document: { select: { id:true, name:true, category:true, expiryDate:true } },
      assignee: { select: { id:true, name:true, email:true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId: session.workspace?.id },
    include: { user: { select: { id:true, name:true, email:true } } },
  })

  const urgentDocs = await prisma.document.findMany({
    where: {
      workspaceId: session.workspace?.id,
      expiryDate: { lte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) },
    },
    orderBy: { expiryDate: 'asc' },
    take: 20,
  })

  return (
    <RenewalClient
      tasks={JSON.parse(JSON.stringify(tasks))}
      members={JSON.parse(JSON.stringify(members))}
      urgentDocs={JSON.parse(JSON.stringify(urgentDocs))}
      session={session}
    />
  )
}
