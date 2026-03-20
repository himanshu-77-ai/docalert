"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import toast from "react-hot-toast"
import { signIn } from "next-auth/react"

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    workspaceName: "",
  })

  function update(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Registration failed")

      toast.success("Account created! Signing you in...")
      await signIn("credentials", {
        email: form.email,
        password: form.password,
        callbackUrl: "/dashboard",
        redirect: true,
      })
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center text-xl">📋</div>
          <span className="text-white font-semibold text-lg">DocAlert</span>
        </div>
        <div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Start for free.<br />Upgrade anytime.
          </h1>
          <p className="text-slate-400 text-lg">
            Set up your workspace in under 2 minutes. No credit card required.
          </p>
          <div className="mt-10 space-y-3">
            {[
              "✓ 10 documents free forever",
              "✓ Email expiry alerts included",
              "✓ Upgrade for WhatsApp & SMS",
              "✓ Invite your team anytime",
            ].map((f) => (
              <div key={f} className="text-slate-300 text-sm">{f}</div>
            ))}
          </div>
        </div>
        <p className="text-slate-600 text-sm">© {new Date().getFullYear()} DocAlert</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <span className="text-2xl">📋</span>
            <span className="font-bold text-slate-900 text-xl">DocAlert</span>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-1">Create account</h2>
          <p className="text-slate-500 text-sm mb-8">Set up your workspace — it takes 2 minutes.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Full name</label>
                <input className="input" type="text" placeholder="Rahul Sharma" value={form.name}
                  onChange={(e) => update("name", e.target.value)} required autoFocus />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Work email</label>
                <input className="input" type="email" placeholder="rahul@company.com" value={form.email}
                  onChange={(e) => update("email", e.target.value)} required />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                <input className="input" type="password" placeholder="At least 6 characters" value={form.password}
                  onChange={(e) => update("password", e.target.value)} required minLength={6} />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Workspace name
                  <span className="text-slate-400 font-normal ml-1">(your company / team name)</span>
                </label>
                <input className="input" type="text" placeholder="Acme Corp" value={form.workspaceName}
                  onChange={(e) => update("workspaceName", e.target.value)} required />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating workspace...
                </span>
              ) : (
                "Create free account →"
              )}
            </button>

            <p className="text-xs text-slate-400 text-center">
              By creating an account, you agree to our Terms of Service and Privacy Policy.
            </p>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-slate-900 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
