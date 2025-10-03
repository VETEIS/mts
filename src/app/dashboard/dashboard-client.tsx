'use client'

import { signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Session } from 'next-auth'

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
      case 'APPROVED': return '✅ Approved'
      case 'REJECTED': return '❌ Rejected'
      case 'SUBMITTED': return '⏳ Pending'
      default: return status
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-red-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">MTS</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Reporter Dashboard</h1>
                <p className="text-sm text-gray-600">Welcome back, {session?.user?.name}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="outline" asChild>
                <Link href="/profile">Profile</Link>
              </Button>
              <Button 
                variant="outline" 
                onClick={() => signOut({ callbackUrl: '/' })}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.totalReports}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Approved Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approvedReports}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pendingReports}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">₱{stats.totalEarnings.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        {/* Primary Report Method - Evidence-First */}
        <Card className="mb-8 border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <CardTitle className="text-blue-800">📸 Report Traffic Violation</CardTitle>
                <CardDescription className="text-blue-700">
                  <strong>Evidence-First Approach:</strong> Capture photos/videos instantly, then complete the report. Perfect for time-sensitive violations!
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 text-white" size="lg">
                <Link href="/dashboard/evidence-capture">
                  📸 Start Evidence Capture
                </Link>
              </Button>
              <div className="text-center">
                <p className="text-sm text-blue-600">
                  📱 Full-screen camera • 📸 Photos & 🎥 Videos • ⚡ Auto-upload
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-8">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <CardTitle>My Reports</CardTitle>
                  <CardDescription>View and track your submitted reports</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="outline" asChild className="w-full">
                <Link href="/dashboard/reports">
                  View Reports
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest report submissions and updates</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-500">Loading your reports...</p>
              </div>
            ) : recentReports.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p>No reports yet. Submit your first report to get started!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentReports.map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h4 className="font-medium text-gray-900">Report #{report.reportCode}</h4>
                        <Badge className={getStatusColor(report.status)}>
                          {getStatusText(report.status)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {report.offense.name} • {new Date(report.createdAt).toLocaleDateString()}
                      </p>
                      {report.locationAddress && (
                        <p className="text-xs text-gray-500 mt-1">📍 {report.locationAddress}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-600">
                        ₱{report.penaltyAmount.toLocaleString()}
                      </p>
                      {report.media.length > 0 && (
                        <p className="text-xs text-gray-500">📸 {report.media.length} items</p>
                      )}
                    </div>
                  </div>
                ))}
                {recentReports.length > 0 && (
                  <div className="text-center pt-4">
                    <Button variant="outline" asChild>
                      <Link href="/dashboard/reports">View All Reports</Link>
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
