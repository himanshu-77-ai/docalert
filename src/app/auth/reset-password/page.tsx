'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Eye, EyeOff } from 'lucide-react'

function ResetForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { toast.error('Passwords do not match'); return }
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Password reset! Please sign in.')
      router.push('/auth/login')
    } catch (err: any) { toast.error(err.message) }
    finally { setLoading(false) }
  }

  if (!token) return (
    <div className="text-center">
      <p className="text-red-600 text-sm mb-4">Invalid reset link.</p>
      <Link href="/auth/forgot-password" className="btn-primary">Request new link</Link>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">New password</label>
        <div className="relative">
          <input type={show ? 'text' : 'password'} className="input pr-10" placeholder="Min. 8 characters" value={password} onChange={e => setPassword(e.target.value)} minLength={8} required />
          <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {show ? <EyeOff size={15}/> : <Eye size={15}/>}
          </button>
        </div>
      </div>
      <div>
        <label className="label">Confirm password</label>
        <input type={show ? 'text' : 'password'} className="input" placeholder="Repeat password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
      </div>
      <button type="submit" disabled={loading} className="w-full bg-gray-900 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-800 transition-all disabled:opacity-60">
        {loading ? 'Resetting...' : 'Reset password'}
      </button>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#f8f7f4] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-white font-bold text-lg mx-auto mb-3">D</div>
          <h1 className="text-2xl font-bold text-gray-900">Set new password</h1>
          <p className="text-sm text-gray-500 mt-1">Choose a strong password for your account</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <Suspense fallback={<div className="text-center text-sm text-gray-500">Loading...</div>}>
            <ResetForm />
          </Suspense>
        </div>
        <p className="text-center text-sm text-gray-500 mt-4">
          <Link href="/auth/login" className="text-gray-900 font-semibold hover:underline">Back to sign in</Link>
        </p>
      </div>
    </div>
  )
}
