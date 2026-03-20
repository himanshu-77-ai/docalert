import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { razorpay, PLANS } from '@/lib/razorpay'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { plan } = await req.json()
    const planConfig = PLANS[plan as keyof typeof PLANS]
    if (!planConfig) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

    const workspace = await prisma.workspace.findUnique({
      where: { id: session.workspace?.id },
    })
    if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

    // Create Razorpay subscription
    const subscription = await razorpay.subscriptions.create({
      plan_id: planConfig.planId,
      customer_notify: 1,
      quantity: 1,
      total_count: 12,         // 12 billing cycles
      addons: [],
      notes: {
        workspaceId: workspace.id,
        workspaceName: workspace.name,
        plan,
        userEmail: session.user.email,
      },
    })

    // Save subscription ID to workspace
    await prisma.workspace.update({
      where: { id: workspace.id },
      data: { stripeSubId: subscription.id },   // reusing stripeSubId field for Razorpay sub ID
    })

    return NextResponse.json({
      subscriptionId: subscription.id,
      keyId: process.env.RAZORPAY_KEY_ID,
      amount: planConfig.price,
      currency: planConfig.currency,
      planName: planConfig.name,
      prefill: {
        name: session.user.name || '',
        email: session.user.email || '',
      },
    })
  } catch (e: any) {
    console.error('Razorpay subscription error:', e)
    return NextResponse.json({ error: e.message || 'Failed to create subscription' }, { status: 500 })
  }
}
