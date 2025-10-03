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
      console.log('📊 Admin reports data:', data.reports)
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

  const handleDeleteReport = async (reportId: string) => {
    try {
      const response = await fetch(`/api/admin/reports/${reportId}/delete`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Refresh reports list
        fetchReports()
        // Close modal
        setShowDetailModal(false)
        setSelectedReport(null)
        
        // Show success message
        alert('Report deleted successfully!')
      } else {
        const error = await response.json()
        alert(`Failed to delete report: ${error.error}`)
      }
    } catch (error) {
      console.error('Error deleting report:', error)
      alert('Failed to delete report. Please try again.')
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
              <h1 className="text-lg font-semibold text-gray-900">Report Moderation</h1>
              <p className="text-xs text-gray-600">Review and moderate reports</p>
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
          
          <Button onClick={fetchReports} variant="outline" size="sm" className="w-full">
            <Icon name="refresh" size={16} className="mr-2" />
            Refresh Reports
          </Button>
        </div>

        {/* Reports List - Mobile First */}
        <div className="space-y-4">
          {reports.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Icon name="report" size={48} color="#D1D5DB" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Reports Found</h3>
                <p className="text-gray-600 mb-6">
                  {filterStatus === 'ALL' 
                    ? "No reports have been submitted yet." 
                    : `No ${filterStatus.toLowerCase()} reports found.`
                  }
                </p>
                <Button onClick={fetchReports} variant="outline">
                  <Icon name="refresh" size={16} className="mr-2" />
                  Refresh
                </Button>
              </CardContent>
            </Card>
          ) : (
            reports.map((report) => (
              <Card key={report.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => openReportDetail(report)}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        Report #{report.reportCode}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {report.offense.name} • {report.user.name} • 
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
                      <span className="text-sm font-bold text-blue-600">
                        ₱{report.penaltyAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {report.description && (
                      <p className="text-gray-700 text-sm line-clamp-2">{report.description}</p>
                    )}
                    {report.locationAddress && (
                      <p className="text-gray-600 text-xs flex items-center">
                        <Icon name="location" size={12} className="mr-1" />
                        {report.locationAddress}
                      </p>
                    )}
                    {report.media.length > 0 && (
                      <p className="text-gray-600 text-xs flex items-center">
                        <Icon name="photo" size={12} className="mr-1" />
                        {report.media.length} evidence items
                      </p>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <p className="text-gray-400 text-xs">Tap to view details</p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (confirm(`Delete report ${report.reportCode}?`)) {
                            handleDeleteReport(report.id)
                          }
                        }}
                        className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                        title="Delete report (Development)"
                      >
                        <Icon name="delete" size={14} />
                      </button>
                    </div>
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
        onDelete={handleDeleteReport}
      />
    </div>
  )
}
