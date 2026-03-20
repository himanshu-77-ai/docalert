import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import TeamClient from '@/components/dashboard/TeamClient'

export default async function TeamPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/login')
  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId: session.workspace?.id },
    include: { user: { select: { id:true, name:true, email:true, createdAt:true } } },
    orderBy: { joinedAt: 'asc' },
  })
  return <TeamClient members={JSON.parse(JSON.stringify(members))} session={session} />
}
