import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { razorpay } from '@/lib/razorpay'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.workspace?.role !== 'OWNER')
      return NextResponse.json({ error: 'Only workspace owner can cancel subscription' }, { status: 403 })

    const workspace = await prisma.workspace.findUnique({ where: { id: session.workspace?.id } })
    if (!workspace?.stripeSubId)
      return NextResponse.json({ error: 'No active subscription found' }, { status: 400 })

    // Cancel at end of billing cycle (cancel_at_cycle_end = 1)
    await razorpay.subscriptions.cancel(workspace.stripeSubId, true)

    return NextResponse.json({ success: true, message: 'Subscription will cancel at end of billing cycle.' })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
