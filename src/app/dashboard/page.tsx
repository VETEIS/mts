import RoleRedirect from '@/components/auth/role-redirect'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import DashboardClient from './dashboard-client'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return null
  }

  return (
    <RoleRedirect requiredRole="REPORTER">
      <DashboardClient session={session} />
    </RoleRedirect>
  )
}