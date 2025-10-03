'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import ReportDetailModal from '@/components/admin/report-detail-modal'

interface Report {
  id: string
  reportCode: string
  status: string
  description: string
  locationAddress: string
  licensePlate?: string
  vehicleColor?: string
  vehicleModel?: string
  penaltyAmount: number
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string
    email: string
    role: string
  }
  offense: {
    id: string
    name: string
    description: string
    penaltyAmount: number
  }
  media: Array<{
    id: string
    type: string
    url: string
    createdAt: string
  }>
  adminNotes?: string
  rejectionReason?: string
}

export default function AdminReportsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [reports, setReports] = useState<Report[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState('SUBMITTED')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/dashboard')
    }
  }, [status, session, router])

  const fetchReports = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/admin/reports?status=${filterStatus}`)
      if (response.ok) {
        const data = await response.json()
        setReports(data.reports)
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
    } finally {
      setIsLoading(false)
    }
  }, [filterStatus])

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetchReports()
    }
  }, [session, fetchReports])

  const handleModerate = async (reportId: string, action: 'approve' | 'reject', reason?: string, notes?: string) => {
    try {
      const response = await fetch(`/api/admin/reports/${reportId}/moderate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          rejectionReason: reason,
          adminNotes: notes,
        }),
      })

      if (response.ok) {
        // Refresh reports list
        fetchReports()
        setShowDetailModal(false)
        setSelectedReport(null)
      }
    } catch (error) {
      console.error('Error moderating report:', error)
    }
  }

  const openReportDetail = (report: Report) => {
    setSelectedReport(report)
    setShowDetailModal(true)
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
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button variant="outline" asChild>
              <Link href="/admin">
                ← Back to Admin Dashboard
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Report Moderation</h1>
              <p className="text-sm text-gray-600">Review and moderate traffic violation reports</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Filter by status:</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUBMITTED">Pending Review</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="ALL">All Reports</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={fetchReports} variant="outline">
              Refresh
            </Button>
          </div>
        </div>

        {/* Reports List */}
        <div className="grid gap-6">
          {reports.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">No reports found for the selected filter.</p>
              </CardContent>
            </Card>
          ) : (
            reports.map((report) => (
              <Card key={report.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => openReportDetail(report)}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        Report #{report.reportCode}
                      </CardTitle>
                      <CardDescription>
                        {report.offense.name} • Submitted by {report.user.name} • 
                        {new Date(report.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        report.status === 'SUBMITTED' ? 'bg-yellow-100 text-yellow-800' :
                        report.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {report.status}
                      </span>
                      <span className="text-sm font-medium text-blue-600">
                        ₱{report.penaltyAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-gray-600 text-sm line-clamp-2">{report.description}</p>
                    {report.locationAddress && (
                      <p className="text-gray-500 text-xs">📍 {report.locationAddress}</p>
                    )}
                    {report.media.length > 0 && (
                      <p className="text-gray-500 text-xs">📸 {report.media.length} evidence items</p>
                    )}
                    <p className="text-gray-400 text-xs">Click to view full details</p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>


      {/* Report Detail Modal */}
      <ReportDetailModal
        report={selectedReport}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false)
          setSelectedReport(null)
        }}
        onModerate={handleModerate}
      />
    </div>
  )
}
