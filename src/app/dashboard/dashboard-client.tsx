'use client'

import { signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Session } from 'next-auth'
import Icon from '@/components/ui/icon'

interface DashboardClientProps {
  session: Session
}

interface Report {
  id: string
  reportCode: string
  status: string
  description: string
  locationAddress: string
  penaltyAmount: number
  createdAt: string
  offense: {
    name: string
  }
  media: Array<{
    id: string
    type: string
    url: string
  }>
}

export default function DashboardClient({ session }: DashboardClientProps) {
  const [stats, setStats] = useState({
    totalReports: 0,
    approvedReports: 0,
    pendingReports: 0,
    totalEarnings: 0
  })
  const [recentReports, setRecentReports] = useState<Report[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true)
        
        // Fetch all reports to calculate stats
        const response = await fetch('/api/reports')
        if (response.ok) {
          const data = await response.json()
          const reports = data.reports || []
          
          // Calculate stats
          const totalReports = reports.length
          const approvedReports = reports.filter((r: Report) => r.status === 'APPROVED').length
          const pendingReports = reports.filter((r: Report) => r.status === 'SUBMITTED').length
          const totalEarnings = reports
            .filter((r: Report) => r.status === 'APPROVED')
            .reduce((sum: number, r: Report) => sum + (r.penaltyAmount * 0.7), 0)
          
          setStats({
            totalReports,
            approvedReports,
            pendingReports,
            totalEarnings
          })
          
          // Get recent reports (last 3)
          setRecentReports(reports.slice(0, 3))
          
          console.log('📊 Dashboard data loaded:', { totalReports, approvedReports, pendingReports, totalEarnings })
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      case 'SUBMITTED': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'Approved'
      case 'REJECTED': return 'Rejected'
      case 'SUBMITTED': return 'Pending'
      default: return status
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-First Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-red-600 rounded-lg flex items-center justify-center">
                <Icon name="dashboard" size={20} color="white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
                <p className="text-xs text-gray-600">Welcome, {session?.user?.name?.split(' ')[0]}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => signOut({ callbackUrl: '/' })}
                className="text-gray-600 hover:text-gray-900"
              >
                <Icon name="close" size={18} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Mobile First */}
      <main className="px-4 py-6 space-y-6">
        {/* Stats Cards - Mobile Grid */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Icon name="report" size={20} color="#3B82F6" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600">Total</p>
                <p className="text-lg font-bold text-gray-900">{stats.totalReports}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Icon name="check" size={20} color="#10B981" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600">Approved</p>
                <p className="text-lg font-bold text-green-600">{stats.approvedReports}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Icon name="pending" size={20} color="#F59E0B" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600">Pending</p>
                <p className="text-lg font-bold text-yellow-600">{stats.pendingReports}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Icon name="money" size={20} color="#8B5CF6" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600">Earnings</p>
                <p className="text-lg font-bold text-purple-600">₱{stats.totalEarnings.toLocaleString()}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Primary Report Method - Mobile First */}
        <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto">
                <Icon name="camera" size={32} color="white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-blue-900">Report Traffic Violation</h2>
                <p className="text-sm text-blue-700 mt-1">
                  Capture evidence instantly, then complete the report
                </p>
              </div>
              <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-lg font-semibold rounded-xl">
                <Link href="/dashboard/evidence-capture">
                  <Icon name="camera" size={20} className="mr-2" />
                  Start Evidence Capture
                </Link>
              </Button>
              <div className="flex items-center justify-center space-x-4 text-xs text-blue-600">
                <div className="flex items-center space-x-1">
                  <Icon name="smartphone" size={14} />
                  <span>Full-screen</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Icon name="photo" size={14} />
                  <span>Photos</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Icon name="video" size={14} />
                  <span>Videos</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions - Mobile */}
        <div className="space-y-3">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <Link href="/dashboard/reports" className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Icon name="list" size={24} color="#10B981" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">My Reports</h3>
                  <p className="text-sm text-gray-600">View and track your submissions</p>
                </div>
                <Icon name="forward" size={20} color="#6B7280" />
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity - Mobile */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Recent Activity</CardTitle>
            <CardDescription className="text-sm">Your latest submissions</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-500 text-sm">Loading your reports...</p>
              </div>
            ) : recentReports.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Icon name="report" size={48} color="#D1D5DB" />
                <p className="text-sm mt-2">No reports yet. Submit your first report!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentReports.map((report) => (
                  <div key={report.id} className="p-4 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon name="report" size={20} color="#3B82F6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-gray-900 text-sm">#{report.reportCode}</h4>
                          <Badge className={getStatusColor(report.status)} size="sm">
                            {getStatusText(report.status)}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 mb-1">
                          {report.offense.name} • {new Date(report.createdAt).toLocaleDateString()}
                        </p>
                        {report.locationAddress && (
                          <p className="text-xs text-gray-500 flex items-center">
                            <Icon name="location" size={12} className="mr-1" />
                            {report.locationAddress}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-blue-600">
                          ₱{report.penaltyAmount.toLocaleString()}
                        </p>
                        {report.media.length > 0 && (
                          <p className="text-xs text-gray-500 flex items-center">
                            <Icon name="photo" size={12} className="mr-1" />
                            {report.media.length}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {recentReports.length > 0 && (
                  <div className="p-4">
                    <Button variant="outline" asChild className="w-full">
                      <Link href="/dashboard/reports">
                        <Icon name="list" size={16} className="mr-2" />
                        View All Reports
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
