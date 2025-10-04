'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import Icon from '@/components/ui/icon'

interface User {
  id: string
  name: string | null
  email: string
  role: 'ADMIN' | 'REPORTER'
  isActive: boolean
  gcashQr: string | null
  createdAt: string
  _count: {
    reports: number
  }
}

interface UsersResponse {
  users: User[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<User | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/dashboard')
    }
  }, [status, session, router])

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20'
      })
      
      if (search) params.append('search', search)
      if (roleFilter !== 'ALL') params.append('role', roleFilter)

      const response = await fetch(`/api/admin/users?${params}`)
      if (response.ok) {
        const data: UsersResponse = await response.json()
        setUsers(data.users)
        setTotalPages(data.pagination.totalPages)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, search, roleFilter])

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetchUsers()
    }
  }, [session, fetchUsers])

  const handleRoleChange = async (userId: string, newRole: 'ADMIN' | 'REPORTER') => {
    try {
      setIsUpdating(true)
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          role: newRole
        })
      })

      if (response.ok) {
        // Update local state
        setUsers(prev => prev.map(user => 
          user.id === userId ? { ...user, role: newRole } : user
        ))
        setSelectedUser(null)
      } else {
        const error = await response.json()
        console.error('Error updating user:', error)
      }
    } catch (error) {
      console.error('Error updating user:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleStatusChange = async (userId: string, isActive: boolean) => {
    try {
      setIsUpdating(true)
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          isActive
        })
      })

      if (response.ok) {
        // Update local state
        setUsers(prev => prev.map(user => 
          user.id === userId ? { ...user, isActive } : user
        ))
      } else {
        const error = await response.json()
        console.error('Error updating user:', error)
      }
    } catch (error) {
      console.error('Error updating user:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      setIsUpdating(true)
      const response = await fetch(`/api/admin/users?userId=${userId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Remove user from local state
        setUsers(prev => prev.filter(user => user.id !== userId))
        setDeleteConfirm(null)
      } else {
        const error = await response.json()
        console.error('Error deleting user:', error)
        alert(error.error || 'Failed to delete user')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Failed to delete user')
    } finally {
      setIsUpdating(false)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!session || session.user.role !== 'ADMIN') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-First Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="p-2"
            >
              <Link href="/admin">
                <Icon name="back" size={20} />
              </Link>
            </Button>
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-gray-900">User Management</h1>
              <p className="text-xs text-gray-600">Manage accounts and roles</p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin">
                <Icon name="home" size={18} />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content - Mobile First */}
      <main className="px-4 py-6 space-y-6">
        {/* Filters - Mobile */}
        <div className="space-y-4">
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full"
          />
          <div className="flex space-x-2">
            <Button
              variant={roleFilter === 'ALL' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRoleFilter('ALL')}
              className="flex-1"
            >
              All
            </Button>
            <Button
              variant={roleFilter === 'ADMIN' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRoleFilter('ADMIN')}
              className="flex-1"
            >
              Admins
            </Button>
            <Button
              variant={roleFilter === 'REPORTER' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRoleFilter('REPORTER')}
              className="flex-1"
            >
              Reporters
            </Button>
          </div>
        </div>

        {/* Users List - Mobile First */}
        <div className="space-y-4">
          {users.map((user) => (
            <Card key={user.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="space-y-4">
                  {/* User Info */}
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-red-600 rounded-xl flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {user.name || 'No name'}
                      </h3>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'} className="text-xs">
                          {user.role}
                        </Badge>
                        <Badge variant={user.isActive ? 'default' : 'destructive'} className="text-xs">
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <span className="text-xs text-gray-500 flex items-center">
                          <Icon name="report" size={12} className="mr-1" />
                          {user._count.reports} reports
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions - Mobile */}
                  <div className="space-y-3">
                    {/* Role Change */}
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Role</label>
                      <Select
                        value={user.role}
                        onValueChange={(newRole: 'ADMIN' | 'REPORTER') => 
                          handleRoleChange(user.id, newRole)
                        }
                        disabled={isUpdating || user.id === session.user.id}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="REPORTER">Reporter</SelectItem>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant={user.isActive ? 'destructive' : 'default'}
                        size="sm"
                        onClick={() => handleStatusChange(user.id, !user.isActive)}
                        disabled={isUpdating || user.id === session.user.id}
                        className="text-xs"
                      >
                        <Icon name={user.isActive ? 'close' : 'check'} size={14} className="mr-1" />
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedUser(user)}
                        className="text-xs"
                      >
                        <Icon name="view" size={14} className="mr-1" />
                        Details
                      </Button>
                    </div>

                    {/* Delete Button */}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteConfirm(user)}
                      disabled={isUpdating || user.id === session.user.id}
                      className="w-full text-xs"
                    >
                      <Icon name="delete" size={14} className="mr-1" />
                      Delete User
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pagination - Mobile First */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="flex items-center"
              >
                <Icon name="back" size={16} className="mr-1" />
                Prev
              </Button>
              <span className="px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg">
                {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center"
              >
                Next
                <Icon name="forward" size={16} className="ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* User Details Modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>User Details</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedUser(null)}
                  className="absolute top-4 right-4"
                >
                  ×
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Name</label>
                  <p className="text-gray-900">{selectedUser.name || 'No name'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p className="text-gray-900">{selectedUser.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Role</label>
                  <p className="text-gray-900">{selectedUser.role}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <p className="text-gray-900">{selectedUser.isActive ? 'Active' : 'Inactive'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Reports Submitted</label>
                  <p className="text-gray-900">{selectedUser._count.reports}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Joined</label>
                  <p className="text-gray-900">
                    {new Date(selectedUser.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {selectedUser.gcashQr && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">GCash QR</label>
                    <p className="text-gray-900 break-all">{selectedUser.gcashQr}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="text-red-600">Delete User</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteConfirm(null)}
                  className="absolute top-4 right-4"
                >
                  ×
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Are you sure you want to delete this user?
                  </h3>
                  <p className="text-gray-600 mb-4">
                    This action cannot be undone. All user data will be permanently deleted.
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <p className="font-medium text-gray-900">{deleteConfirm.name || 'No name'}</p>
                    <p className="text-sm text-gray-600">{deleteConfirm.email}</p>
                    <p className="text-sm text-gray-600">
                      {deleteConfirm._count.reports} reports • {deleteConfirm.role}
                    </p>
                  </div>
                  {deleteConfirm._count.reports > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                      <p className="text-sm text-yellow-800">
                        ⚠️ This user has {deleteConfirm._count.reports} reports. 
                        Consider deactivating instead of deleting.
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setDeleteConfirm(null)}
                    className="flex-1"
                    disabled={isUpdating}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteUser(deleteConfirm.id)}
                    className="flex-1"
                    disabled={isUpdating}
                  >
                    {isUpdating ? 'Deleting...' : 'Delete User'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
