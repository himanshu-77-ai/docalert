'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CheckCircle, ArrowRight, Plus, Bell, Users, BarChart3, ChevronRight } from 'lucide-react'

const STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to DocAlert! 👋',
    subtitle: "Let's get you set up in 2 minutes",
    illustration: '📋',
  },
  {
    id: 'add-doc',
    title: 'Add your first document',
    subtitle: 'Track any document — ID, passport, license, contract...',
    illustration: '🪪',
  },
  {
    id: 'alerts',
    title: 'Get notified before expiry',
    subtitle: 'Email, WhatsApp & SMS alerts — never miss a renewal',
    illustration: '🔔',
  },
  {
    id: 'team',
    title: 'Invite your team',
    subtitle: 'Collaborate with colleagues — assign roles and tasks',
    illustration: '👥',
  },
  {
    id: 'done',
    title: "You're all set! 🎉",
    subtitle: 'Your DocAlert workspace is ready to go',
    illustration: '✅',
  },
]

const CATEGORIES = [
  { value:'PERSONAL_ID', label:'National ID', icon:'🪪' },
  { value:'PASSPORT', label:'Passport', icon:'🛂' },
  { value:'BUSINESS_LICENSE', label:'Business License', icon:'🏢' },
  { value:'INSURANCE', label:'Insurance', icon:'🛡️' },
  { value:'CONTRACT', label:'Contract', icon:'📝' },
  { value:'VEHICLE', label:'Vehicle Reg.', icon:'🚗' },
  { value:'MEDICAL', label:'Medical Cert.', icon:'🏥' },
  { value:'OTHER', label:'Other', icon:'📄' },
]

