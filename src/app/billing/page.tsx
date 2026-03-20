import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import BillingClient from '@/components/dashboard/BillingClient'

export default async function BillingPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/login')

  const workspace = await prisma.workspace.findUnique({
    where: { id: session.workspace?.id },
    select: { id:true, name:true, plan:true, stripeSubId:true },
  })

  return (
    <BillingClient
      workspace={JSON.parse(JSON.stringify(workspace))}
      session={session}
      isOwner={session.workspace?.role === 'OWNER'}
    />
  )
}
