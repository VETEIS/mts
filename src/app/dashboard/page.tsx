import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import RoleRedirect from '@/components/auth/role-redirect'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import DashboardClient from './dashboard-client'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  return (
    <RoleRedirect requiredRole="REPORTER">
      <DashboardClient session={session} />
    </RoleRedirect>
  )
}