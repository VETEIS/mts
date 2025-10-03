import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // Check if user is admin based on role
    const isAdmin = token?.role === 'ADMIN'

    // Admin routes protection
    if (pathname.startsWith('/admin')) {
      if (!token || !isAdmin) {
        return NextResponse.redirect(new URL('/auth/signin', req.url))
      }
    }

    // Dashboard routes protection  
    if (pathname.startsWith('/dashboard')) {
      if (!token) {
        return NextResponse.redirect(new URL('/auth/signin', req.url))
      }
      // Redirect admin to admin dashboard
      if (isAdmin) {
        return NextResponse.redirect(new URL('/admin', req.url))
      }
    }

    // Redirect authenticated users away from auth pages
    if (pathname.startsWith('/auth/signin') && token) {
      if (isAdmin) {
        return NextResponse.redirect(new URL('/admin', req.url))
      } else {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // Allow access to public routes
        if (
          pathname === '/' ||
          pathname.startsWith('/auth/') ||
          pathname.startsWith('/api/auth/') ||
          pathname.startsWith('/api/debug/') ||
          pathname.startsWith('/_next/') ||
          pathname.startsWith('/favicon.ico')
        ) {
          return true
        }

        // Require authentication for protected routes
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
