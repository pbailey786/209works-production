import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default auth((req: NextRequest & { auth: any }) => {
  console.log('🛡️ Middleware v5 processing:', req.nextUrl.pathname)
  
  const { pathname } = req.nextUrl
  const session = req.auth

  console.log('🛡️ Session exists:', !!session)
  if (session?.user) {
    console.log('🛡️ User role:', (session.user as any)?.role)
    console.log('🛡️ User ID:', session.user.id)
  }

  // Routes that require email verification
  const emailVerificationRequired = [
    '/employers',
    '/admin',
    '/profile',
    '/applications',
    '/saved-jobs',
    '/job-alerts',
    '/apply'
  ]

  // Check if email verification is required for this route
  const requiresVerification = emailVerificationRequired.some(route =>
    pathname.startsWith(route)
  )

  // Comprehensive Role-Based Access Control (RBAC)
  if (session?.user) {
    const userRole = (session.user as any)?.role
    console.log('🛡️ User data for RBAC:', { 
      id: session.user.id, 
      role: userRole, 
      email: session.user.email,
    })

    // Check if session has required user data
    if (!session.user.id) {
      console.warn('⚠️ Session missing user ID - session may be incomplete')
      // Allow navigation but log the issue
    }

    // Define role-specific protected routes
    const jobSeekerRoutes = ['/dashboard', '/profile', '/applications', '/saved-jobs', '/job-alerts']
    const employerRoutes = ['/employers']
    const adminRoutes = ['/admin']

    // Check if current path matches any protected route patterns
    const isJobSeekerRoute = jobSeekerRoutes.some(route =>
      pathname === route || pathname.startsWith(route + '/')
    )
    const isEmployerRoute = employerRoutes.some(route =>
      pathname === route || pathname.startsWith(route + '/')
    )
    const isAdminRoute = adminRoutes.some(route =>
      pathname === route || pathname.startsWith(route + '/')
    )

    // Role-based access control
    if (userRole === 'employer') {
      // Employers trying to access job seeker routes
      if (isJobSeekerRoute) {
        return NextResponse.redirect(new URL('/employers/dashboard', req.url))
      }
      // Redirect generic /dashboard to employer dashboard
      if (pathname === '/dashboard') {
        return NextResponse.redirect(new URL('/employers/dashboard', req.url))
      }
    } else if (userRole === 'jobseeker') {
      // Job seekers trying to access employer routes
      if (isEmployerRoute) {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    } else if (userRole === 'admin') {
      // Admins have access to all routes, no restrictions
    } else {
      // Unknown role - redirect to home
      if (isJobSeekerRoute || isEmployerRoute || isAdminRoute) {
        return NextResponse.redirect(new URL('/', req.url))
      }
    }
  }

  // If user is authenticated and visiting root, redirect based on role
  if (pathname === '/' && session?.user) {
    const userRole = (session.user as any)?.role
    if (userRole === 'admin') {
      return NextResponse.redirect(new URL('/admin', req.url))
    }
    if (userRole === 'employer') {
      return NextResponse.redirect(new URL('/employers/dashboard', req.url))
    }
    // Job seekers stay on home page
    return NextResponse.next()
  }

  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    // If no database URL, allow access to show error page
    if (!process.env.DATABASE_URL) {
      return NextResponse.next()
    }
    if (!session?.user || (session.user as any)?.role !== 'admin') {
      return NextResponse.redirect(new URL('/signin?redirect=/admin', req.url))
    }
  }

  // Protect employer routes
  if (pathname.startsWith('/employers')) {
    if (!session?.user || (session.user as any)?.role !== 'employer') {
      return NextResponse.redirect(new URL('/employers/signin?redirect=' + encodeURIComponent(pathname), req.url))
    }
  }

  console.log('🛡️ Middleware complete, allowing request')
  return NextResponse.next()
})

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes) - API routes handle their own auth
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Only protect page routes, not API routes
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}