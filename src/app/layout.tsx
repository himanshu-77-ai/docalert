import type { Metadata, Viewport } from 'next'
import { Toaster } from 'sonner'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'DocAlert — Document Expiry Tracker', template: '%s | DocAlert' },
  description: 'Never miss a document expiry. Track, manage and get Email, WhatsApp & SMS alerts for all your important documents.',
  keywords: ['document tracker', 'expiry alerts', 'document management', 'renewal tracker', 'compliance'],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'DocAlert',
  },
  openGraph: {
    title: 'DocAlert — Document Expiry Tracker',
    description: 'Never miss a document expiry. Track all your documents in one place.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#1a1917',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=DM+Mono&display=swap" rel="stylesheet" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>
        {children}
        <Toaster richColors position="top-center" mobileOffset={16} />
      </body>
    </html>
  )
}
