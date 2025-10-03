'use client'

import { signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Session } from 'next-auth'
import Icon from '@/components/ui/icon'

interface AdminStats {
  totalReports: number
  pendingReports: number
  approvedReports: number
  rejectedReports: number
  totalUsers: number
  totalRevenue: number
  pendingPayments: number
}

interface AdminClientProps {
  session: Session
}

export default function AdminClient({ session }: AdminClientProps) {
  const [stats, setStats] = useState<AdminStats>({
    totalReports: 0,
    pendingReports: 0,
    approvedReports: 0,
    rejectedReports: 0,
    totalUsers: 0,
    totalRevenue: 0,
    pendingPayments: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchAdminStats()
  }, [])

  const fetchAdminStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-First Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-red-600 to-blue-600 rounded-xl flex items-center justify-center">
                <Icon name="admin" size={20} color="white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Admin Panel</h1>
                <p className="text-xs text-gray-600">System Control</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-600 hidden sm:block">{session?.user?.name}</span>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => signOut({ callbackUrl: '/' })}
                className="p-2"
              >
                <Icon name="signout" size={18} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Mobile First */}
      <main className="px-4 py-6 space-y-6">
        {/* Stats Overview - Mobile Grid */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Icon name="report" size={20} color="#3B82F6" />
              </div>
              <div>
                <div className="text-lg font-bold text-gray-900">{stats.totalReports}</div>
                <p className="text-xs text-gray-600">Total Reports</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Icon name="pending" size={20} color="#F59E0B" />
              </div>
              <div>
                <div className="text-lg font-bold text-yellow-600">{stats.pendingReports}</div>
                <p className="text-xs text-gray-600">Pending</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <Icon name="check" size={20} color="#10B981" />
              </div>
              <div>
                <div className="text-lg font-bold text-green-600">{stats.approvedReports}</div>
                <p className="text-xs text-gray-600">Approved</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Icon name="peso" size={20} color="#8B5CF6" />
              </div>
              <div>
                <div className="text-lg font-bold text-purple-600">₱{stats.totalRevenue.toLocaleString()}</div>
                <p className="text-xs text-gray-600">Revenue</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions - Mobile First */}
        <div className="space-y-4">
          {/* Primary Action - Moderate Reports */}
          <Card className="border-2 border-yellow-200 bg-gradient-to-r from-yellow-50 to-yellow-100">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-yellow-600 rounded-2xl flex items-center justify-center mx-auto">
                  <Icon name="settings" size={32} color="white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-yellow-900">Moderate Reports</h2>
                  <p className="text-sm text-yellow-700 mt-1">
                    Review and approve pending reports
                  </p>
                </div>
                <Button asChild className="w-full bg-yellow-600 hover:bg-yellow-700 text-white h-12 text-lg font-semibold rounded-xl">
                  <Link href="/admin/reports">
                    <Icon name="settings" size={20} className="mr-2" />
                    Review Reports ({stats.pendingReports})
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Secondary Actions */}
          <div className="grid grid-cols-1 gap-4">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Icon name="person" size={24} color="#3B82F6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">Manage Users</h3>
                    <p className="text-sm text-gray-600">User accounts and roles</p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/admin/users">
                      <Icon name="forward" size={16} />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                    <Icon name="warning" size={24} color="#EF4444" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">Manage Offenses</h3>
                    <p className="text-sm text-gray-600">Violation types and penalties</p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/admin/offenses">
                      <Icon name="forward" size={16} />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Activity - Mobile First */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2">
              <Icon name="notification" size={20} color="#6B7280" />
              <span>System Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.pendingReports > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                    <div>
                      <p className="text-sm font-semibold text-yellow-800">
                        {stats.pendingReports} reports need review
                      </p>
                      <p className="text-xs text-yellow-600">Click to moderate now</p>
                    </div>
                  </div>
                  <Button size="sm" asChild className="bg-yellow-600 hover:bg-yellow-700">
                    <Link href="/admin/reports">
                      <Icon name="forward" size={16} className="mr-1" />
                      Review
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Icon name="check" size={48} color="#D1D5DB" />
                <h3 className="text-lg font-semibold text-gray-900 mt-4">All Caught Up!</h3>
                <p className="text-gray-600 mt-2">No pending reports to review</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
