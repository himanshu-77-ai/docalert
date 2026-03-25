'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'


export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function checkConnection() {
      try {
        console.log('Checking Supabase connection...')
        const { data, error } = await supabase
          .from('documents')
          .select('count')
          .limit(1)
        
        if (error) {
          console.error('Supabase error:', error)
          setError(error.message)
        } else {
          console.log('Supabase connected successfully!', data)
        }
      } catch (err: any) {
        console.error('Connection error:', err)
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }
    
    checkConnection()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading DocAlert...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-sm mb-8">
            <span className="text-2xl">📋</span>
            <span className="font-semibold text-slate-900">DocAlert</span>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full ml-2">
              Beta
            </span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6">
            Never Miss a
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-700 to-slate-900">
              {" "}Document Expiry
            </span>
          </h1>
          
          <p className="text-xl text-slate-600 mb-8">
            Track all your important documents. Get alerts via Email, WhatsApp & SMS before they expire.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link 
              href="/auth/login"
              className="bg-slate-900 text-white px-8 py-3 rounded-lg font-medium hover:bg-slate-800 transition-colors"
            >
              Get Started Free
            </Link>
            <Link 
              href="/auth/login"
              className="border border-slate-300 text-slate-700 px-8 py-3 rounded-lg font-medium hover:bg-slate-50 transition-colors"
            >
              Sign In
            </Link>
          </div>

          {error && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8 text-left">
              <p className="text-sm text-yellow-800">
                ⚠️ Database connection: {error}
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                App is working but database needs setup. Contact support.
              </p>
            </div>
          )}

          {/* Features Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
            {[
              { icon: "📧", label: "Email Alerts" },
              { icon: "💬", label: "WhatsApp" },
              { icon: "📱", label: "SMS Alerts" },
              { icon: "📊", label: "Analytics" },
            ].map((feature) => (
              <div key={feature.label} className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-2xl mb-2">{feature.icon}</div>
                <p className="text-sm text-slate-600">{feature.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
