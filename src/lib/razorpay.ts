import Razorpay from 'razorpay'
import crypto from 'crypto'

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

// Plan config — create these in Razorpay dashboard
export const PLANS = {
  BUSINESS: {
    planId: process.env.RAZORPAY_BUSINESS_PLAN_ID!,
    name: 'Business',
    price: 1599,        // INR paise = ₹1599/mo (~$19)
    currency: 'INR',
    docLimit: -1,
    memberLimit: 10,
  },
  ENTERPRISE: {
    planId: process.env.RAZORPAY_ENTERPRISE_PLAN_ID!,
    name: 'Enterprise',
    price: 3999,        // ₹3999/mo (~$49)
    currency: 'INR',
    docLimit: -1,
    memberLimit: -1,
  },
}

export const PLAN_LIMITS = {
  FREE:       { docs: 10,  members: 1  },
  BUSINESS:   { docs: -1,  members: 10 },
  ENTERPRISE: { docs: -1,  members: -1 },
}

// Verify Razorpay webhook signature
export function verifyWebhookSignature(body: string, signature: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest('hex')
  return expectedSignature === signature
}

// Verify payment signature (after checkout)
export function verifyPaymentSignature({
  orderId, paymentId, signature,
}: { orderId: string; paymentId: string; signature: string }): boolean {
  const body = orderId + '|' + paymentId
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest('hex')
  return expectedSignature === signature
}
