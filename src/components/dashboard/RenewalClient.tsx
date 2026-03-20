'use client'
import { useState } from 'react'
import { differenceInDays, format } from 'date-fns'
import { Plus, X, CheckCircle, Clock, AlertTriangle, RefreshCw, Trash2, User } from 'lucide-react'
import { toast } from 'sonner'
import Sidebar from './Sidebar'

const CAT_ICONS: Record<string,string> = {
  PERSONAL_ID:'🪪',PASSPORT:'🛂',BUSINESS_LICENSE:'🏢',INSURANCE:'🛡️',
  CONTRACT:'📝',MEDICAL:'🏥',CERTIFICATION:'🎓',PERMIT:'📋',
  VEHICLE:'🚗',PROPERTY:'🏠',TAX:'💰',OTHER:'📄',
}

const STATUS_CONFIG = {
  PENDING:     { label:'Pending',     color:'text-amber-600',  bg:'bg-amber-50',  Icon: Clock },
  IN_PROGRESS: { label:'In progress', color:'text-blue-600',   bg:'bg-blue-50',   Icon: RefreshCw },
  COMPLETED:   { label:'Completed',   color:'text-green-600',  bg:'bg-green-50',  Icon: CheckCircle },
  CANCELLED:   { label:'Cancelled',   color:'text-gray-500',   bg:'bg-gray-100',  Icon: X },
}

