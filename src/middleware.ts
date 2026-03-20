import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        // Public routes
        if (
          pathname === '/' ||
          pathname.startsWith('/auth/') ||
          pathname.startsWith('/onboarding') ||
          pathname.startsWith('/api/auth/') ||
          pathname.startsWith('/api/razorpay/webhook') ||
          pathname.startsWith('/_next/') ||
          pathname.startsWith('/public/') ||
          pathname === '/manifest.json' ||
          pathname === '/favicon.ico'
        ) return true
        // Protected routes require token
        return !!token
      },
    },
  }
)

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json|icon-.*\\.png).*)'],
}
