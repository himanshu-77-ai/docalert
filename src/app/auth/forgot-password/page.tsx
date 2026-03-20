'use client'
import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowLeft, Mail } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) throw new Error('Failed')
      setSent(true)
    } catch { toast.error('Something went wrong. Try again.') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-[#f8f7f4] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-white font-bold text-lg mx-auto mb-3">D</div>
          <h1 className="text-2xl font-bold text-gray-900">{sent ? 'Check your email' : 'Forgot password?'}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {sent ? `We sent a reset link to ${email}` : 'Enter your email to receive a reset link'}
          </p>
        </div>

        {sent ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm text-center">
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail size={22} className="text-green-600" />
            </div>
            <p className="text-sm text-gray-600 mb-4">If an account exists for <strong>{email}</strong>, you'll receive a password reset link shortly. Check your spam folder too.</p>
            <Link href="/auth/login" className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm">
              <ArrowLeft size={14} /> Back to sign in
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Email address</label>
                <input type="email" className="input" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-gray-900 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-800 transition-all disabled:opacity-60">
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
            </form>
          </div>
        )}

        <p className="text-center text-sm text-gray-500 mt-4">
          <Link href="/auth/login" className="text-gray-900 font-semibold hover:underline flex items-center justify-center gap-1">
            <ArrowLeft size={13} /> Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
