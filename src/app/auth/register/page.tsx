'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { toast } from 'sonner'

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', workspaceName: '' })
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Registration failed')
      await signIn('credentials', { email: form.email, password: form.password, redirect: false })
      toast.success('Account created! Welcome to DocAlert.')
      router.push('/onboarding')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f7f4] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-white font-bold text-lg mx-auto mb-3">D</div>
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="text-sm text-gray-500 mt-1">Start tracking documents for free</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full name</label>
              <input className="input" placeholder="John Smith" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            </div>
            <div>
              <label className="label">Work email</label>
              <input type="email" className="input" placeholder="you@company.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" className="input" placeholder="Min. 8 characters" minLength={8} value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
            </div>
            <div>
              <label className="label">Company / workspace name</label>
              <input className="input" placeholder="Acme Corp" value={form.workspaceName} onChange={e => setForm({...form, workspaceName: e.target.value})} required />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-gray-900 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-800 transition-all disabled:opacity-60">
              {loading ? 'Creating account...' : 'Create free account'}
            </button>
          </form>
        </div>
        <p className="text-center text-xs text-gray-400 mt-4">
          By signing up you agree to our{' '}
          <a href="#" className="underline">Terms</a> and{' '}
          <a href="#" className="underline">Privacy Policy</a>
        </p>
        <p className="text-center text-sm text-gray-500 mt-2">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-gray-900 font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
