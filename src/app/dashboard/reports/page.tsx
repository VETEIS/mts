'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Icon from '@/components/ui/icon'

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
      case 'PAID': return 'bg-blue-100 text-blue-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      case 'SUBMITTED': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'Approved'
      case 'PAID': return 'Paid'
      case 'REJECTED': return 'Rejected'
      case 'SUBMITTED': return 'Pending Review'
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
      {/* Mobile Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="p-2"
            >
              <Icon name="back" size={20} />
            </Button>
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-gray-900">My Reports</h1>
              <p className="text-xs text-gray-600">Track your submissions</p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">
                <Icon name="home" size={18} />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content - Mobile First */}
      <main className="px-4 py-6 space-y-6">
        {/* Filter - Mobile */}
        <div className="flex space-x-2 overflow-x-auto pb-2">
          <Button
            variant={filterStatus === 'ALL' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('ALL')}
            className="whitespace-nowrap"
          >
            All
          </Button>
          <Button
            variant={filterStatus === 'SUBMITTED' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('SUBMITTED')}
            className="whitespace-nowrap"
          >
            Pending
          </Button>
          <Button
            variant={filterStatus === 'APPROVED' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('APPROVED')}
            className="whitespace-nowrap"
          >
            Approved
          </Button>
          <Button
            variant={filterStatus === 'REJECTED' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('REJECTED')}
            className="whitespace-nowrap"
          >
            Rejected
          </Button>
        </div>

        {/* Reports List */}
        <div className="space-y-4">
          {reports.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Icon name="report" size={48} color="#D1D5DB" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Reports Found</h3>
                <p className="text-gray-600 mb-6">
                  {filterStatus === 'ALL' 
                    ? "You haven't submitted any reports yet." 
                    : `No ${filterStatus.toLowerCase()} reports found.`
                  }
                </p>
                <Button asChild>
                  <Link href="/dashboard/evidence-capture">
                    <Icon name="camera" size={16} className="mr-2" />
                    Submit Your First Report
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
                      <div className="text-right">
                        <span className="text-lg font-bold text-green-600">
                          ₱{(report.penaltyAmount * 0.05).toLocaleString()}
                        </span>
                        <p className="text-xs text-gray-500">
                          {report.status === 'PAID' ? 'Earned' : 
                           report.status === 'APPROVED' ? 'Approved' : 'Potential'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {report.description && (
                      <p className="text-gray-700">{report.description}</p>
                    )}
                    {report.locationAddress && (
                      <p className="text-sm text-gray-600 flex items-center">
                        <Icon name="location" size={12} className="mr-1" />
                        {report.locationAddress}
                      </p>
                    )}
                    {report.media.length > 0 && (
                      <p className="text-sm text-gray-600 flex items-center">
                        <Icon name="photo" size={12} className="mr-1" />
                        {report.media.length} evidence items
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
