'use client'
import { useState, useEffect, Suspense } from 'react'
import { format } from 'date-fns'
import { CreditCard, CheckCircle, AlertTriangle, Zap, Shield, Star, X, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter, useSearchParams } from 'next/navigation'
import Sidebar from './Sidebar'

declare global { interface Window { Razorpay: any } }

const PLAN_CONFIG = {
  FREE: {
    color:'text-gray-600', bg:'bg-gray-100', border:'border-gray-200',
    icon:'🆓', label:'Starter (Free)',
    features:['10 documents','1 user','Email alerts only','Basic dashboard'],
  },
  BUSINESS: {
    color:'text-blue-700', bg:'bg-blue-50', border:'border-blue-200',
    icon:'💼', label:'Business',
    features:['Unlimited documents','10 team members','Email + WhatsApp + SMS','Analytics & reports','Priority support'],
  },
  ENTERPRISE: {
    color:'text-purple-700', bg:'bg-purple-50', border:'border-purple-200',
    icon:'🏢', label:'Enterprise',
    features:['Unlimited everything','AI document auto-scan','White-label branding','API access','Dedicated support'],
  },
}

function SuccessBanner() {
  const params = useSearchParams()
  if (!params.get('upgraded')) return null
  return (
    <div className="mb-5 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
      <CheckCircle size={18} className="text-green-600 flex-shrink-0" />
      <div>
        <p className="text-sm font-medium text-green-800">Payment successful! 🎉</p>
        <p className="text-xs text-green-600">Your plan has been upgraded. New features are now active.</p>
      </div>
    </div>
  )
}

