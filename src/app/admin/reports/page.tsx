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
  isAnonymous: boolean
  paymentReceiptUrl: string | null
  paymentReceiptId: string | null
  paymentSentAt: string | null
  paymentSentBy: string | null
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string
    email: string
    role: string
    gcashNumber: string | null
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
  const [moderatingReport, setModeratingReport] = useState<string | null>(null)
  const [moderationAction, setModerationAction] = useState<'APPROVE' | 'REJECT' | 'PAY' | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [paymentReceipt, setPaymentReceipt] = useState<File | null>(null)
  const [paymentNotes, setPaymentNotes] = useState('')
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false)

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

  const handleModerateReport = async (reportId: string) => {
    if (!moderationAction) return

    try {
      const response = await fetch(`/api/admin/reports/${reportId}/moderate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: moderationAction,
          adminNotes: adminNotes || undefined,
          rejectionReason: moderationAction === 'REJECT' ? rejectionReason : undefined,
        }),
      })

      if (response.ok) {
        // Refresh reports list
        fetchReports()
        
        // Reset moderation state
        setModeratingReport(null)
        setModerationAction(null)
        setAdminNotes('')
        setRejectionReason('')
        
        // Show success message
        alert(`Report ${moderationAction.toLowerCase()}d successfully!`)
      } else {
        const error = await response.json()
        alert(`Failed to moderate report: ${error.error}`)
      }
    } catch (error) {
      console.error('Error moderating report:', error)
      alert('Failed to moderate report. Please try again.')
    }
  }

  const startModeration = (reportId: string) => {
    setModeratingReport(reportId)
    setModerationAction(null)
    setAdminNotes('')
    setRejectionReason('')
  }

  const cancelModeration = () => {
    setModeratingReport(null)
    setModerationAction(null)
    setAdminNotes('')
    setRejectionReason('')
    setPaymentReceipt(null)
    setPaymentNotes('')
  }

  const uploadReceipt = async (file: File): Promise<{ url: string; publicId: string }> => {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Upload failed')
    }
    
    return await response.json()
  }

  const handleMarkAsPaid = async (reportId: string) => {
    if (!paymentReceipt) {
      alert('Please upload the GCash receipt first')
      return
    }

    setIsUploadingReceipt(true)
    try {
      // Upload receipt
      const receiptData = await uploadReceipt(paymentReceipt)
      
      // Mark as paid with receipt
      const response = await fetch(`/api/admin/reports/${reportId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentReceiptUrl: receiptData.url,
          paymentReceiptId: receiptData.publicId,
          paymentNotes: paymentNotes
        })
      })
      
      if (response.ok) {
        alert('Report marked as paid successfully!')
        fetchReports()
        cancelModeration()
      } else {
        const error = await response.json()
        alert(`Failed to mark as paid: ${error.error}`)
      }
    } catch (error) {
      console.error('Error marking as paid:', error)
      alert('Failed to mark as paid. Please try again.')
    } finally {
      setIsUploadingReceipt(false)
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
                <Card key={report.id} className="hover:shadow-sm transition-shadow">
                  <div 
                    className="p-3 cursor-pointer border-b border-gray-100" 
                    onClick={() => toggleReportExpansion(report.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">
                            #{report.reportCode}
                          </h3>
                        <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${
                          report.status === 'SUBMITTED' ? 'bg-yellow-100 text-yellow-700' :
                          report.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                          report.status === 'PAID' ? 'bg-blue-100 text-blue-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                            {report.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 truncate">
                          {report.offense.name} • {report.isAnonymous ? 'Anonymous' : report.user.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(report.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 ml-2">
                        <span className="text-xs font-bold text-blue-600">
                          ₱{report.penaltyAmount.toLocaleString()}
                        </span>
                        <Icon 
                          name={isExpanded ? "close" : "view"} 
                          size={14} 
                          className="text-gray-400" 
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Collapsed Content */}
                  {!isExpanded && (
                    <div className="px-3 py-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          {report.description && (
                            <span className="truncate max-w-[120px]">
                              {report.description.length > 20 
                                ? `${report.description.substring(0, 20)}...` 
                                : report.description
                              }
                            </span>
                          )}
                          {report.locationAddress && (
                            <span className="flex items-center">
                              <Icon name="location" size={8} className="mr-0.5" />
                              Loc
                            </span>
                          )}
                          {report.media.length > 0 && (
                            <span className="flex items-center">
                              <Icon name="photo" size={8} className="mr-0.5" />
                              {report.media.length}
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
                          className="text-red-500 hover:text-red-700 p-0.5"
                          title="Delete report (Development)"
                        >
                          <Icon name="delete" size={10} />
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="px-3 pb-3">
                      <div className="space-y-3">
                        {/* Full Description */}
                        {report.description && (
                          <div>
                            <h4 className="text-xs font-semibold text-gray-900 mb-1">Description</h4>
                            <p className="text-gray-700 text-xs">{report.description}</p>
                          </div>
                        )}
                        
                        {/* Location Details */}
                        {report.locationAddress && (
                          <div>
                            <h4 className="text-xs font-semibold text-gray-900 mb-1">Location</h4>
                            <p className="text-gray-600 text-xs flex items-start">
                              <Icon name="location" size={12} className="mr-1 mt-0.5 flex-shrink-0" />
                              {report.locationAddress}
                            </p>
                          </div>
                        )}
                        
                        {/* Evidence Media */}
                        {report.media.length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-gray-900 mb-1">Evidence ({report.media.length})</h4>
                            <div className="grid grid-cols-3 gap-1">
                              {report.media.map((media) => (
                                <div key={media.id} className="border rounded p-1">
                                  {media.type === 'IMAGE' ? (
                                    <img 
                                      src={media.url} 
                                      alt="Evidence" 
                                      className="w-full h-12 object-cover rounded"
                                    />
                                  ) : (
                                    <video 
                                      src={media.url} 
                                      className="w-full h-12 object-cover rounded"
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
                          <h4 className="text-xs font-semibold text-gray-900 mb-1">Reporter</h4>
                          <div className="text-xs text-gray-600">
                            {report.isAnonymous ? (
                              <div className="flex items-center space-x-2">
                                <Icon name="security" size={12} color="#3B82F6" />
                                <span className="text-blue-600 font-medium">Anonymous Report</span>
                              </div>
                            ) : (
                              <>
                                <p><strong>Name:</strong> {report.user.name}</p>
                                <p><strong>Email:</strong> {report.user.email}</p>
                                {report.user.gcashNumber && (
                                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                                    <div className="flex items-center space-x-1">
                                      <Icon name="money" size={12} color="#10B981" />
                                      <span className="font-medium text-green-800">GCash:</span>
                                      <span className="text-green-700">{report.user.gcashNumber}</span>
                                    </div>
                                    <p className="text-green-600 mt-1">
                                      Send ₱{(report.penaltyAmount * 0.05).toLocaleString()} to this number
                                    </p>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                        
                        {/* Violation Details */}
                        <div>
                          <h4 className="text-xs font-semibold text-gray-900 mb-1">Violation</h4>
                          <div className="text-xs text-gray-600">
                            <p><strong>Offense:</strong> {report.offense.name}</p>
                            <p><strong>Penalty:</strong> ₱{report.offense.penaltyAmount.toLocaleString()}</p>
                          </div>
                        </div>
                        
                        {/* Payment Receipt - Show if paid */}
                        {report.status === 'PAID' && report.paymentReceiptUrl && (
                          <div>
                            <h4 className="text-xs font-semibold text-gray-900 mb-1">Payment Receipt</h4>
                            <div className="space-y-2">
                              <img
                                src={report.paymentReceiptUrl}
                                alt="GCash Receipt"
                                className="w-full max-w-xs rounded border"
                                onClick={() => window.open(report.paymentReceiptUrl!, '_blank')}
                                style={{ cursor: 'pointer' }}
                              />
                              <div className="text-xs text-gray-600">
                                <p><strong>Sent by:</strong> {report.paymentSentBy}</p>
                                <p><strong>Sent at:</strong> {report.paymentSentAt ? new Date(report.paymentSentAt).toLocaleString() : 'N/A'}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Admin Notes */}
                        {report.adminNotes && (
                          <div>
                            <h4 className="text-xs font-semibold text-gray-900 mb-1">Admin Notes</h4>
                            <p className="text-xs text-gray-700 bg-gray-50 p-2 rounded">
                              {report.adminNotes}
                            </p>
                          </div>
                        )}
                        
                        {/* Rejection Reason */}
                        {report.rejectionReason && (
                          <div>
                            <h4 className="text-xs font-semibold text-gray-900 mb-1">Rejection Reason</h4>
                            <p className="text-xs text-red-700 bg-red-50 p-2 rounded">
                              {report.rejectionReason}
                            </p>
                          </div>
                        )}
                        
                        {/* Actions */}
                        <div className="pt-2 border-t border-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="flex space-x-1">
                              {report.status === 'SUBMITTED' && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs h-6 px-2"
                                    onClick={() => {
                                      setModeratingReport(report.id)
                                      setModerationAction('APPROVE')
                                    }}
                                  >
                                    <Icon name="check" size={10} className="mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs h-6 px-2"
                                    onClick={() => {
                                      setModeratingReport(report.id)
                                      setModerationAction('REJECT')
                                    }}
                                  >
                                    <Icon name="close" size={10} className="mr-1" />
                                    Reject
                                  </Button>
                                </>
                              )}
                      {report.status === 'APPROVED' && report.user.gcashNumber && (
                        <Button
                          variant="default"
                          size="sm"
                          className="text-xs h-6 px-2 bg-green-600 hover:bg-green-700"
                          onClick={() => {
                            setModeratingReport(report.id)
                            setModerationAction('PAY')
                          }}
                        >
                          <Icon name="money" size={10} className="mr-1" />
                          Mark as Paid
                        </Button>
                      )}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                if (confirm(`Delete report ${report.reportCode}?`)) {
                                  handleDeleteReport(report.id)
                                }
                              }}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <Icon name="delete" size={12} />
                            </button>
                          </div>
                          
                  {/* Moderation Form - Show when moderating this report */}
                  {moderatingReport === report.id && (
                    <div className="mt-3 space-y-2">
                      {moderationAction === 'REJECT' && (
                        <div>
                          <label className="text-xs font-medium text-gray-700">Rejection Reason</label>
                          <Textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Why is this report being rejected?"
                            className="text-xs h-16 mt-1"
                          />
                        </div>
                      )}
                      
                      {moderationAction === 'PAY' && (
                        <div className="space-y-2">
                          <div>
                            <label className="text-xs font-medium text-gray-700">GCash Receipt (Required)</label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => setPaymentReceipt(e.target.files?.[0] || null)}
                              className="text-xs mt-1 block w-full"
                            />
                            {paymentReceipt && (
                              <p className="text-xs text-green-600 mt-1">
                                ✓ Receipt selected: {paymentReceipt.name}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-700">Payment Notes (Optional)</label>
                            <Textarea
                              value={paymentNotes}
                              onChange={(e) => setPaymentNotes(e.target.value)}
                              placeholder="Any notes about this payment..."
                              className="text-xs h-12 mt-1"
                            />
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <label className="text-xs font-medium text-gray-700">Admin Notes (Optional)</label>
                        <Textarea
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                          placeholder="Additional notes..."
                          className="text-xs h-12 mt-1"
                        />
                      </div>
                      
                      <div className="flex space-x-1">
                        <Button
                          onClick={() => {
                            if (moderationAction === 'PAY') {
                              handleMarkAsPaid(report.id)
                            } else {
                              handleModerateReport(report.id)
                            }
                          }}
                          size="sm"
                          className="text-xs h-6 px-2"
                          disabled={
                            (moderationAction === 'REJECT' && !rejectionReason.trim()) ||
                            (moderationAction === 'PAY' && !paymentReceipt) ||
                            isUploadingReceipt
                          }
                        >
                          {isUploadingReceipt ? (
                            <>
                              <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin mr-1" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Icon name="send" size={10} className="mr-1" />
                              {moderationAction === 'PAY' ? 'Mark as Paid' : 'Submit'}
                            </>
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-6 px-2"
                          onClick={cancelModeration}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                        </div>
                      </div>
                    </div>
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
