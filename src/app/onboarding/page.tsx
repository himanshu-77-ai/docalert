import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import OnboardingClient from '@/components/onboarding/OnboardingClient'

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/login')

  // Already has docs → skip onboarding
  const docCount = await prisma.document.count({ where: { workspaceId: session.workspace?.id } })
  const done = await prisma.notification.findFirst({
    where: { userId: session.user.id, type: 'SYSTEM', title: 'onboarding_complete' },
  })
  if (docCount > 0 || done) redirect('/dashboard')

  return <OnboardingClient session={session} />
}
