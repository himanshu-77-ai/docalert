'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react'

function VerifyContent() {
  const params = useSearchParams()
  const router = useRouter()
  const token = params.get('token')
  const [status, setStatus] = useState<'loading'|'success'|'error'|'no-token'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) { setStatus('no-token'); return }
    fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setStatus('success')
          setTimeout(() => router.push('/dashboard'), 3000)
        } else {
          setStatus('error')
          setMessage(data.error || 'Verification failed')
        }
      })
      .catch(() => { setStatus('error'); setMessage('Something went wrong') })
  }, [token, router])

  return (
    <div className="min-h-screen bg-[#f8f7f4] flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center">
        <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-white font-bold text-lg mx-auto mb-6">D</div>

        {status === 'loading' && (
          <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
            <Loader2 size={40} className="text-gray-400 animate-spin mx-auto mb-4" />
            <h1 className="text-lg font-semibold text-gray-900 mb-2">Verifying your email...</h1>
            <p className="text-sm text-gray-500">Please wait a moment.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-500" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Email verified! 🎉</h1>
            <p className="text-sm text-gray-500 mb-6">Your email has been confirmed. Redirecting to dashboard...</p>
            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div className="h-full bg-green-500 rounded-full animate-[progress_3s_linear_forwards]" style={{width:'0%',animation:'progress 3s linear forwards'}} />
            </div>
            <style>{`@keyframes progress{from{width:0%}to{width:100%}}`}</style>
            <Link href="/dashboard" className="mt-4 inline-block text-sm text-gray-500 hover:text-gray-900 underline">
              Go to dashboard now →
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle size={32} className="text-red-500" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Verification failed</h1>
            <p className="text-sm text-red-500 mb-2">{message}</p>
            <p className="text-xs text-gray-400 mb-6">The link may have expired (24 hrs) or already been used.</p>
            <div className="space-y-2">
              <Link href="/dashboard" className="w-full bg-gray-900 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-800 transition-all block">
                Go to dashboard
              </Link>
              <p className="text-xs text-gray-400 mt-2">
                Need a new link? Update your email in{' '}
                <Link href="/settings" className="text-gray-600 underline">Settings</Link>
              </p>
            </div>
          </div>
        )}

        {status === 'no-token' && (
          <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail size={32} className="text-amber-500" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Check your email</h1>
            <p className="text-sm text-gray-500 mb-6">
              We sent a verification link to your email address. Click the link to verify your account.
            </p>
            <Link href="/dashboard" className="w-full bg-gray-900 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-800 transition-all block">
              Go to dashboard anyway
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f8f7f4] flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-gray-400" />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  )
}
