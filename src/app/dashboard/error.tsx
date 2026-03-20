'use client'
import { useEffect } from 'react'
import { RefreshCw, AlertTriangle } from 'lucide-react'

export default function DashboardError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])
  return (
    <div className="flex h-screen items-center justify-center bg-[#f8f7f4]">
      <div className="text-center p-8 max-w-xs">
        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={22} className="text-red-500" />
        </div>
        <h2 className="font-semibold text-gray-900 mb-2">Dashboard error</h2>
        <p className="text-sm text-gray-500 mb-5">Failed to load. Please try refreshing.</p>
        <button onClick={reset} className="flex items-center gap-2 mx-auto bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>
    </div>
  )
}
