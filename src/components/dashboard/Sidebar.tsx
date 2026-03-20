'use client'
import { useState } from 'react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { LayoutDashboard, FileText, Bell, Users, Settings, LogOut, Menu, X, BarChart3, RefreshCw, CreditCard } from 'lucide-react'

const NAV = [
  { href:'/dashboard',     icon:LayoutDashboard, label:'Dashboard',   key:'dashboard' },
  { href:'/documents',     icon:FileText,         label:'Documents',   key:'documents' },
  { href:'/analytics',     icon:BarChart3,        label:'Analytics',   key:'analytics' },
  { href:'/renewal',       icon:RefreshCw,        label:'Renewals',    key:'renewal' },
  { href:'/notifications', icon:Bell,             label:'Alerts',      key:'notifications' },
  { href:'/team',          icon:Users,            label:'Team',        key:'team' },
  { href:'/billing',       icon:CreditCard,       label:'Billing',     key:'billing' },
  { href:'/settings',      icon:Settings,         label:'Settings',    key:'settings' },
]

export default function Sidebar({ session, active }: { session: any; active: string }) {
  const [open, setOpen] = useState(false)
  const plan = session.workspace?.plan || 'FREE'

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-3.5 left-3.5 z-50 p-2 bg-white border border-gray-200 rounded-lg shadow-sm"
        aria-label="Open menu"
      >
        <Menu size={17} />
      </button>

      <aside className={`
        ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
        fixed md:relative z-40 w-56 h-full bg-white border-r border-gray-100
        flex flex-col transition-transform duration-200 ease-in-out flex-shrink-0
      `}>
        {/* Logo */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center text-white text-xs font-bold">D</div>
            <div>
              <p className="text-sm font-semibold text-gray-900 leading-tight">DocAlert</p>
              <p className="text-xs text-gray-400 truncate max-w-[7rem]">{session.workspace?.name}</p>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="md:hidden p-1 hover:bg-gray-100 rounded">
            <X size={15} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {NAV.map(item => (
            <Link
              key={item.key}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                active === item.key
                  ? 'bg-gray-100 font-medium text-gray-900'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              }`}
            >
              <item.icon size={15} />
              {item.label}
              {item.key === 'billing' && plan !== 'FREE' && (
                <span className="ml-auto text-xs bg-gray-900 text-white px-1.5 py-0.5 rounded-full">{plan}</span>
              )}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-gray-100 space-y-1">
          {plan === 'FREE' && (
            <Link href="/billing" onClick={() => setOpen(false)} className="block bg-gradient-to-br from-gray-900 to-gray-700 rounded-lg p-2.5 mb-2 hover:opacity-90 transition-opacity">
              <p className="text-xs font-semibold text-white">Upgrade to Business</p>
              <p className="text-xs text-gray-400 mt-0.5">WhatsApp alerts · Unlimited docs</p>
              <p className="text-xs text-amber-400 mt-1 font-medium">$19/mo →</p>
            </Link>
          )}
          <div className="flex items-center gap-2 px-2 py-1">
            <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium text-gray-700 flex-shrink-0">
              {session.user?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">{session.user?.name}</p>
              <p className="text-xs text-gray-400 capitalize">{session.workspace?.role?.toLowerCase()}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <LogOut size={13} /> Sign out
          </button>
        </div>
      </aside>

      {open && <div className="fixed inset-0 bg-black/20 z-30 md:hidden" onClick={() => setOpen(false)} />}
    </>
  )
}
