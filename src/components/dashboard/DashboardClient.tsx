'use client'
import { useState } from 'react'
import Link from 'next/link'
import { differenceInDays, format } from 'date-fns'
import { FileText, AlertTriangle, CheckCircle, Clock, Plus, TrendingUp } from 'lucide-react'
import Sidebar from './Sidebar'

const CAT_ICONS: Record<string, string> = {
  PERSONAL_ID:'🪪',PASSPORT:'🛂',BUSINESS_LICENSE:'🏢',INSURANCE:'🛡️',
  CONTRACT:'📝',MEDICAL:'🏥',CERTIFICATION:'🎓',PERMIT:'📋',
  VEHICLE:'🚗',PROPERTY:'🏠',TAX:'💰',OTHER:'📄',
}

function getStatus(expiryDate: string) {
  const days = differenceInDays(new Date(expiryDate), new Date())
  if (days < 0) return { label:'Expired', cls:'badge-expired', color:'#dc2626', days }
  if (days <= 30) return { label:'Urgent', cls:'badge-urgent', color:'#d97706', days }
  if (days <= 90) return { label:'Expiring soon', cls:'badge-soon', color:'#ca8a04', days }
  return { label:'Valid', cls:'badge-valid', color:'#16a34a', days }
}

export default function DashboardClient({ docs, stats, session }: any) {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const filtered = docs.filter((d: any) => {
    const { days } = getStatus(d.expiryDate)
    const matchSearch = !search || d.name.toLowerCase().includes(search.toLowerCase())
    const matchFilter =
      filter==='all' ? true :
      filter==='expired' ? days < 0 :
      filter==='urgent' ? (days >= 0 && days <= 30) :
      filter==='soon' ? (days > 30 && days <= 90) : days > 90
    return matchSearch && matchFilter
  })

  return (
    <div className="flex h-screen bg-[#f8f7f4] overflow-hidden">
      <Sidebar session={session} active="dashboard" />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between pl-14 md:pl-6 flex-shrink-0">
          <div>
            <h1 className="text-base md:text-lg font-semibold text-gray-900">Dashboard</h1>
            <p className="text-xs text-gray-400 hidden sm:block">
              {new Date().toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
            </p>
          </div>
          <Link href="/documents" className="flex items-center gap-1.5 bg-gray-900 text-white px-3 py-2 rounded-lg text-xs md:text-sm font-medium hover:bg-gray-800 transition-colors">
            <Plus size={13}/><span className="hidden sm:inline">Add document</span><span className="sm:hidden">Add</span>
          </Link>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {/* Stats grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            {[
              { label:'Total', value:stats.total, Icon:FileText, bg:'bg-blue-50', color:'text-blue-600' },
              { label:'Expired', value:stats.expired, Icon:AlertTriangle, bg:'bg-red-50', color:'text-red-600' },
              { label:'Urgent ≤30d', value:stats.urgent, Icon:Clock, bg:'bg-amber-50', color:'text-amber-600' },
              { label:'Valid', value:stats.valid+stats.expiringSoon, Icon:CheckCircle, bg:'bg-green-50', color:'text-green-600' },
            ].map(s => (
              <div key={s.label} className="bg-white border border-gray-100 rounded-xl p-3 md:p-4 flex items-center gap-3">
                <div className={`w-9 h-9 md:w-10 md:h-10 ${s.bg} ${s.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <s.Icon size={17} />
                </div>
                <div className="min-w-0">
                  <p className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">{s.value}</p>
                  <p className="text-xs text-gray-500 truncate">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Alert banner for expired/urgent */}
          {(stats.expired > 0 || stats.urgent > 0) && (
            <div className={`mb-5 p-3 md:p-4 rounded-xl border flex items-start gap-3 ${stats.expired > 0 ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'}`}>
              <AlertTriangle size={16} className={stats.expired > 0 ? 'text-red-500 flex-shrink-0 mt-0.5' : 'text-amber-500 flex-shrink-0 mt-0.5'} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${stats.expired > 0 ? 'text-red-800' : 'text-amber-800'}`}>
                  {stats.expired > 0
                    ? `${stats.expired} document${stats.expired > 1 ? 's have' : ' has'} expired`
                    : `${stats.urgent} document${stats.urgent > 1 ? 's are' : ' is'} expiring within 30 days`}
                </p>
                <p className={`text-xs mt-0.5 ${stats.expired > 0 ? 'text-red-600' : 'text-amber-600'}`}>
                  Take action immediately to stay compliant.
                </p>
              </div>
              <Link href="/documents" className={`text-xs font-medium whitespace-nowrap ${stats.expired > 0 ? 'text-red-700' : 'text-amber-700'} hover:underline`}>
                View →
              </Link>
            </div>
          )}

          {/* Filters + search */}
          <div className="flex flex-col sm:flex-row gap-2 mb-3">
            <input
              type="text"
              placeholder="Search documents..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input flex-1 text-sm"
            />
            <div className="flex gap-1.5 flex-wrap">
              {([['all','All'],['expired','Expired'],['urgent','Urgent'],['soon','Soon'],['valid','Valid']] as [string,string][]).map(([f, label]) => (
                <button key={f} onClick={() => setFilter(f)} className={`px-2.5 py-1.5 rounded-full text-xs font-medium transition-colors ${filter===f?'bg-gray-900 text-white':'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Document list */}
          <div className="space-y-2">
            {filtered.length === 0 ? (
              <div className="bg-white border border-gray-100 rounded-xl p-10 text-center">
                <div className="text-4xl mb-3">📋</div>
                <p className="font-medium text-gray-900 mb-1">No documents found</p>
                <p className="text-sm text-gray-500 mb-4">
                  {docs.length === 0 ? 'Add your first document to get started.' : 'Try adjusting filters.'}
                </p>
                {docs.length === 0 && (
                  <Link href="/documents" className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium">
                    <Plus size={14}/> Add first document
                  </Link>
                )}
              </div>
            ) : filtered.map((doc: any) => {
              const st = getStatus(doc.expiryDate)
              const pct = Math.max(0, Math.min(100, st.days > 0 ? Math.round((st.days / 365) * 100) : 0))
              return (
                <div key={doc.id} className="bg-white border border-gray-100 rounded-xl p-3 md:p-4 flex items-center gap-3 hover:border-gray-200 transition-colors">
                  <div className="w-9 h-9 bg-gray-50 rounded-lg flex items-center justify-center text-lg flex-shrink-0">
                    {CAT_ICONS[doc.category] || '📄'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{doc.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{doc.category.replace(/_/g,' ')}{doc.notes ? ` · ${doc.notes}` : ''}</p>
                    {/* Progress bar - only on md+ */}
                    <div className="hidden sm:block mt-1.5 w-28 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width:`${pct}%`, background:st.color }} />
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <span className={st.cls}>{st.label}</span>
                    <p className="text-xs text-gray-400 mt-1">{format(new Date(doc.expiryDate), 'dd MMM yyyy')}</p>
                    <p className="text-xs mt-0.5 font-medium" style={{ color:st.color }}>
                      {st.days < 0 ? `${Math.abs(st.days)}d ago` : st.days === 0 ? 'Today' : `${st.days}d`}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Analytics shortcut */}
          {docs.length >= 3 && (
            <Link href="/analytics" className="mt-4 flex items-center justify-between bg-white border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
                  <TrendingUp size={16} className="text-gray-700" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">View analytics</p>
                  <p className="text-xs text-gray-400">Charts, compliance score, expiry timeline</p>
                </div>
              </div>
              <span className="text-gray-400 group-hover:text-gray-600 transition-colors">→</span>
            </Link>
          )}
        </main>
      </div>
    </div>
  )
}
