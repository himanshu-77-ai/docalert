import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import SettingsClient from '@/components/dashboard/SettingsClient'

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/login')
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id:true, name:true, email:true, phone:true, whatsapp:true } })
  const workspace = await prisma.workspace.findUnique({ where: { id: session.workspace?.id }, select: { id:true, name:true, slug:true, plan:true } })
  return <SettingsClient user={JSON.parse(JSON.stringify(user))} workspace={JSON.parse(JSON.stringify(workspace))} session={session} />
}
