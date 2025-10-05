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
import { 
  AllInclusive, 
  Pending, 
  CheckCircle, 
  Payment, 
  Cancel,
  FilterList
} from '@mui/icons-material'

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
  const [filterStatus, setFilterStatus] = useState('SUBMITTED')
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [showReportModal, setShowReportModal] = useState(false)
  const [moderatingReport, setModeratingReport] = useState<string | null>(null)
  const [moderationAction, setModerationAction] = useState<'APPROVE' | 'REJECT' | 'PAY' | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [paymentReceipt, setPaymentReceipt] = useState<File | null>(null)
  const [paymentNotes, setPaymentNotes] = useState('')
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successAction, setSuccessAction] = useState<'approved' | 'rejected' | 'paid' | null>(null)
  const [successReportCode, setSuccessReportCode] = useState<string | null>(null)

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

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetchReports()
    }
  }, [session, fetchReports])


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
          action: moderationAction.toLowerCase(),
          adminNotes: adminNotes || undefined,
          rejectionReason: moderationAction === 'REJECT' ? rejectionReason : undefined,
        }),
      })

      if (response.ok) {
        // Get the report code for success modal
        const report = reports.find(r => r.id === reportId)
        setSuccessReportCode(report?.reportCode || null)
        
        // Set the correct success action based on the moderation action
        let action: 'approved' | 'rejected' | 'paid'
        if (moderationAction === 'APPROVE') {
          action = 'approved'
        } else if (moderationAction === 'REJECT') {
          action = 'rejected'
        } else {
          action = 'paid'
        }
        
        console.log('🎯 Setting success action:', { moderationAction, action })
        setSuccessAction(action)
        setShowSuccessModal(true)
        
        // Refresh reports list
        fetchReports()
        
        // Reset moderation state
        setModeratingReport(null)
        setModerationAction(null)
        setAdminNotes('')
        setRejectionReason('')
        
        // Refresh system logs in admin dashboard
        window.postMessage({ type: 'REFRESH_SYSTEM_LOGS' }, '*')
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

  const closeSuccessModal = () => {
    setShowSuccessModal(false)
    setSuccessAction(null)
    setSuccessReportCode(null)
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
        // Get the report code for success modal
        const report = reports.find(r => r.id === reportId)
        setSuccessReportCode(report?.reportCode || null)
        setSuccessAction('paid')
        setShowSuccessModal(true)
        
        fetchReports()
        cancelModeration()
        
        // Refresh system logs in admin dashboard
        window.postMessage({ type: 'REFRESH_SYSTEM_LOGS' }, '*')
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
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Mobile Header - Match Dashboard Design */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50 flex-shrink-0">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="p-2"
              >
                <Icon name="back" size={20} />
              </Button>
              <div className="flex flex-col justify-center items-start">
                <h1 className="text-lg font-semibold text-gray-900 leading-tight">Reports</h1>
                <p className="text-xs text-gray-600 leading-tight">Review reports</p>
              </div>
            </div>
            
             <div className="flex items-center space-x-2">
               <FilterList sx={{ fontSize: 16, color: '#6B7280' }} />
               <Select value={filterStatus} onValueChange={setFilterStatus}>
                 <SelectTrigger className="w-[140px] h-8 text-xs">
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="SUBMITTED">
                     <div className="flex items-center space-x-2">
                       <Pending sx={{ fontSize: 14 }} />
                       <span>Pending</span>
                     </div>
                   </SelectItem>
                   <SelectItem value="APPROVED">
                     <div className="flex items-center space-x-2">
                       <CheckCircle sx={{ fontSize: 14 }} />
                       <span>Approved</span>
                     </div>
                   </SelectItem>
                   <SelectItem value="PAID">
                     <div className="flex items-center space-x-2">
                       <Payment sx={{ fontSize: 14 }} />
                       <span>Paid</span>
                     </div>
                   </SelectItem>
                   <SelectItem value="REJECTED">
                     <div className="flex items-center space-x-2">
                       <Cancel sx={{ fontSize: 14 }} />
                       <span>Rejected</span>
                     </div>
                   </SelectItem>
                 </SelectContent>
               </Select>
             </div>
          </div>
        </div>
      </header>

      {/* Main Content - Mobile First */}
      <main className="flex-1 px-4 py-6">

        {/* Reports List - Clean Design */}
        <Card className="border border-gray-200 shadow-sm h-full">
          <CardContent className="p-0 h-full overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-500 text-sm">Loading reports...</p>
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Icon name="report" size={24} color="#9CA3AF" />
                </div>
                <p className="text-sm font-medium mb-1">
                  {filterStatus === 'SUBMITTED' 
                    ? "No pending reports" 
                    : `No ${filterStatus.toLowerCase()} reports found`
                  }
                </p>
                <p className="text-xs text-gray-400 mb-4">
                  {filterStatus === 'SUBMITTED' 
                    ? "All reports have been reviewed" 
                    : "Try a different filter or check back later."
                  }
                </p>
                <Button onClick={fetchReports} variant="outline" size="sm">
                  <Icon name="refresh" size={16} className="mr-2" />
                  Refresh
                </Button>
              </div>
            ) : (
              <div className="space-y-0">
                {reports.map((report, index) => (
                  <div 
                    key={report.id} 
                    className={`${index === 0 ? 'pt-0 pb-4 px-6' : 'pt-2 pb-2 px-5'} border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors cursor-pointer`}
                    onClick={() => {
                      console.log('🚨 ADMIN REPORTS DEBUG - Report clicked!')
                      console.log('🔍 Selected report data:', report)
                      console.log('💰 User GCash number:', report.user.gcashNumber)
                      console.log('📊 Report status:', report.status)
                      alert(`DEBUG: Report ${report.reportCode} - Status: ${report.status} - GCash: ${report.user.gcashNumber || 'NONE'}`)
                      setSelectedReport(report)
                      setShowReportModal(true)
                    }}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Report Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-gray-900 text-sm">#{report.reportCode}</h4>
                          <Badge className={`text-xs px-2 py-0.5 ${getStatusColor(report.status)}`}>
                            {getStatusText(report.status)}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                            <p className="text-sm text-gray-700 font-medium truncate">
                              {report.offense.name}
                            </p>
                            <p className="text-sm font-bold text-blue-600 flex-shrink-0">
                              ₱{report.penaltyAmount.toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center text-xs text-gray-500 flex-shrink-0 ml-2">
                            <Icon name="time" size={12} className="mr-1" />
                            {new Date(report.createdAt).toLocaleDateString()}
                            {report.media.length > 0 && (
                              <>
                                <span className="mx-2">•</span>
                                <Icon name="photo" size={12} className="mr-1" />
                                {report.media.length}
                              </>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500 truncate">
                            {report.isAnonymous ? 'Anonymous' : report.user.name}
                          </p>
                          {report.locationAddress && (
                            <p className="text-xs text-gray-500 flex items-center min-w-0">
                              <Icon name="location" size={12} className="mr-1 flex-shrink-0" />
                              <span className="truncate">
                                {report.locationAddress}
                              </span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Report Detail Modal */}
      {showReportModal && selectedReport && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full mx-4 animate-in zoom-in-95 duration-300 max-h-[80vh] flex flex-col">
            {/* Fixed Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Report Details</h2>
              <div className="text-xs text-red-600 font-bold">🚨 DEBUG VERSION - NEW CODE ACTIVE</div>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 pt-4">
              <div className="space-y-4">
                {/* Report Header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">#{selectedReport.reportCode}</h3>
                  <Badge className={`text-xs px-2 py-0.5 ${getStatusColor(selectedReport.status)}`}>
                    {getStatusText(selectedReport.status)}
                  </Badge>
                </div>
                
                {/* Offense and Penalty */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{selectedReport.offense.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-600">
                      ₱{selectedReport.penaltyAmount.toLocaleString()}
                    </p>
                  </div>
                </div>
                
                {/* Description */}
                {selectedReport.description && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Description</h4>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                      {selectedReport.description}
                    </p>
                  </div>
                )}
                
                {/* Location */}
                {selectedReport.locationAddress && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Location</h4>
                    <p className="text-sm text-gray-700 flex items-center">
                      <Icon name="location" size={14} className="mr-2 text-gray-500" />
                      {selectedReport.locationAddress}
                    </p>
                  </div>
                )}
                
                {/* Reporter Info */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Reporter</h4>
                  {selectedReport.isAnonymous ? (
                    <div className="flex items-center space-x-2">
                      <Icon name="security" size={16} color="#3B82F6" />
                      <span className="text-blue-600 font-medium">Anonymous Report</span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-sm text-gray-700"><strong>Name:</strong> {selectedReport.user.name}</p>
                      <p className="text-sm text-gray-700"><strong>Email:</strong> {selectedReport.user.email}</p>
                      {(() => {
                        console.log('🔍 Modal GCash check:', {
                          hasGCash: !!selectedReport.user.gcashNumber,
                          gcashNumber: selectedReport.user.gcashNumber,
                          status: selectedReport.status
                        })
                        return selectedReport.user.gcashNumber && (
                          <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <Icon name="money" size={16} color="#10B981" />
                              <span className="font-medium text-green-800">GCash:</span>
                              <span className="text-green-700">{selectedReport.user.gcashNumber}</span>
                            </div>
                            <p className="text-green-600 mt-1 text-sm">
                              Send ₱{(selectedReport.penaltyAmount * 0.05).toLocaleString()} to this number
                            </p>
                          </div>
                        )
                      })()}
                    </div>
                  )}
                </div>
                
                {/* Evidence */}
                {selectedReport.media.length > 0 ? (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Evidence</h4>
                    <div className="grid grid-cols-1 gap-4">
                      {selectedReport.media.map((media, index) => (
                        <div key={media.id} className="border border-gray-200 rounded-lg overflow-hidden">
                          <div className="p-2">
                            {media.type === 'IMAGE' || media.type === 'photo' ? (
                              <img 
                                src={media.url} 
                                alt="Evidence" 
                                className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-80"
                                onClick={() => window.open(media.url, '_blank')}
                              />
                            ) : (
                              <video 
                                src={media.url} 
                                className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-80"
                                controls
                                onClick={() => window.open(media.url, '_blank')}
                              />
                            )}
                            <div className="mt-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => window.open(media.url, '_blank')}
                                className="w-full"
                              >
                                View Full Size
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">📷</div>
                    <p className="text-lg font-medium">No evidence media provided</p>
                    <p className="text-sm">This report was submitted without photos or videos.</p>
                  </div>
                )}
                
                {/* Admin Notes */}
                {selectedReport.adminNotes && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Admin Notes</h4>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                      {selectedReport.adminNotes}
                    </p>
                  </div>
                )}
                
                {/* Rejection Reason */}
                {selectedReport.rejectionReason && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Rejection Reason</h4>
                    <p className="text-sm text-red-700 bg-red-50 p-3 rounded-lg">
                      {selectedReport.rejectionReason}
                    </p>
                  </div>
                )}
                
                {/* Payment Receipt */}
                {selectedReport.status === 'PAID' && selectedReport.paymentReceiptUrl && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Payment Receipt</h4>
                    <div className="space-y-2">
                      <img
                        src={selectedReport.paymentReceiptUrl}
                        alt="GCash Receipt"
                        className="w-full max-w-xs rounded border cursor-pointer hover:opacity-80"
                        onClick={() => window.open(selectedReport.paymentReceiptUrl!, '_blank')}
                      />
                      <div className="text-sm text-gray-600">
                        <p><strong>Sent by:</strong> {selectedReport.paymentSentBy}</p>
                        <p><strong>Sent at:</strong> {selectedReport.paymentSentAt ? new Date(selectedReport.paymentSentAt).toLocaleString() : 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Timestamps */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="text-center">
                    <p className="text-xs text-gray-500">
                      Submitted: {new Date(selectedReport.createdAt).toLocaleString()}
                      {selectedReport.updatedAt !== selectedReport.createdAt && (
                        <span className="block mt-1">
                          Updated: {new Date(selectedReport.updatedAt).toLocaleString()}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Fixed Footer with Actions */}
            <div className="px-6 py-4 border-t border-gray-200 space-y-3">
              {/* Moderation Actions */}
              {selectedReport.status === 'SUBMITTED' && (
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setModeratingReport(selectedReport.id)
                      setModerationAction('APPROVE')
                      setShowReportModal(false)
                    }}
                  >
                    <Icon name="check" size={16} className="mr-2" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setModeratingReport(selectedReport.id)
                      setModerationAction('REJECT')
                      setShowReportModal(false)
                    }}
                  >
                    <Icon name="close" size={16} className="mr-2" />
                    Reject
                  </Button>
                </div>
              )}
              
              {(() => {
                const isApproved = selectedReport.status === 'APPROVED'
                const hasGCash = !!selectedReport.user.gcashNumber
                console.log('🔍 Mark as Paid button check:', {
                  isApproved,
                  hasGCash,
                  status: selectedReport.status,
                  gcashNumber: selectedReport.user.gcashNumber,
                  shouldShow: isApproved && hasGCash
                })
                return isApproved && hasGCash && (
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      setModeratingReport(selectedReport.id)
                      setModerationAction('PAY')
                      setShowReportModal(false)
                    }}
                  >
                    <Icon name="money" size={16} className="mr-2" />
                    Mark as Paid
                  </Button>
                )
              })()}
              
              <Button
                onClick={() => setShowReportModal(false)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white h-10 rounded-xl font-medium"
              >
                <Icon name="check" size={16} className="mr-2" />
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Moderation Form Modal */}
      {moderatingReport && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full mx-4 animate-in zoom-in-95 duration-300 max-h-[80vh] flex flex-col">
            {/* Fixed Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {moderationAction === 'APPROVE' ? 'Approve Report' :
                 moderationAction === 'REJECT' ? 'Reject Report' :
                 'Mark as Paid'}
              </h2>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 pt-4">
              <div className="space-y-4">
                {moderationAction === 'REJECT' && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Rejection Reason *</label>
                    <Textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Why is this report being rejected?"
                      className="mt-2"
                    />
                  </div>
                )}
                
                {moderationAction === 'PAY' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">GCash Receipt *</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setPaymentReceipt(e.target.files?.[0] || null)}
                        className="mt-2 block w-full text-sm"
                      />
                      {paymentReceipt && (
                        <p className="text-sm text-green-600 mt-2">
                          ✓ Receipt selected: {paymentReceipt.name}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Payment Notes (Optional)</label>
                      <Textarea
                        value={paymentNotes}
                        onChange={(e) => setPaymentNotes(e.target.value)}
                        placeholder="Any notes about this payment..."
                        className="mt-2"
                      />
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Admin Notes (Optional)</label>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Additional notes..."
                    className="mt-2"
                  />
                </div>
              </div>
            </div>
            
            {/* Fixed Footer */}
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <Button
                  onClick={() => {
                    if (moderationAction === 'PAY') {
                      handleMarkAsPaid(moderatingReport)
                    } else {
                      handleModerateReport(moderatingReport)
                    }
                  }}
                  disabled={
                    (moderationAction === 'REJECT' && !rejectionReason.trim()) ||
                    (moderationAction === 'PAY' && !paymentReceipt) ||
                    isUploadingReceipt
                  }
                  className="flex-1"
                >
                  {isUploadingReceipt ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Icon name="send" size={16} className="mr-2" />
                      {moderationAction === 'PAY' ? 'Mark as Paid' : 'Submit'}
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={cancelModeration}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 animate-in zoom-in-95 duration-300">
            <div className="text-center">
              {/* Success Animation */}
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
                successAction === 'approved' ? 'bg-green-100' :
                successAction === 'rejected' ? 'bg-red-100' :
                'bg-blue-100'
              }`}>
                <Icon 
                  name="check" 
                  size={40} 
                  color={
                    successAction === 'approved' ? '#10B981' :
                    successAction === 'rejected' ? '#EF4444' :
                    '#3B82F6'
                  } 
                />
              </div>
              
              {/* Success Message */}
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Report {successAction === 'approved' ? 'Approved' : 
                       successAction === 'rejected' ? 'Rejected' : 
                       'Marked as Paid'} Successfully!
              </h2>
              
              <p className="text-gray-600 mb-4">
                {successAction === 'approved' ? 
                  'The report has been approved and the reporter will be notified.' :
                 successAction === 'rejected' ? 
                  'The report has been rejected and the reporter will be notified with the reason.' :
                  'The payment has been processed and the reporter will receive their earnings.'
                }
              </p>
              
              {/* Report Code */}
              {successReportCode && (
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <p className="text-sm text-gray-500 mb-1">Report Code</p>
                  <p className="text-lg font-mono font-bold text-gray-900">
                    {successReportCode}
                  </p>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={closeSuccessModal}
                  className={`w-full h-12 rounded-xl font-semibold ${
                    successAction === 'approved' ? 'bg-green-600 hover:bg-green-700' :
                    successAction === 'rejected' ? 'bg-red-600 hover:bg-red-700' :
                    'bg-blue-600 hover:bg-blue-700'
                  } text-white`}
                >
                  <Icon name="check" size={18} className="mr-2" />
                  Continue Moderating
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    closeSuccessModal()
                    setFilterStatus('SUBMITTED')
                  }}
                  className="w-full h-10 rounded-xl"
                >
                  <Icon name="refresh" size={16} className="mr-2" />
                  View Pending Reports
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

