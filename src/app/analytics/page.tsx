import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { differenceInDays } from 'date-fns'
import AnalyticsClient from '@/components/dashboard/AnalyticsClient'

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/login')

  const docs = await prisma.document.findMany({
    where: { workspaceId: session.workspace?.id },
    orderBy: { expiryDate: 'asc' },
  })

  const now = new Date()

  // Status breakdown
  const statusBreakdown = { expired:0, urgent:0, soon:0, valid:0 }
  docs.forEach(d => {
    const days = differenceInDays(d.expiryDate, now)
    if (days < 0) statusBreakdown.expired++
    else if (days <= 30) statusBreakdown.urgent++
    else if (days <= 90) statusBreakdown.soon++
    else statusBreakdown.valid++
  })

  // Category breakdown
  const catMap: Record<string, number> = {}
  docs.forEach(d => { catMap[d.category] = (catMap[d.category]||0) + 1 })
  const categoryBreakdown = Object.entries(catMap)
    .map(([cat, count]) => ({ cat, count }))
    .sort((a,b) => b.count - a.count)

  // Expiry timeline — next 12 months, docs expiring per month
  const timeline: { month: string; count: number; expired: number }[] = []
  for (let i = -1; i < 12; i++) {
    const d = new Date(now)
    d.setMonth(d.getMonth() + i)
    const monthDocs = docs.filter(doc => {
      const exp = new Date(doc.expiryDate)
      return exp.getFullYear() === d.getFullYear() && exp.getMonth() === d.getMonth()
    })
    timeline.push({
      month: d.toLocaleString('default', { month: 'short', year: '2-digit' }),
      count: monthDocs.filter(doc => differenceInDays(doc.expiryDate, now) >= 0).length,
      expired: monthDocs.filter(doc => differenceInDays(doc.expiryDate, now) < 0).length,
    })
  }

  // Compliance score
  const total = docs.length
  const compliant = total > 0 ? Math.round(((statusBreakdown.valid + statusBreakdown.soon) / total) * 100) : 100

  // Upcoming expirations (next 30 days)
  const upcoming = docs
    .filter(d => { const days = differenceInDays(d.expiryDate, now); return days >= 0 && days <= 30 })
    .slice(0, 5)

  return (
    <AnalyticsClient
      docs={JSON.parse(JSON.stringify(docs))}
      statusBreakdown={statusBreakdown}
      categoryBreakdown={categoryBreakdown}
      timeline={timeline}
      complianceScore={compliant}
      upcoming={JSON.parse(JSON.stringify(upcoming))}
      session={session}
    />
  )
}
