'use client'
import { differenceInDays, format } from 'date-fns'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import Sidebar from './Sidebar'

const STATUS_COLORS = { expired:'#ef4444', urgent:'#f59e0b', soon:'#eab308', valid:'#22c55e' }
const CAT_COLORS = ['#1e293b','#334155','#475569','#64748b','#94a3b8','#cbd5e1','#e2e8f0']
const CAT_ICONS: Record<string,string> = {
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

function ScoreRing({ score }: { score: number }) {
  const r = 52; const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  const color = score >= 80 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444'
  return (
    <div className="flex items-center justify-center">
      <svg width="140" height="140" className="-rotate-90">
        <circle cx="70" cy="70" r={r} fill="none" stroke="#f1f5f9" strokeWidth="10"/>
        <circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{transition:'stroke-dasharray 0.8s ease'}}/>
      </svg>
      <div className="absolute text-center">
        <div className="text-3xl font-bold" style={{color}}>{score}%</div>
        <div className="text-xs text-gray-500">compliant</div>
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-2.5 shadow-lg text-xs">
      <p className="font-medium text-gray-900 mb-1">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{background:p.color}}/>
          <span className="text-gray-600 capitalize">{p.name}: </span>
          <span className="font-medium">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function AnalyticsClient({ docs, statusBreakdown, categoryBreakdown, timeline, complianceScore, upcoming, session }: any) {
  const statusData = [
    { name:'Valid', value: statusBreakdown.valid, color: STATUS_COLORS.valid },
    { name:'Expiring', value: statusBreakdown.soon, color: STATUS_COLORS.soon },
    { name:'Urgent', value: statusBreakdown.urgent, color: STATUS_COLORS.urgent },
    { name:'Expired', value: statusBreakdown.expired, color: STATUS_COLORS.expired },
  ].filter(d => d.value > 0)

  return (
    <div className="flex h-screen bg-[#f8f7f4] overflow-hidden">
      <Sidebar session={session} active="analytics" />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="bg-white border-b border-gray-100 px-4 md:px-6 py-3 md:py-4 pl-14 md:pl-6 flex-shrink-0">
          <h1 className="text-base md:text-lg font-semibold text-gray-900">Analytics</h1>
          <p className="text-xs text-gray-400">{docs.length} documents tracked</p>
        </header>

        <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-4">
          {/* Top stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label:'Total documents', value: docs.length, sub:'in workspace', color:'text-gray-900' },
              { label:'Expired', value: statusBreakdown.expired, sub:'need immediate action', color:'text-red-600' },
              { label:'Expiring ≤30 days', value: statusBreakdown.urgent, sub:'urgent renewals', color:'text-amber-600' },
              { label:'Compliance score', value: `${complianceScore}%`, sub:'documents in order', color: complianceScore>=80?'text-green-600':complianceScore>=50?'text-amber-600':'text-red-600' },
            ].map(s => (
              <div key={s.label} className="bg-white border border-gray-100 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
            {/* Compliance Ring */}
            <div className="bg-white border border-gray-100 rounded-xl p-5">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Compliance health</h3>
              <div className="relative flex items-center justify-center mb-4">
                <ScoreRing score={complianceScore} />
              </div>
              <div className="space-y-2">
                {statusData.map(s => (
                  <div key={s.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{background:s.color}}/>
                      <span className="text-xs text-gray-600">{s.name}</span>
                    </div>
                    <span className="text-xs font-medium text-gray-900">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Status pie chart */}
            <div className="bg-white border border-gray-100 rounded-xl p-5">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Status breakdown</h3>
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                      dataKey="value" paddingAngle={3}>
                      {statusData.map((entry, i) => <Cell key={i} fill={entry.color}/>)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />}/>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data yet</div>
              )}
            </div>

            {/* Upcoming expiries */}
            <div className="bg-white border border-gray-100 rounded-xl p-5">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Expiring in 30 days</h3>
              {upcoming.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-center">
                  <div className="text-2xl mb-2">🎉</div>
                  <p className="text-sm text-gray-500">No urgent expirations!</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {upcoming.map((doc: any) => {
                    const st = getStatus(doc.expiryDate)
                    return (
                      <div key={doc.id} className="flex items-center gap-2.5">
                        <span className="text-base">{CAT_ICONS[doc.category]||'📄'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-900 truncate">{doc.name}</p>
                          <p className="text-xs text-gray-400">{format(new Date(doc.expiryDate),'dd MMM yyyy')}</p>
                        </div>
                        <span className="text-xs font-medium whitespace-nowrap" style={{color:st.color}}>
                          {st.days === 0 ? 'Today' : `${st.days}d`}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Timeline chart */}
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <h3 className="text-sm font-medium text-gray-900 mb-1">Expiry timeline</h3>
            <p className="text-xs text-gray-400 mb-4">Documents expiring by month (next 12 months)</p>
            <ResponsiveContainer width="100%" height={180} className="md:!h-[220px]">
              <BarChart data={timeline} barGap={2} barSize={18}>
                <XAxis dataKey="month" tick={{fontSize:11, fill:'#9ca3af'}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize:11, fill:'#9ca3af'}} axisLine={false} tickLine={false} allowDecimals={false}/>
                <Tooltip content={<CustomTooltip />}/>
                <Bar dataKey="count" name="expiring" fill="#1e293b" radius={[4,4,0,0]}/>
                <Bar dataKey="expired" name="expired" fill="#ef4444" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Category breakdown */}
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <h3 className="text-sm font-medium text-gray-900 mb-4">By category</h3>
            {categoryBreakdown.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No documents yet</p>
            ) : (
              <div className="space-y-3">
                {categoryBreakdown.map(({ cat, count }: any, i: number) => {
                  const pct = Math.round((count / docs.length) * 100)
                  return (
                    <div key={cat} className="flex items-center gap-3">
                      <span className="text-base w-6 text-center">{CAT_ICONS[cat]||'📄'}</span>
                      <span className="text-sm text-gray-700 w-36 flex-shrink-0">{cat.replace(/_/g,' ')}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2">
                        <div className="h-2 rounded-full transition-all duration-500" style={{width:`${pct}%`, background: CAT_COLORS[i % CAT_COLORS.length]}}/>
                      </div>
                      <span className="text-xs text-gray-500 w-14 text-right">{count} ({pct}%)</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
