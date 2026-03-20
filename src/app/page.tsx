import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f8f7f4]" style={{fontFamily:"'DM Sans', sans-serif"}}>
      {/* Nav */}
      <nav className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center text-white text-sm font-bold">D</div>
          <span className="font-semibold text-gray-900 text-lg">DocAlert</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth/login" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Sign in</Link>
          <Link href="/auth/register" className="btn-primary text-sm px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
            Get started free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium px-3 py-1.5 rounded-full mb-8">
          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
          Never miss a document expiry again
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
          Your documents,<br />
          <span className="text-transparent bg-clip-text" style={{backgroundImage:'linear-gradient(135deg, #1a1917 0%, #6b6861 100%)'}}>always under control</span>
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          Track expiry dates, get alerts via Email, WhatsApp & SMS, collaborate with your team, and never let an important document slip through the cracks.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/auth/register" className="w-full sm:w-auto bg-gray-900 text-white px-8 py-3.5 rounded-xl font-semibold text-sm hover:bg-gray-800 transition-all">
            Start for free →
          </Link>
          <Link href="/auth/login" className="w-full sm:w-auto bg-white border border-gray-200 text-gray-700 px-8 py-3.5 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-all">
            Sign in to your account
          </Link>
        </div>
        <p className="text-xs text-gray-400 mt-4">Free plan available · No credit card required</p>
      </section>

      {/* Stats */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { num: '10K+', label: 'Documents tracked' },
            { num: '99.9%', label: 'Uptime SLA' },
            { num: '3', label: 'Alert channels' },
            { num: '< 1min', label: 'Alert delivery' },
          ].map(s => (
            <div key={s.num} className="bg-white border border-gray-100 rounded-xl p-5 text-center">
              <div className="text-2xl font-bold text-gray-900">{s.num}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-3">Everything you need</h2>
        <p className="text-gray-500 text-center mb-12">Built for businesses that take document compliance seriously.</p>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { icon: '📋', title: 'Smart tracking', desc: 'Auto-calculate days remaining. Color-coded status: expired, urgent, soon, valid.' },
            { icon: '🔔', title: 'Multi-channel alerts', desc: 'Get reminders via Email, WhatsApp, and SMS at 90, 30, 7, and 1 days before expiry.' },
            { icon: '👥', title: 'Team collaboration', desc: 'Invite team members with role-based access: Admin, Manager, or Viewer.' },
            { icon: '📁', title: 'File storage', desc: 'Upload and store PDFs, images. View documents in-browser without downloading.' },
            { icon: '📊', title: 'Analytics dashboard', desc: 'Visual reports: expiry timeline, category breakdown, compliance health score.' },
            { icon: '🤖', title: 'AI auto-scan', desc: 'Upload a document and AI extracts the expiry date automatically. (Enterprise)' },
          ].map(f => (
            <div key={f.title} className="bg-white border border-gray-100 rounded-xl p-6 hover:border-gray-300 transition-colors">
              <div className="text-2xl mb-3">{f.icon}</div>
              <div className="font-semibold text-gray-900 mb-2">{f.title}</div>
              <div className="text-sm text-gray-500 leading-relaxed">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-3">Simple pricing</h2>
        <p className="text-gray-500 text-center mb-12">Start free, upgrade when you need more.</p>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { name: 'Starter', price: 'Free', sub: 'Forever', features: ['1 user', '10 documents', 'Email alerts', 'Basic dashboard'], cta: 'Get started', featured: false },
            { name: 'Business', price: '$19', sub: '/month', features: ['10 users', 'Unlimited documents', 'Email + WhatsApp + SMS', 'Team roles', 'CSV/PDF export', 'Analytics'], cta: 'Start free trial', featured: true },
            { name: 'Enterprise', price: '$49', sub: '/month', features: ['Unlimited users', 'AI auto-scan', 'White-label', 'API access', 'Custom alerts', 'Priority support'], cta: 'Contact sales', featured: false },
          ].map(p => (
            <div key={p.name} className={`rounded-xl p-6 ${p.featured ? 'bg-gray-900 text-white ring-2 ring-gray-900' : 'bg-white border border-gray-200'}`}>
              {p.featured && <div className="text-xs font-medium bg-amber-400 text-gray-900 px-2 py-1 rounded-full inline-block mb-3">Most popular</div>}
              <div className={`font-semibold mb-1 ${p.featured ? 'text-gray-200' : 'text-gray-700'}`}>{p.name}</div>
              <div className={`text-3xl font-bold mb-1 ${p.featured ? 'text-white' : 'text-gray-900'}`}>{p.price}<span className={`text-sm font-normal ${p.featured ? 'text-gray-400' : 'text-gray-500'}`}>{p.sub}</span></div>
              <ul className={`text-sm mt-4 mb-6 space-y-2 ${p.featured ? 'text-gray-300' : 'text-gray-600'}`}>
                {p.features.map(f => <li key={f} className="flex items-center gap-2"><span className="text-green-400">✓</span>{f}</li>)}
              </ul>
              <Link href="/auth/register" className={`block text-center py-2.5 rounded-lg text-sm font-semibold transition-all ${p.featured ? 'bg-white text-gray-900 hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'}`}>
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-900 rounded-md flex items-center justify-center text-white text-xs font-bold">D</div>
            <span className="font-semibold text-gray-900 text-sm">DocAlert</span>
          </div>
          <p className="text-xs text-gray-400">© 2025 DocAlert. All rights reserved.</p>
          <div className="flex gap-4 text-xs text-gray-400">
            <a href="#" className="hover:text-gray-600">Privacy</a>
            <a href="#" className="hover:text-gray-600">Terms</a>
            <a href="#" className="hover:text-gray-600">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
