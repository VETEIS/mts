import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'

interface RoleRedirectProps {
  children: React.ReactNode
  requiredRole?: 'ADMIN' | 'REPORTER'
  adminEmail?: string
}

export default async function RoleRedirect({ 
  children, 
  requiredRole,
  adminEmail = 'vescoton0@gmail.com'
}: RoleRedirectProps) {
  const session = await getServerSession(authOptions)

  // Not authenticated - redirect to signin
  if (!session) {
    redirect('/auth/signin')
  }

  const isAdmin = session.user?.email === adminEmail

  // Admin trying to access reporter routes - redirect to admin
  if (isAdmin && requiredRole === 'REPORTER') {
    redirect('/admin')
  }

  // Non-admin trying to access admin routes - redirect to dashboard
  if (!isAdmin && requiredRole === 'ADMIN') {
    redirect('/dashboard')
  }

  // Home page redirects
  if (!requiredRole) {
    if (isAdmin) {
      redirect('/admin')
    } else {
      redirect('/dashboard')
    }
  }

  return <>{children}</>
}
