'use client'
import { useState } from 'react'
import { Bell, Mail, MessageCircle, Phone, Check, Plus, X, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import Sidebar from './Sidebar'

const CHANNEL_ICONS: Record<string,any> = { EMAIL: Mail, WHATSAPP: MessageCircle, SMS: Phone, IN_APP: Bell }
const CHANNEL_COLORS: Record<string,string> = { EMAIL:'text-blue-600 bg-blue-50', WHATSAPP:'text-green-600 bg-green-50', SMS:'text-purple-600 bg-purple-50', IN_APP:'text-gray-600 bg-gray-50' }

export default function NotificationsClient({ notifs: init, alertRules: initRules, session }: any) {
  const [notifs, setNotifs] = useState(init)
  const [rules, setRules] = useState(initRules)
  const [tab, setTab] = useState<'inbox'|'settings'>('inbox')
  const [showAddRule, setShowAddRule] = useState(false)
  const [newRule, setNewRule] = useState({ daysBeforeExpiry: 30, channels: ['EMAIL'] as string[] })
  const [saving, setSaving] = useState(false)

  async function markAllRead() {
    await fetch('/api/notifications', { method: 'PATCH' })
    setNotifs((prev: any[]) => prev.map(n => ({ ...n, isRead: true })))
    toast.success('All marked as read')
  }

  async function saveRule(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    try {
      const res = await fetch('/api/alerts', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ...newRule, workspaceId: session.workspace?.id }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setRules((prev: any[]) => [...prev, data])
      toast.success('Alert rule saved!')
      setShowAddRule(false)
    } catch (err: any) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  function toggleChannel(ch: string) {
    setNewRule(r => ({ ...r, channels: r.channels.includes(ch) ? r.channels.filter(c => c!==ch) : [...r.channels, ch] }))
  }

  const unread = notifs.filter((n: any) => !n.isRead).length

  return (
    <div className="flex h-screen bg-[#f8f7f4] overflow-hidden">
      <Sidebar session={session} active="notifications" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-100 px-4 md:px-6 py-4 flex items-center justify-between pl-14 md:pl-6">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-gray-900">Alerts</h1>
            {unread > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{unread}</span>}
          </div>
          <div className="flex gap-2">
            {tab==='inbox' && unread > 0 && (
              <button onClick={markAllRead} className="flex items-center gap-1.5 btn-secondary text-xs"><Check size={12}/>Mark all read</button>
            )}
          </div>
        </header>

        {/* Tabs */}
        <div className="bg-white border-b border-gray-100 px-6 flex gap-4">
          {(['inbox','settings'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`py-3 text-sm font-medium border-b-2 transition-colors capitalize ${tab===t ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t === 'inbox' ? `Inbox ${unread > 0 ? `(${unread})` : ''}` : 'Alert settings'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {tab === 'inbox' ? (
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              {notifs.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="text-4xl mb-3">🔔</div>
                  <div className="font-medium text-gray-900 mb-1">No notifications yet</div>
                  <div className="text-sm text-gray-500">You'll receive alerts here when documents are expiring.</div>
                </div>
              ) : notifs.map((n: any, i: number) => {
                const Icon = CHANNEL_ICONS[n.channel] || Bell
                return (
                  <div key={n.id} className={`flex items-start gap-4 px-5 py-4 ${!n.isRead ? 'bg-blue-50/30' : ''} ${i < notifs.length-1 ? 'border-b border-gray-50' : ''}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${CHANNEL_COLORS[n.channel]}`}>
                      <Icon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-sm font-medium text-gray-900">{n.title}</div>
                        {!n.isRead && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{n.message}</div>
                      <div className="text-xs text-gray-400 mt-1">{formatDistanceToNow(new Date(n.sentAt), { addSuffix: true })}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white border border-gray-100 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-medium text-gray-900">Alert rules</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Configure when and how you receive alerts</p>
                  </div>
                  <button onClick={() => setShowAddRule(true)} className="flex items-center gap-1.5 btn-primary text-xs py-1.5 px-3"><Plus size={12}/>Add rule</button>
                </div>

                {rules.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">No alert rules configured yet.</div>
                ) : (
                  <div className="space-y-2">
                    {rules.map((rule: any) => (
                      <div key={rule.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Bell size={14} className="text-gray-400" />
                        <div className="flex-1 text-sm text-gray-700">
                          Alert <span className="font-medium">{rule.daysBeforeExpiry} days</span> before expiry via{' '}
                          {rule.channels.map((c: string) => <span key={c} className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium mx-0.5 ${CHANNEL_COLORS[c]}`}>{c}</span>)}
                        </div>
                        <div className={`w-2 h-2 rounded-full ${rule.isActive ? 'bg-green-400' : 'bg-gray-300'}`} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Default alert days info */}
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                <div className="flex gap-2">
                  <span className="text-amber-500 text-lg">💡</span>
                  <div>
                    <div className="text-sm font-medium text-amber-800">Recommended alert schedule</div>
                    <div className="text-xs text-amber-700 mt-1">Set rules for 90, 30, 7, and 1 day(s) before expiry for maximum coverage. The daily cron job runs at 8:00 AM.</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add rule modal */}
      {showAddRule && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e => e.target===e.currentTarget && setShowAddRule(false)}>
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Add alert rule</h2>
              <button onClick={() => setShowAddRule(false)} className="p-1 hover:bg-gray-100 rounded"><X size={18}/></button>
            </div>
            <form onSubmit={saveRule} className="p-5 space-y-4">
              <div>
                <label className="label">Days before expiry</label>
                <select className="input" value={newRule.daysBeforeExpiry} onChange={e => setNewRule(r => ({...r, daysBeforeExpiry: Number(e.target.value)}))}>
                  {[1, 7, 14, 30, 60, 90].map(d => <option key={d} value={d}>{d} day{d!==1?'s':''} before</option>)}
                </select>
              </div>
              <div>
                <label className="label">Alert channels</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['EMAIL','WHATSAPP','SMS','IN_APP'] as const).map(ch => {
                    const Icon = CHANNEL_ICONS[ch]
                    const selected = newRule.channels.includes(ch)
                    return (
                      <button type="button" key={ch} onClick={() => toggleChannel(ch)} className={`flex items-center gap-2 p-2.5 rounded-lg border text-sm transition-all ${selected ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 hover:border-gray-300 text-gray-700'}`}>
                        <Icon size={14} /> {ch === 'IN_APP' ? 'In-app' : ch}
                      </button>
                    )
                  })}
                </div>
                {session.workspace?.plan === 'FREE' && (
                  <p className="text-xs text-amber-600 mt-2">⚠️ WhatsApp & SMS require Business plan.</p>
                )}
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowAddRule(false)} className="flex-1 btn-secondary">Cancel</button>
                <button type="submit" disabled={saving || newRule.channels.length === 0} className="flex-1 btn-primary">{saving ? 'Saving...' : 'Save rule'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
