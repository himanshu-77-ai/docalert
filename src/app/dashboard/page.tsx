import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { differenceInDays } from 'date-fns'
import DashboardClient from '@/components/dashboard/DashboardClient'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/login')

  const docs = await prisma.document.findMany({
    where: { workspaceId: session.workspace?.id },
    orderBy: { expiryDate: 'asc' },
  })

  const now = new Date()
  const stats = {
    total: docs.length,
    expired: docs.filter(d => differenceInDays(d.expiryDate, now) < 0).length,
    urgent: docs.filter(d => { const d2 = differenceInDays(d.expiryDate, now); return d2 >= 0 && d2 <= 30 }).length,
    expiringSoon: docs.filter(d => { const d2 = differenceInDays(d.expiryDate, now); return d2 > 30 && d2 <= 90 }).length,
    valid: docs.filter(d => differenceInDays(d.expiryDate, now) > 90).length,
  }

  return <DashboardClient docs={JSON.parse(JSON.stringify(docs))} stats={stats} session={session} />
}
