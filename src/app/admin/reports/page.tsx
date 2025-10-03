'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'

interface Report {
  id: string
  reportCode: string
  status: string
  description: string
  locationAddress: string
  penaltyAmount: number
  createdAt: string
  user: {
    name: string
    email: string
  }
  offense: {
    name: string
  }
  media: Array<{
    id: string
    type: string
    url: string
  }>
}

export default function AdminReportsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [reports, setReports] = useState<Report[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [moderationAction, setModerationAction] = useState<'approve' | 'reject' | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [adminNotes, setAdminNotes] = useState('')
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

  const handleModerateReport = async () => {
    if (!selectedReport || !moderationAction) return

    try {
      const response = await fetch(`/api/admin/reports/${selectedReport.id}/moderate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: moderationAction,
          rejectionReason: moderationAction === 'reject' ? rejectionReason : undefined,
          adminNotes,
        }),
      })

      if (response.ok) {
        // Refresh reports list
        fetchReports()
        // Close modal
        setSelectedReport(null)
        setModerationAction(null)
        setRejectionReason('')
        setAdminNotes('')
      }
    } catch (error) {
      console.error('Error moderating report:', error)
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
              <Card key={report.id} className="hover:shadow-md transition-shadow">
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
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Description:</h4>
                      <p className="text-gray-600 text-sm">{report.description}</p>
                    </div>
                    
                    {report.locationAddress && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">Location:</h4>
                        <p className="text-gray-600 text-sm">{report.locationAddress}</p>
                      </div>
                    )}

                    {report.media.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Evidence:</h4>
                        <div className="flex space-x-2">
                          {report.media.map((media) => (
                            <div key={media.id} className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                              {media.type === 'IMAGE' ? (
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              ) : (
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {report.status === 'SUBMITTED' && (
                      <div className="flex space-x-2 pt-4 border-t">
                        <Button
                          onClick={() => {
                            setSelectedReport(report)
                            setModerationAction('approve')
                          }}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Approve
                        </Button>
                        <Button
                          onClick={() => {
                            setSelectedReport(report)
                            setModerationAction('reject')
                          }}
                          variant="destructive"
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>

      {/* Moderation Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">
              {moderationAction === 'approve' ? 'Approve' : 'Reject'} Report #{selectedReport.reportCode}
            </h3>
            
            <div className="space-y-4">
              {moderationAction === 'reject' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rejection Reason *
                  </label>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Explain why this report is being rejected..."
                    className="min-h-[80px]"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Admin Notes (Optional)
                </label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Internal notes about this decision..."
                  className="min-h-[60px]"
                />
              </div>
            </div>

            <div className="flex space-x-2 mt-6">
              <Button
                onClick={handleModerateReport}
                disabled={moderationAction === 'reject' && !rejectionReason.trim()}
                className={moderationAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
                variant={moderationAction === 'reject' ? 'destructive' : 'default'}
              >
                Confirm {moderationAction === 'approve' ? 'Approval' : 'Rejection'}
              </Button>
              <Button
                onClick={() => {
                  setSelectedReport(null)
                  setModerationAction(null)
                  setRejectionReason('')
                  setAdminNotes('')
                }}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
