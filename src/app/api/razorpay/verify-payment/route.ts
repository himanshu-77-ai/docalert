import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { verifyPaymentSignature } from '@/lib/razorpay'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature, plan } = await req.json()

    // Verify payment signature
    const isValid = verifyPaymentSignature({
      orderId: razorpay_subscription_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    })

    if (!isValid) return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })

    // Upgrade workspace plan
    await prisma.workspace.update({
      where: { id: session.workspace?.id },
      data: {
        plan: plan as any,
        stripeSubId: razorpay_subscription_id,
      },
    })

    return NextResponse.json({ success: true, plan })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