export default function BillingClient({ workspace, session, isOwner }: any) {
  const [loadingUpgrade, setLoadingUpgrade] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [showCancel, setShowCancel] = useState(false)
  const [razorpayLoaded, setRazorpayLoaded] = useState(false)
  const router = useRouter()

  const plan = workspace?.plan || 'FREE'
  const cfg = PLAN_CONFIG[plan as keyof typeof PLAN_CONFIG]
  const isPaid = plan !== 'FREE'

  // Load Razorpay script
  useEffect(() => {
    if (window.Razorpay) { setRazorpayLoaded(true); return }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => setRazorpayLoaded(true)
    script.onerror = () => toast.error('Failed to load payment gateway')
    document.body.appendChild(script)
  }, [])

  async function handleUpgrade(targetPlan: string) {
    if (!razorpayLoaded) { toast.error('Payment gateway loading...'); return }
    setLoadingUpgrade(targetPlan)
    try {
      // Step 1: Create subscription on server
      const res = await fetch('/api/razorpay/create-subscription', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: targetPlan }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      // Step 2: Open Razorpay popup
      const rzp = new window.Razorpay({
        key: data.keyId,
        subscription_id: data.subscriptionId,
        name: 'DocAlert',
        description: `${data.planName} Plan — Monthly`,
        image: '/icon-192.png',
        currency: data.currency,
        prefill: { name: data.prefill.name, email: data.prefill.email },
        theme: { color: '#1a1917' },
        handler: async function(response: any) {
          // Step 3: Verify payment on server
          const verifyRes = await fetch('/api/razorpay/verify-payment', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_subscription_id: response.razorpay_subscription_id,
              razorpay_signature: response.razorpay_signature,
              plan: targetPlan,
            }),
          })
          const verifyData = await verifyRes.json()
          if (!verifyRes.ok) { toast.error(verifyData.error); return }
          toast.success(`Upgraded to ${targetPlan} plan! 🎉`)
          router.push('/billing?upgraded=true')
          router.refresh()
        },
        modal: {
          ondismiss: () => { toast.info('Payment cancelled'); setLoadingUpgrade('') },
        },
      })
      rzp.on('payment.failed', (resp: any) => {
        toast.error(`Payment failed: ${resp.error.description}`)
        setLoadingUpgrade('')
      })
      rzp.open()
    } catch (err: any) {
      toast.error(err.message || 'Failed to start payment')
      setLoadingUpgrade('')
    }
  }

  async function handleCancel() {
    setCancelling(true)
    try {
      const res = await fetch('/api/razorpay/cancel', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Subscription cancelled. Plan stays active till end of cycle.')
      setShowCancel(false)
      router.refresh()
    } catch (err: any) { toast.error(err.message) }
    finally { setCancelling(false) }
  }

  return (
    <div className="flex h-screen bg-[#f8f7f4] overflow-hidden">
      <Sidebar session={session} active="billing" />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="bg-white border-b border-gray-100 px-4 md:px-6 py-3 md:py-4 pl-14 md:pl-6 flex-shrink-0">
          <h1 className="text-base md:text-lg font-semibold text-gray-900">Billing & plan</h1>
          <p className="text-xs text-gray-400">Manage your subscription</p>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 max-w-3xl w-full">
          <Suspense fallback={null}><SuccessBanner /></Suspense>

          {/* Current plan */}
          <div className={`border-2 rounded-xl p-5 ${cfg.border}`}>
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{cfg.icon}</span>
                  <span className={`text-sm font-semibold px-2.5 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {isPaid ? 'Active subscription' : 'Free plan — no billing required'}
                </p>
              </div>
              {!isPaid && isOwner && (
                <button onClick={() => handleUpgrade('BUSINESS')} disabled={!!loadingUpgrade} className="flex items-center gap-1.5 bg-gray-900 text-white px-3 py-2 rounded-lg text-xs font-semibold hover:bg-gray-800 transition-colors disabled:opacity-60">
                  <Zap size={12} />{loadingUpgrade === 'BUSINESS' ? 'Loading...' : 'Upgrade now'}
                </button>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 mb-2">Included in your plan:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {cfg.features.map(f => (
                  <div key={f} className="flex items-center gap-2 text-xs text-gray-700">
                    <CheckCircle size={12} className="text-green-500 flex-shrink-0" />{f}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Upgrade plans */}
          {plan !== 'ENTERPRISE' && (
            <div className="bg-white border border-gray-100 rounded-xl p-5">
              <h2 className="font-medium text-gray-900 mb-1 text-sm">Available upgrades</h2>
              <p className="text-xs text-gray-500 mb-4">Pay with UPI, Cards, Netbanking. Cancel anytime.</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  {
                    key:'BUSINESS', name:'Business',
                    price:'₹1,599', per:'/month (~$19)',
                    icon:<Shield size={16} className="text-blue-600"/>,
                    bg:'bg-blue-50', border:'border-blue-200', tc:'text-blue-700',
                    features:['Unlimited documents','10 team members','WhatsApp + SMS alerts','Analytics','CSV/PDF export'],
                    current: plan === 'BUSINESS',
                  },
                  {
                    key:'ENTERPRISE', name:'Enterprise',
                    price:'₹3,999', per:'/month (~$49)',
                    icon:<Star size={16} className="text-purple-600"/>,
                    bg:'bg-purple-50', border:'border-purple-200', tc:'text-purple-700',
                    features:['Unlimited users','AI document auto-scan','White-label','API access','Priority support'],
                    current: plan === 'ENTERPRISE',
                  },
                ].map(p => (
                  <div key={p.key} className={`border rounded-xl p-4 ${p.current ? `${p.border} ${p.bg}` : 'border-gray-200'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 ${p.bg} rounded-lg flex items-center justify-center`}>{p.icon}</div>
                        <span className="font-semibold text-sm text-gray-900">{p.name}</span>
                        {p.current && <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${p.bg} ${p.tc}`}>Active</span>}
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-gray-900">{p.price}</span>
                        <span className="text-xs text-gray-400 block">{p.per}</span>
                      </div>
                    </div>
                    <ul className="space-y-1 mb-4">
                      {p.features.map(f => (
                        <li key={f} className="flex items-center gap-1.5 text-xs text-gray-600">
                          <CheckCircle size={10} className="text-green-500 flex-shrink-0"/>{f}
                        </li>
                      ))}
                    </ul>
                    {isOwner ? (
                      <button
                        onClick={() => !p.current && handleUpgrade(p.key)}
                        disabled={p.current || !!loadingUpgrade || !razorpayLoaded}
                        className={`w-full py-2 rounded-lg text-xs font-semibold transition-colors ${p.current ? `${p.bg} ${p.tc} cursor-default` : 'bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-60'}`}
                      >
                        {loadingUpgrade === p.key ? 'Opening payment...' : p.current ? 'Current plan' : `Pay with Razorpay →`}
                      </button>
                    ) : (
                      <p className="text-xs text-gray-400 text-center">Only workspace owner can upgrade</p>
                    )}
                  </div>
                ))}
              </div>
              {/* Payment methods */}
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-400">Accepts:</span>
                {['UPI', 'Cards', 'Netbanking', 'Wallets'].map(m => (
                  <span key={m} className="text-xs bg-gray-50 border border-gray-200 text-gray-600 px-2 py-0.5 rounded">{m}</span>
                ))}
              </div>
            </div>
          )}

          {/* Razorpay dashboard link for invoices */}
          {isPaid && (
            <div className="bg-white border border-gray-100 rounded-xl p-5">
              <h2 className="font-medium text-gray-900 mb-3 text-sm flex items-center gap-2">
                <CreditCard size={15} className="text-gray-400" />Billing history & invoices
              </h2>
              <p className="text-xs text-gray-500 mb-3">Download invoices and manage payment method from your Razorpay dashboard.</p>
              <a
                href="https://dashboard.razorpay.com/app/subscriptions"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border border-gray-200 text-gray-700 px-3 py-2 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
              >
                <ExternalLink size={13}/> Open Razorpay dashboard
              </a>
            </div>
          )}

          {/* Cancel */}
          {isPaid && isOwner && (
            <div className="bg-white border border-red-100 rounded-xl p-5">
              <h2 className="font-medium text-red-700 mb-1 text-sm flex items-center gap-2">
                <AlertTriangle size={15}/>Danger zone
              </h2>
              <p className="text-xs text-gray-500 mb-4">Cancel subscription — plan stays active till end of billing cycle. Your data is safe.</p>
              <button onClick={() => setShowCancel(true)} className="text-xs text-red-600 border border-red-200 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors font-medium">
                Cancel subscription
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cancel confirm */}
      {showCancel && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
                <AlertTriangle size={20} className="text-red-500"/>
              </div>
              <button onClick={() => setShowCancel(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X size={16}/></button>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Cancel subscription?</h3>
            <p className="text-sm text-gray-500 mb-2">Your plan stays active till end of the billing cycle, then reverts to Free.</p>
            <ul className="text-xs text-gray-500 space-y-1 mb-5">
              <li>• Documents above 10 become read-only</li>
              <li>• WhatsApp & SMS alerts will stop</li>
              <li>• Team members above 1 lose access</li>
              <li>• Your data is always safe</li>
            </ul>
            <div className="flex gap-3">
              <button onClick={() => setShowCancel(false)} className="flex-1 btn-secondary text-sm">Keep plan</button>
              <button onClick={handleCancel} disabled={cancelling} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-60 transition-colors">
                {cancelling ? 'Cancelling...' : 'Yes, cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
