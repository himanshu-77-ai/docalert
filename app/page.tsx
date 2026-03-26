import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">DocAlert</h1>
        <p className="text-lg text-slate-600 mb-8">Document Expiry Tracker</p>
        <Link 
          href="/auth/login" 
          className="bg-slate-900 text-white px-6 py-3 rounded-lg hover:bg-slate-800"
        >
          Get Started
        </Link>
      </div>
    </div>
  )
}
