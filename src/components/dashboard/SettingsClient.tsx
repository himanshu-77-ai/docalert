'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { CheckCircle, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import Sidebar from './Sidebar'

export default function SettingsClient({ user: initUser, workspace, session }: any) {
  const [profile, setProfile] = useState({
    name: initUser?.name || '',
    phone: initUser?.phone || '',
    whatsapp: initUser?.whatsapp || '',
  })
  const [saving, setSaving] = useState(false)
  const [pwForm, setPwForm] = useState({ current:'', next:'', confirm:'' })
  const [savingPw, setSavingPw] = useState(false)

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })
      if (!res.ok) throw new Error('Failed')
      toast.success('Profile updated!')
    } catch { toast.error('Failed to update profile') }
    finally { setSaving(false) }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault()
    if (pwForm.next !== pwForm.confirm) { toast.error('Passwords do not match'); return }
    setSavingPw(true)
    try {
      const res = await fetch('/api/user/password', {
        method:'PATCH', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.next }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Password updated!')
      setPwForm({ current:'', next:'', confirm:'' })
    } catch (err: any) { toast.error(err.message) }
    finally { setSavingPw(false) }
  }

  const plan = workspace?.plan || 'FREE'
  const whatsappEnabled = plan !== 'FREE'

  return (
    <div className="flex h-screen bg-[#f8f7f4] overflow-hidden">
      <Sidebar session={session} active="settings" />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="bg-white border-b border-gray-100 px-4 md:px-6 py-3 md:py-4 pl-14 md:pl-6 flex-shrink-0">
          <h1 className="text-base md:text-lg font-semibold text-gray-900">Settings</h1>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 max-w-2xl w-full">

          {/* Profile */}
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <h2 className="font-medium text-gray-900 mb-4 text-sm">Profile</h2>
            <form onSubmit={saveProfile} className="space-y-4">
              <div>
                <label className="label">Full name</label>
                <input className="input" value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} />
              </div>
              <div>
                <label className="label">Email address</label>
                <input className="input bg-gray-50 text-gray-400 cursor-not-allowed" value={initUser?.email} disabled readOnly />
              </div>
              <div>
                <label className="label">
                  Phone number <span className="text-xs font-normal text-gray-400">(for SMS alerts)</span>
                </label>
                <input className="input" placeholder="+91 98765 43210" value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} />
              </div>
              <div>
                <label className="label">
                  WhatsApp number
                  {!whatsappEnabled && (
                    <Link href="/billing" className="ml-2 text-xs text-amber-600 underline font-normal">Business plan required</Link>
                  )}
                </label>
                <input
                  className={`input ${!whatsappEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  placeholder="+91 98765 43210"
                  value={profile.whatsapp}
                  onChange={e => setProfile({ ...profile, whatsapp: e.target.value })}
                  disabled={!whatsappEnabled}
                />
                <p className="text-xs text-gray-400 mt-1">Include country code e.g. +91, +1, +44</p>
              </div>
              <button type="submit" disabled={saving} className="btn-primary text-sm">
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </form>
          </div>

          {/* Workspace info */}
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <h2 className="font-medium text-gray-900 mb-3 text-sm">Workspace</h2>
            {[
              { label: 'Name', val: workspace?.name },
              { label: 'Slug', val: workspace?.slug },
              { label: 'Plan', val: workspace?.plan },
              { label: 'Your role', val: session.workspace?.role },
            ].map(r => (
              <div key={r.label} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-500">{r.label}</span>
                <span className="text-sm font-medium text-gray-900">{r.val}</span>
              </div>
            ))}
          </div>


          {/* Password change */}
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <h2 className="font-medium text-gray-900 mb-4 text-sm">Change password</h2>
            <form onSubmit={savePassword} className="space-y-4">
              <div>
                <label className="label">Current password</label>
                <input type="password" className="input" placeholder="••••••••" value={pwForm.current} onChange={e=>setPwForm({...pwForm,current:e.target.value})} />
              </div>
              <div>
                <label className="label">New password</label>
                <input type="password" className="input" placeholder="Min. 8 characters" value={pwForm.next} onChange={e=>setPwForm({...pwForm,next:e.target.value})} minLength={8} />
              </div>
              <div>
                <label className="label">Confirm new password</label>
                <input type="password" className="input" placeholder="Repeat new password" value={pwForm.confirm} onChange={e=>setPwForm({...pwForm,confirm:e.target.value})} />
              </div>
              <button type="submit" disabled={savingPw} className="btn-primary text-sm">{savingPw ? 'Saving...' : 'Update password'}</button>
            </form>
          </div>

          {/* Billing shortcut */}
          <Link href="/billing" className="block bg-white border border-gray-100 rounded-xl p-5 hover:border-gray-200 transition-colors group">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-medium text-gray-900 text-sm">Billing & subscription</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {plan === 'FREE' ? 'Upgrade to unlock WhatsApp alerts, more members, AI scan' : `${plan} plan — manage invoices, upgrade or cancel`}
                </p>
              </div>
              <ExternalLink size={15} className="text-gray-400 group-hover:text-gray-600 flex-shrink-0" />
            </div>
            {plan === 'FREE' && (
              <div className="mt-3 flex items-center gap-2">
                {['WhatsApp alerts', 'Unlimited docs', '10 team members'].map(f => (
                  <span key={f} className="text-xs bg-gray-50 border border-gray-200 text-gray-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle size={9} className="text-green-500" />{f}
                  </span>
                ))}
              </div>
            )}
          </Link>

        </div>
      </div>
    </div>
  )
}
