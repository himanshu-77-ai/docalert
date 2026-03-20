import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhookSignature } from '@/lib/razorpay'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get('x-razorpay-signature') || ''

    // Verify signature
    if (!verifyWebhookSignature(body, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const event = JSON.parse(body)
    const payload = event.payload

    switch (event.event) {
      // Payment captured — subscription activated
      case 'subscription.activated':
      case 'payment.captured': {
        const sub = payload.subscription?.entity || payload.payment?.entity
        const workspaceId = sub?.notes?.workspaceId
        const plan = sub?.notes?.plan
        if (workspaceId && plan) {
          await prisma.workspace.update({
            where: { id: workspaceId },
            data: { plan: plan as any },
          })
        }
        break
      }

      // Subscription renewed (monthly payment success)
      case 'subscription.charged': {
        const sub = payload.subscription?.entity
        const workspaceId = sub?.notes?.workspaceId
        const plan = sub?.notes?.plan
        if (workspaceId && plan) {
          await prisma.workspace.update({
            where: { id: workspaceId },
            data: { plan: plan as any },
          })
        }
        break
      }

      // Payment failed — downgrade to FREE
      case 'subscription.halted':
      case 'payment.failed': {
        const sub = payload.subscription?.entity
        const workspaceId = sub?.notes?.workspaceId
        if (workspaceId) {
          await prisma.workspace.update({
            where: { id: workspaceId },
            data: { plan: 'FREE' },
          })
        }
        break
      }

      // Subscription cancelled
      case 'subscription.cancelled':
      case 'subscription.completed': {
        const sub = payload.subscription?.entity
        const workspaceId = sub?.notes?.workspaceId
        if (workspaceId) {
          await prisma.workspace.update({
            where: { id: workspaceId },
            data: { plan: 'FREE', stripeSubId: null },
          })
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (e: any) {
    console.error('Razorpay webhook error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
