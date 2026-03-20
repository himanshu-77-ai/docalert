'use client'
import { useState } from 'react'
import { Plus, X, Crown, Shield, Eye, UserCircle, Trash2, Mail } from 'lucide-react'
import { toast } from 'sonner'
import Sidebar from './Sidebar'

const ROLE_ICONS: Record<string,any> = { OWNER:Crown, ADMIN:Shield, MANAGER:UserCircle, VIEWER:Eye }
const ROLE_COLORS: Record<string,string> = {
  OWNER:'text-amber-700 bg-amber-50 border-amber-200',
  ADMIN:'text-blue-700 bg-blue-50 border-blue-200',
  MANAGER:'text-purple-700 bg-purple-50 border-purple-200',
  VIEWER:'text-gray-600 bg-gray-50 border-gray-200',
}

export default function TeamClient({ members: init, session }: any) {
  const [members, setMembers] = useState(init)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('VIEWER')
  const [loading, setLoading] = useState(false)
  const [removing, setRemoving] = useState<string|null>(null)

  const isOwnerOrAdmin = ['OWNER','ADMIN'].includes(session.workspace?.role)

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault(); setLoading(true)
    try {
      const res = await fetch('/api/team', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMembers((p: any[]) => [...p, data])
      toast.success(`${data.user.name} added! Invite email sent.`)
      setShowInvite(false); setInviteEmail('')
    } catch (err: any) { toast.error(err.message) }
    finally { setLoading(false) }
  }

  async function handleRemove(memberId: string, memberName: string) {
    if (!confirm(`Remove ${memberName} from workspace?`)) return
    setRemoving(memberId)
    try {
      const res = await fetch('/api/team', {
        method:'DELETE', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ memberId }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      setMembers((p: any[]) => p.filter(m => m.id !== memberId))
      toast.success('Member removed')
    } catch (err: any) { toast.error(err.message) }
    finally { setRemoving(null) }
  }

  return (
    <div className="flex h-screen bg-[#f8f7f4] overflow-hidden">
      <Sidebar session={session} active="team" />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="bg-white border-b border-gray-100 px-4 md:px-6 py-3 md:py-4 pl-14 md:pl-6 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-base md:text-lg font-semibold text-gray-900">Team</h1>
            <p className="text-xs text-gray-400">{members.length} member{members.length!==1?'s':''} · {session.workspace?.plan} plan</p>
          </div>
          {isOwnerOrAdmin && (
            <button onClick={()=>setShowInvite(true)} className="flex items-center gap-1.5 bg-gray-900 text-white px-3 py-2 rounded-lg text-xs md:text-sm font-medium hover:bg-gray-800 transition-colors">
              <Plus size={13}/><span className="hidden sm:inline">Add member</span><span className="sm:hidden">Add</span>
            </button>
          )}
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
          {/* Members list */}
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            {members.map((m: any, i: number) => {
              const Icon = ROLE_ICONS[m.role] || Eye
              const isCurrentUser = m.user.id === session.user?.id
              const canRemove = isOwnerOrAdmin && m.role !== 'OWNER' && !isCurrentUser
              return (
                <div key={m.id} className={`flex items-center gap-3 px-4 py-3.5 ${i < members.length-1 ? 'border-b border-gray-50' : ''}`}>
                  {/* Avatar */}
                  <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-sm font-semibold text-gray-700 flex-shrink-0">
                    {m.user.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-900 truncate">{m.user.name}</span>
                      {isCurrentUser && <span className="text-xs text-gray-400">(you)</span>}
                    </div>
                    <p className="text-xs text-gray-400 truncate">{m.user.email}</p>
                  </div>
                  {/* Role badge */}
                  <span className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${ROLE_COLORS[m.role]}`}>
                    <Icon size={11}/>{m.role}
                  </span>
                  {/* Remove */}
                  {canRemove && (
                    <button
                      onClick={() => handleRemove(m.id, m.user.name)}
                      disabled={removing === m.id}
                      className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove member"
                    >
                      <Trash2 size={14}/>
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          {/* Permissions table */}
          <div className="bg-white border border-gray-100 rounded-xl p-4 md:p-5">
            <h3 className="font-medium text-gray-900 mb-4 text-sm">Role permissions</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-max">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 pr-4 text-gray-500 font-medium">Permission</th>
                    {['OWNER','ADMIN','MANAGER','VIEWER'].map(r => (
                      <th key={r} className={`text-center py-2 px-2 text-xs font-medium ${ROLE_COLORS[r].split(' ')[0]}`}>{r}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { perm:'View documents',    roles:['OWNER','ADMIN','MANAGER','VIEWER'] },
                    { perm:'Add / edit docs',   roles:['OWNER','ADMIN','MANAGER'] },
                    { perm:'Delete documents',  roles:['OWNER','ADMIN'] },
                    { perm:'Upload files',      roles:['OWNER','ADMIN','MANAGER'] },
                    { perm:'Create renewals',   roles:['OWNER','ADMIN','MANAGER'] },
                    { perm:'Manage team',       roles:['OWNER','ADMIN'] },
                    { perm:'Configure alerts',  roles:['OWNER','ADMIN'] },
                    { perm:'Billing & plan',    roles:['OWNER'] },
                  ].map(row => (
                    <tr key={row.perm} className="border-b border-gray-50 last:border-0">
                      <td className="py-2.5 pr-4 text-gray-600 whitespace-nowrap">{row.perm}</td>
                      {['OWNER','ADMIN','MANAGER','VIEWER'].map(r => (
                        <td key={r} className="text-center py-2.5 px-2">
                          {row.roles.includes(r)
                            ? <span className="text-green-500 font-bold">✓</span>
                            : <span className="text-gray-200">—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Plan limit note */}
          {session.workspace?.plan === 'FREE' && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3">
              <span className="text-amber-500 text-base flex-shrink-0">⚠️</span>
              <div>
                <p className="text-sm font-medium text-amber-800">Free plan: 1 member limit</p>
                <p className="text-xs text-amber-600 mt-0.5">Upgrade to Business ($19/mo) to add up to 10 team members.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Invite modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={e=>e.target===e.currentTarget&&setShowInvite(false)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Add team member</h2>
              <button onClick={()=>setShowInvite(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18}/></button>
            </div>
            <form onSubmit={handleInvite} className="p-5 space-y-4">
              <div>
                <label className="label">Email address</label>
                <input type="email" className="input" placeholder="colleague@company.com" value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} required autoFocus />
                <p className="text-xs text-gray-400 mt-1">They must already have a DocAlert account. An invite email will be sent.</p>
              </div>
              <div>
                <label className="label">Role</label>
                <select className="input" value={inviteRole} onChange={e=>setInviteRole(e.target.value)}>
                  <option value="ADMIN">Admin — full access except billing</option>
                  <option value="MANAGER">Manager — add/edit/upload docs</option>
                  <option value="VIEWER">Viewer — read only</option>
                </select>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={()=>setShowInvite(false)} className="flex-1 btn-secondary">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 btn-primary flex items-center justify-center gap-2">
                  <Mail size={14}/>{loading ? 'Adding...' : 'Add & invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
