import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import NotificationsClient from '@/components/dashboard/NotificationsClient'

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/login')
  const notifs = await prisma.notification.findMany({
    where: { userId: session.user.id },
    include: { document: { select: { name:true, category:true } } },
    orderBy: { sentAt: 'desc' },
    take: 50,
  })
  const alertRules = await prisma.alertRule.findMany({
    where: { workspaceId: session.workspace?.id }
  })
  return <NotificationsClient notifs={JSON.parse(JSON.stringify(notifs))} alertRules={JSON.parse(JSON.stringify(alertRules))} session={session} />
}
