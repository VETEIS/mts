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
  const [expandedReports, setExpandedReports] = useState<Set<string>>(new Set())
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

  const toggleReportExpansion = (reportId: string) => {
    setExpandedReports(prev => {
      const newSet = new Set(prev)
      if (newSet.has(reportId)) {
        newSet.delete(reportId)
      } else {
        newSet.add(reportId)
      }
      return newSet
    })
  }

  const handleDeleteReport = async (reportId: string) => {
    try {
      const response = await fetch(`/api/admin/reports/${reportId}/delete`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Refresh reports list
        fetchReports()
        
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
            reports.map((report) => {
              const isExpanded = expandedReports.has(report.id)
              
              return (
                <Card key={report.id} className="hover:shadow-md transition-shadow">
                  <CardHeader 
                    className="pb-3 cursor-pointer" 
                    onClick={() => toggleReportExpansion(report.id)}
                  >
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
                        <Icon 
                          name={isExpanded ? "close" : "view"} 
                          size={16} 
                          className="text-gray-500" 
                        />
                      </div>
                    </div>
                  </CardHeader>
                  
                  {/* Collapsed Content */}
                  {!isExpanded && (
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {report.description && (
                          <p className="text-gray-700 text-sm line-clamp-2">
                            {report.description.length > 100 
                              ? `${report.description.substring(0, 100)}...` 
                              : report.description
                            }
                          </p>
                        )}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            {report.locationAddress && (
                              <span className="flex items-center">
                                <Icon name="location" size={12} className="mr-1" />
                                Location
                              </span>
                            )}
                            {report.media.length > 0 && (
                              <span className="flex items-center">
                                <Icon name="photo" size={12} className="mr-1" />
                                {report.media.length} evidence
                              </span>
                            )}
                          </div>
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
                  )}
                  
                  {/* Expanded Content */}
                  {isExpanded && (
                    <CardContent className="pt-0">
                      <div className="space-y-4">
                        {/* Full Description */}
                        {report.description && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                            <p className="text-gray-700 text-sm">{report.description}</p>
                          </div>
                        )}
                        
                        {/* Location Details */}
                        {report.locationAddress && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Location</h4>
                            <p className="text-gray-600 text-sm flex items-start">
                              <Icon name="location" size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                              {report.locationAddress}
                            </p>
                          </div>
                        )}
                        
                        {/* Evidence Media */}
                        {report.media.length > 0 && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Evidence ({report.media.length} items)</h4>
                            <div className="grid grid-cols-2 gap-2">
                              {report.media.map((media) => (
                                <div key={media.id} className="border rounded-lg p-2">
                                  {media.type === 'IMAGE' ? (
                                    <img 
                                      src={media.url} 
                                      alt="Evidence" 
                                      className="w-full h-20 object-cover rounded"
                                    />
                                  ) : (
                                    <video 
                                      src={media.url} 
                                      className="w-full h-20 object-cover rounded"
                                      controls
                                    />
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Reporter Info */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Reporter</h4>
                          <div className="text-sm text-gray-600">
                            <p><strong>Name:</strong> {report.user.name}</p>
                            <p><strong>Email:</strong> {report.user.email}</p>
                            <p><strong>Role:</strong> {report.user.role}</p>
                          </div>
                        </div>
                        
                        {/* Violation Details */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Violation</h4>
                          <div className="text-sm text-gray-600">
                            <p><strong>Offense:</strong> {report.offense.name}</p>
                            <p><strong>Description:</strong> {report.offense.description}</p>
                            <p><strong>Penalty:</strong> ₱{report.offense.penaltyAmount.toLocaleString()}</p>
                          </div>
                        </div>
                        
                        {/* Admin Notes */}
                        {report.adminNotes && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Admin Notes</h4>
                            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                              {report.adminNotes}
                            </p>
                          </div>
                        )}
                        
                        {/* Rejection Reason */}
                        {report.rejectionReason && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Rejection Reason</h4>
                            <p className="text-sm text-red-700 bg-red-50 p-3 rounded-lg">
                              {report.rejectionReason}
                            </p>
                          </div>
                        )}
                        
                        {/* Timestamps */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Timeline</h4>
                          <div className="text-sm text-gray-600">
                            <p><strong>Submitted:</strong> {new Date(report.createdAt).toLocaleString()}</p>
                            <p><strong>Last Updated:</strong> {new Date(report.updatedAt).toLocaleString()}</p>
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // TODO: Implement moderation actions
                                alert('Moderation actions coming soon!')
                              }}
                            >
                              <Icon name="settings" size={14} className="mr-1" />
                              Moderate
                            </Button>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              if (confirm(`Delete report ${report.reportCode}?`)) {
                                handleDeleteReport(report.id)
                              }
                            }}
                            className="text-red-500 hover:text-red-700 p-2"
                          >
                            <Icon name="delete" size={16} />
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              )
            })
          )}
        </div>
      </main>
    </div>
  )
}
