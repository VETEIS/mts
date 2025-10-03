import RoleRedirect from '@/components/auth/role-redirect'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import AdminClient from './admin-client'

export default async function AdminPage() {
  const session = await getServerSession(authOptions)

  return (
    <RoleRedirect requiredRole="ADMIN">
      <AdminClient session={session!} />
    </RoleRedirect>
  )
}