import { prisma } from './prisma'

export const PLAN_LIMITS = {
  FREE:       { docs: 10,  members: 1,  whatsapp: false, ai: false, analytics: true },
  BUSINESS:   { docs: -1,  members: 10, whatsapp: true,  ai: false, analytics: true },
  ENTERPRISE: { docs: -1,  members: -1, whatsapp: true,  ai: true,  analytics: true },
}

export async function canAddDocument(workspaceId: string): Promise<{ allowed: boolean; reason?: string }> {
  const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } })
  if (!workspace) return { allowed: false, reason: 'Workspace not found' }

  const limit = PLAN_LIMITS[workspace.plan].docs
  if (limit === -1) return { allowed: true }

  const count = await prisma.document.count({ where: { workspaceId } })
  if (count >= limit) return { allowed: false, reason: `Free plan allows max ${limit} documents. Upgrade to add more.` }
  return { allowed: true }
}

export async function canAddMember(workspaceId: string): Promise<{ allowed: boolean; reason?: string }> {
  const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } })
  if (!workspace) return { allowed: false, reason: 'Workspace not found' }

  const limit = PLAN_LIMITS[workspace.plan].members
  if (limit === -1) return { allowed: true }

  const count = await prisma.workspaceMember.count({ where: { workspaceId } })
  if (count >= limit) return { allowed: false, reason: `Your plan allows max ${limit} member(s). Upgrade to add more.` }
  return { allowed: true }
}

export function canUseWhatsApp(plan: string): boolean {
  return PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS]?.whatsapp ?? false
}

export function canUseAI(plan: string): boolean {
  return PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS]?.ai ?? false
}