export default function RenewalClient({ tasks: initTasks, members, urgentDocs, session }: any) {
  const [tasks, setTasks] = useState(initTasks)
  const [showAdd, setShowAdd] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')
  const [form, setForm] = useState({ documentId:'', assignedTo:'', notes:'', dueDate:'' })
  const [saving, setSaving] = useState(false)

  const filtered = tasks.filter((t: any) => filterStatus === 'all' || t.status === filterStatus)

  const counts = { all: tasks.length, PENDING:0, IN_PROGRESS:0, COMPLETED:0, CANCELLED:0 }
  tasks.forEach((t: any) => { counts[t.status as keyof typeof counts]++ })

  async function createTask(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    try {
      const res = await fetch('/api/renewal', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setTasks((p: any[]) => [data, ...p])
      toast.success('Renewal task created!')
      setShowAdd(false); setForm({ documentId:'', assignedTo:'', notes:'', dueDate:'' })
    } catch (err: any) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  async function updateStatus(id: string, status: string) {
    try {
      const res = await fetch(`/api/renewal/${id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ status }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setTasks((p: any[]) => p.map(t => t.id === id ? data : t))
      toast.success(`Marked as ${status.toLowerCase().replace('_',' ')}`)
    } catch (err: any) { toast.error(err.message) }
  }

  async function deleteTask(id: string) {
    try {
      await fetch(`/api/renewal/${id}`, { method:'DELETE' })
      setTasks((p: any[]) => p.filter(t => t.id !== id))
      toast.success('Task removed')
    } catch { toast.error('Failed to delete') }
  }

  return (
    <div className="flex h-screen bg-[#f8f7f4] overflow-hidden">
      <Sidebar session={session} active="renewal" />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="bg-white border-b border-gray-100 px-4 md:px-6 py-3 md:py-4 pl-14 md:pl-6 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-base md:text-lg font-semibold text-gray-900">Renewal tasks</h1>
            <p className="text-xs text-gray-400">{tasks.filter((t:any)=>t.status==='PENDING'||t.status==='IN_PROGRESS').length} active tasks</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 bg-gray-900 text-white px-3 py-2 rounded-lg text-xs md:text-sm font-medium hover:bg-gray-800 transition-colors">
            <Plus size={13}/><span className="hidden sm:inline">Create task</span><span className="sm:hidden">Add</span>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
              const Icon = cfg.Icon
              return (
                <div key={key} className="bg-white border border-gray-100 rounded-xl p-3 flex items-center gap-2.5">
                  <div className={`w-8 h-8 ${cfg.bg} ${cfg.color} rounded-lg flex items-center justify-center`}><Icon size={14}/></div>
                  <div>
                    <p className="text-lg font-bold text-gray-900">{counts[key as keyof typeof counts]}</p>
                    <p className="text-xs text-gray-400">{cfg.label}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Filters */}
          <div className="flex gap-1.5 mb-4 flex-wrap">
            {[['all','All'],['PENDING','Pending'],['IN_PROGRESS','In progress'],['COMPLETED','Completed'],['CANCELLED','Cancelled']].map(([v,l]) => (
              <button key={v} onClick={()=>setFilterStatus(v)} className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${filterStatus===v?'bg-gray-900 text-white':'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{l}</button>
            ))}
          </div>

          {/* Tasks list */}
          <div className="space-y-2">
            {filtered.length === 0 ? (
              <div className="bg-white border border-gray-100 rounded-xl p-10 text-center">
                <div className="text-4xl mb-3">✅</div>
                <p className="font-medium text-gray-900 mb-1">No renewal tasks</p>
                <p className="text-sm text-gray-500 mb-4">Create tasks to track document renewals.</p>
                <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium">
                  <Plus size={14}/> Create first task
                </button>
              </div>
            ) : filtered.map((task: any) => {
              const days = differenceInDays(new Date(task.document.expiryDate), new Date())
              const cfg = STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG]
              const Icon = cfg.Icon
              return (
                <div key={task.id} className={`bg-white border border-gray-100 rounded-xl p-4 ${task.status==='COMPLETED'?'opacity-60':''}`}>
                  <div className="flex items-start gap-3">
                    <span className="text-xl flex-shrink-0 mt-0.5">{CAT_ICONS[task.document.category]||'📄'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <p className="font-medium text-gray-900 text-sm">{task.document.name}</p>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                          <Icon size={10}/>{cfg.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className={`text-xs font-medium ${days < 0 ? 'text-red-600' : days <= 30 ? 'text-amber-600' : 'text-gray-500'}`}>
                          {days < 0 ? `Expired ${Math.abs(days)}d ago` : `Expires in ${days}d`} · {format(new Date(task.document.expiryDate),'dd MMM yyyy')}
                        </span>
                        {task.assignee && (
                          <span className="flex items-center gap-1 text-xs text-gray-500"><User size={10}/>{task.assignee.name}</span>
                        )}
                        {task.dueDate && (
                          <span className="text-xs text-gray-500">Due: {format(new Date(task.dueDate),'dd MMM')}</span>
                        )}
                      </div>
                      {task.notes && <p className="text-xs text-gray-500 mt-1 italic">"{task.notes}"</p>}
                      {/* Actions */}
                      <div className="flex gap-1.5 mt-2.5 flex-wrap">
                        {task.status === 'PENDING' && (
                          <button onClick={() => updateStatus(task.id,'IN_PROGRESS')} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-lg font-medium hover:bg-blue-100 transition-colors">Start</button>
                        )}
                        {(task.status === 'PENDING' || task.status === 'IN_PROGRESS') && (
                          <button onClick={() => updateStatus(task.id,'COMPLETED')} className="px-2.5 py-1 bg-green-50 text-green-700 text-xs rounded-lg font-medium hover:bg-green-100 transition-colors">Complete</button>
                        )}
                        {task.status !== 'CANCELLED' && task.status !== 'COMPLETED' && (
                          <button onClick={() => updateStatus(task.id,'CANCELLED')} className="px-2.5 py-1 bg-gray-50 text-gray-600 text-xs rounded-lg font-medium hover:bg-gray-100 transition-colors">Cancel</button>
                        )}
                        <button onClick={() => deleteTask(task.id)} className="px-2.5 py-1 bg-red-50 text-red-600 text-xs rounded-lg font-medium hover:bg-red-100 transition-colors flex items-center gap-1"><Trash2 size={10}/>Remove</button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Create task modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={e=>e.target===e.currentTarget&&setShowAdd(false)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Create renewal task</h2>
              <button onClick={()=>setShowAdd(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18}/></button>
            </div>
            <form onSubmit={createTask} className="p-5 space-y-4">
              <div>
                <label className="label">Select document *</label>
                <select className="input" value={form.documentId} onChange={e=>setForm({...form,documentId:e.target.value})} required>
                  <option value="">-- Choose document --</option>
                  {urgentDocs.map((d: any) => {
                    const days = differenceInDays(new Date(d.expiryDate), new Date())
                    return <option key={d.id} value={d.id}>{CAT_ICONS[d.category]} {d.name} ({days < 0 ? `${Math.abs(days)}d expired` : `${days}d left`})</option>
                  })}
                </select>
              </div>
              <div>
                <label className="label">Assign to</label>
                <select className="input" value={form.assignedTo} onChange={e=>setForm({...form,assignedTo:e.target.value})}>
                  <option value="">-- Unassigned --</option>
                  {members.map((m: any) => <option key={m.user.id} value={m.user.id}>{m.user.name} ({m.role})</option>)}
                </select>
              </div>
              <div>
                <label className="label">Due date</label>
                <input type="date" className="input" value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})} />
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea className="input resize-none h-16" placeholder="e.g. Contact agent for renewal quote..." value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={()=>setShowAdd(false)} className="flex-1 btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 btn-primary">{saving?'Creating...':'Create task'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