export default function OnboardingClient({ session }: any) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [docForm, setDocForm] = useState({ name:'', category:'PERSONAL_ID', expiryDate:'' })
  const [alertEmail, setAlertEmail] = useState(true)
  const [alertWhatsapp, setAlertWhatsapp] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [docAdded, setDocAdded] = useState(false)
  const [alertSaved, setAlertSaved] = useState(false)
  const [inviteSent, setInviteSent] = useState(false)

  const totalSteps = STEPS.length
  const progress = Math.round((step / (totalSteps - 1)) * 100)

  async function handleAddDoc() {
    if (!docForm.name || !docForm.expiryDate) { toast.error('Please fill in document name and expiry date'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/documents', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(docForm),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      setDocAdded(true)
      toast.success('Document added!')
      setTimeout(() => setStep(2), 800)
    } catch (err: any) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  async function handleSaveAlerts() {
    setSaving(true)
    try {
      const channels: string[] = ['IN_APP']
      if (alertEmail) channels.push('EMAIL')
      if (alertWhatsapp) channels.push('WHATSAPP')

      // Create default alert rules (30 days, 7 days)
      await Promise.all([
        fetch('/api/alerts', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ daysBeforeExpiry:30, channels }) }),
        fetch('/api/alerts', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ daysBeforeExpiry:7, channels }) }),
      ])
      setAlertSaved(true)
      toast.success('Alert preferences saved!')
      setTimeout(() => setStep(3), 800)
    } catch { toast.error('Failed to save alerts') }
    finally { setSaving(false) }
  }

  async function handleInvite() {
    if (!inviteEmail) { setStep(4); return }
    setSaving(true)
    try {
      const res = await fetch('/api/team', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ email: inviteEmail, role: 'MANAGER' }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      setInviteSent(true)
      toast.success('Invite sent!')
      setTimeout(() => setStep(4), 800)
    } catch (err: any) {
      toast.error(err.message)
      // Still proceed to next step
      setTimeout(() => setStep(4), 1200)
    } finally { setSaving(false) }
  }

  async function handleFinish() {
    setSaving(true)
    try {
      await fetch('/api/onboarding', { method: 'POST' })
      router.push('/dashboard')
    } catch {
      router.push('/dashboard')
    }
  }

  const cur = STEPS[step]

  return (
    <div className="min-h-screen bg-[#f8f7f4] flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8">
        <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center text-white text-sm font-bold">D</div>
        <span className="font-semibold text-gray-900">DocAlert</span>
      </div>

      <div className="w-full max-w-md">
        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            <span>Step {step + 1} of {totalSteps}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gray-900 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Card */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-6 pt-8 pb-6 text-center border-b border-gray-50">
            <div className="text-5xl mb-4">{cur.illustration}</div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">{cur.title}</h1>
            <p className="text-sm text-gray-500">{cur.subtitle}</p>
          </div>

          {/* Step content */}
          <div className="p-6">
            {/* Step 0: Welcome */}
            {step === 0 && (
              <div className="space-y-3">
                {[
                  { icon:<Plus size={16}/>, label:'Add & track documents', color:'bg-blue-50 text-blue-600' },
                  { icon:<Bell size={16}/>, label:'Get alerts before expiry', color:'bg-amber-50 text-amber-600' },
                  { icon:<Users size={16}/>, label:'Collaborate with team', color:'bg-purple-50 text-purple-600' },
                  { icon:<BarChart3 size={16}/>, label:'Analytics & compliance score', color:'bg-green-50 text-green-600' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                    <div className={`w-8 h-8 ${item.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      {item.icon}
                    </div>
                    <span className="text-sm font-medium text-gray-700">{item.label}</span>
                    <CheckCircle size={14} className="text-green-500 ml-auto flex-shrink-0" />
                  </div>
                ))}
                <button onClick={() => setStep(1)} className="w-full mt-2 bg-gray-900 text-white py-3 rounded-xl font-semibold text-sm hover:bg-gray-800 transition-all flex items-center justify-center gap-2">
                  Get started <ArrowRight size={15}/>
                </button>
              </div>
            )}

            {/* Step 1: Add document */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="label">Document name *</label>
                  <input className="input" placeholder="e.g. National ID Card" value={docForm.name} onChange={e=>setDocForm({...docForm,name:e.target.value})} autoFocus />
                </div>
                <div>
                  <label className="label">Category</label>
                  <div className="grid grid-cols-4 gap-2">
                    {CATEGORIES.map(c => (
                      <button key={c.value} type="button" onClick={()=>setDocForm({...docForm,category:c.value})}
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-xs transition-all ${docForm.category===c.value ? 'border-gray-900 bg-gray-50 font-medium' : 'border-gray-200 hover:border-gray-300'}`}>
                        <span className="text-xl">{c.icon}</span>
                        <span className="text-gray-600 leading-tight text-center">{c.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label">Expiry date *</label>
                  <input type="date" className="input" value={docForm.expiryDate} onChange={e=>setDocForm({...docForm,expiryDate:e.target.value})} />
                </div>
                <div className="flex gap-3 pt-1">
                  <button onClick={()=>setStep(2)} className="flex-1 btn-secondary text-sm">Skip</button>
                  <button onClick={handleAddDoc} disabled={saving||docAdded} className="flex-1 bg-gray-900 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-800 disabled:opacity-60 flex items-center justify-center gap-2">
                    {docAdded ? <><CheckCircle size={14}/>Added!</> : saving ? 'Adding...' : 'Add document'}
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Alerts */}
            {step === 2 && (
              <div className="space-y-4">
                <p className="text-xs text-gray-500 mb-2">Choose how you want to receive expiry alerts:</p>
                {[
                  { key:'email', label:'Email alerts', sublabel:'Via SendGrid — free', icon:'📧', enabled:alertEmail, set:setAlertEmail, always:true },
                  { key:'whatsapp', label:'WhatsApp alerts', sublabel:'Business plan required', icon:'💬', enabled:alertWhatsapp, set:setAlertWhatsapp, always:false },
                ].map(ch => (
                  <button key={ch.key} type="button" onClick={()=>!ch.always&&ch.set(!ch.enabled)}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${ch.enabled ? 'border-gray-900 bg-gray-50' : 'border-gray-200'} ${ch.always ? 'cursor-default opacity-80' : 'cursor-pointer hover:border-gray-300'}`}>
                    <span className="text-2xl">{ch.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{ch.label}</p>
                      <p className="text-xs text-gray-400">{ch.sublabel}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${ch.enabled ? 'bg-gray-900 border-gray-900' : 'border-gray-300'}`}>
                      {ch.enabled && <CheckCircle size={12} className="text-white"/>}
                    </div>
                  </button>
                ))}
                <p className="text-xs text-gray-400 text-center">You'll be alerted 30 days and 7 days before expiry</p>
                <div className="flex gap-3 pt-1">
                  <button onClick={()=>setStep(3)} className="flex-1 btn-secondary text-sm">Skip</button>
                  <button onClick={handleSaveAlerts} disabled={saving||alertSaved} className="flex-1 bg-gray-900 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-800 disabled:opacity-60 flex items-center justify-center gap-2">
                    {alertSaved ? <><CheckCircle size={14}/>Saved!</> : saving ? 'Saving...' : 'Save alerts'}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Invite team */}
            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <label className="label">Team member email</label>
                  <input type="email" className="input" placeholder="colleague@company.com" value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} autoFocus />
                  <p className="text-xs text-gray-400 mt-1.5">They'll receive an invite email. They must register on DocAlert first.</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs font-medium text-gray-700 mb-2">Available roles:</p>
                  <div className="space-y-1">
                    {[
                      { role:'Admin', desc:'Full access except billing' },
                      { role:'Manager', desc:'Add, edit, upload docs' },
                      { role:'Viewer', desc:'Read-only access' },
                    ].map(r => (
                      <div key={r.role} className="flex gap-2 text-xs text-gray-600">
                        <span className="font-medium text-gray-800 w-14 flex-shrink-0">{r.role}</span>
                        <span>{r.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-1">
                  <button onClick={()=>setStep(4)} className="flex-1 btn-secondary text-sm">Skip</button>
                  <button onClick={handleInvite} disabled={saving||inviteSent} className="flex-1 bg-gray-900 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-800 disabled:opacity-60 flex items-center justify-center gap-2">
                    {inviteSent ? <><CheckCircle size={14}/>Sent!</> : saving ? 'Sending...' : 'Send invite'}
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Done */}
            {step === 4 && (
              <div className="space-y-3">
                {[
                  { label:'Workspace created', done:true },
                  { label:'First document added', done:docAdded },
                  { label:'Alert preferences set', done:alertSaved },
                  { label:'Team member invited', done:inviteSent },
                ].map(item => (
                  <div key={item.label} className={`flex items-center gap-3 p-3 rounded-xl ${item.done ? 'bg-green-50' : 'bg-gray-50'}`}>
                    <CheckCircle size={16} className={item.done ? 'text-green-500 flex-shrink-0' : 'text-gray-300 flex-shrink-0'} />
                    <span className={`text-sm font-medium ${item.done ? 'text-green-800' : 'text-gray-400'}`}>{item.label}</span>
                  </div>
                ))}
                <button onClick={handleFinish} disabled={saving} className="w-full mt-2 bg-gray-900 text-white py-3 rounded-xl font-semibold text-sm hover:bg-gray-800 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                  {saving ? 'Loading...' : <> Go to dashboard <ChevronRight size={15}/></>}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Skip all */}
        {step > 0 && step < 4 && (
          <button onClick={()=>setStep(4)} className="mt-4 text-xs text-gray-400 hover:text-gray-600 mx-auto block transition-colors">
            Skip setup →
          </button>
        )}
      </div>
    </div>
  )
}
