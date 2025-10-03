'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface Report {
  id: string
  reportCode: string
  status: string
  description: string
  locationAddress: string
  penaltyAmount: number
  createdAt: string
  updatedAt: string
  offense: {
    name: string
  }
  media: Array<{
    id: string
    type: string
    url: string
  }>
}

export default function ReporterReportsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [reports, setReports] = useState<Report[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('ALL')

  const fetchReports = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/reports?status=${filterStatus === 'ALL' ? '' : filterStatus}`)
      if (response.ok) {
        const data = await response.json()
        console.log('📊 Reporter reports data:', data.reports)
        setReports(data.reports)
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
    } finally {
      setIsLoading(false)
    }
  }, [filterStatus])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated' && session?.user?.role !== 'REPORTER') {
      router.push('/admin')
    } else if (status === 'authenticated') {
      fetchReports()
    }
  }, [status, session, router, fetchReports])

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
      case 'SUBMITTED': return '⏳ Pending Review'
      default: return status
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Reports</h1>
              <p className="text-gray-600">Track your submitted traffic violation reports</p>
            </div>
            <Button asChild>
              <Link href="/dashboard">← Back to Dashboard</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Filter */}
        <div className="mb-6">
          <div className="flex space-x-2">
            <Button
              variant={filterStatus === 'ALL' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('ALL')}
            >
              All Reports
            </Button>
            <Button
              variant={filterStatus === 'SUBMITTED' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('SUBMITTED')}
            >
              Pending
            </Button>
            <Button
              variant={filterStatus === 'APPROVED' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('APPROVED')}
            >
              Approved
            </Button>
            <Button
              variant={filterStatus === 'REJECTED' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('REJECTED')}
            >
              Rejected
            </Button>
          </div>
        </div>

        {/* Reports List */}
        <div className="space-y-4">
          {reports.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Reports Found</h3>
                <p className="text-gray-600 mb-6">
                  {filterStatus === 'ALL' 
                    ? "You haven't submitted any reports yet." 
                    : `No ${filterStatus.toLowerCase()} reports found.`
                  }
                </p>
                <Button asChild>
                  <Link href="/dashboard/evidence-capture">
                    📸 Submit Your First Report
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            reports.map((report) => (
              <Card key={report.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        Report #{report.reportCode}
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        {report.offense.name} • {new Date(report.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge className={getStatusColor(report.status)}>
                        {getStatusText(report.status)}
                      </Badge>
                      <span className="text-lg font-bold text-blue-600">
                        ₱{report.penaltyAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {report.description && (
                      <p className="text-gray-700">{report.description}</p>
                    )}
                    {report.locationAddress && (
                      <p className="text-sm text-gray-600">
                        📍 {report.locationAddress}
                      </p>
                    )}
                    {report.media.length > 0 && (
                      <p className="text-sm text-gray-600">
                        📸 {report.media.length} evidence items
                      </p>
                    )}
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>Submitted: {new Date(report.createdAt).toLocaleString()}</span>
                      {report.updatedAt !== report.createdAt && (
                        <span>Updated: {new Date(report.updatedAt).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
