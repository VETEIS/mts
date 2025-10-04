'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [showReportModal, setShowReportModal] = useState(false)

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
                <h1 className="text-lg font-semibold text-gray-900 leading-tight">My Reports</h1>
                <p className="text-xs text-gray-600 leading-tight">Track your submissions</p>
              </div>
            </div>
            
             <div className="flex items-center space-x-2">
               <FilterList sx={{ fontSize: 16, color: '#6B7280' }} />
               <Select value={filterStatus} onValueChange={setFilterStatus}>
                 <SelectTrigger className="w-[140px] h-8 text-xs">
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="ALL">
                     <div className="flex items-center space-x-2">
                       <AllInclusive sx={{ fontSize: 14 }} />
                       <span>All</span>
                     </div>
                   </SelectItem>
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
                <p className="text-gray-500 text-sm">Loading your reports...</p>
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Icon name="report" size={24} color="#9CA3AF" />
                </div>
                <p className="text-sm font-medium mb-1">
                  {filterStatus === 'ALL' 
                    ? "No reports yet" 
                    : `No ${filterStatus.toLowerCase()} reports found`
                  }
                </p>
                <p className="text-xs text-gray-400 mb-4">
                  {filterStatus === 'ALL' 
                    ? "Submit your first report to start earning!" 
                    : "Try a different filter or submit a new report."
                  }
                </p>
                <Button asChild size="sm">
                  <Link href="/dashboard">
                    <Icon name="camera" size={16} className="mr-2" />
                    Submit Report
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-0">
                {reports.map((report, index) => (
                  <div 
                    key={report.id} 
                    className={`${index === 0 ? 'pt-0 pb-4 px-6' : 'pt-2 pb-2 px-5'} border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors cursor-pointer`}
                    onClick={() => {
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
                            <p className="text-sm font-bold text-green-600 flex-shrink-0">
                              ₱{(report.penaltyAmount * 0.05).toLocaleString()}
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
                        
                        {report.locationAddress && (
                          <p className="text-xs text-gray-500 flex items-center mt-1 min-w-0">
                            <Icon name="location" size={12} className="mr-2 flex-shrink-0" />
                            <span className="truncate">
                              {report.locationAddress}
                            </span>
                          </p>
                        )}
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
              
              {/* Offense and Earnings */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">{selectedReport.offense.name}</p>
                  <p className="text-xs text-gray-500">Traffic Violation</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">
                    ₱{(selectedReport.penaltyAmount * 0.05).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    {selectedReport.status === 'PAID' ? 'Earned' : 
                     selectedReport.status === 'APPROVED' ? 'Approved' : 'Potential'}
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
              
              {/* Timestamps */}
              <div className="pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                  <div>
                    <p className="font-medium text-gray-700">Submitted</p>
                    <p>{new Date(selectedReport.createdAt).toLocaleString()}</p>
                  </div>
                  {selectedReport.updatedAt !== selectedReport.createdAt && (
                    <div>
                      <p className="font-medium text-gray-700">Updated</p>
                      <p>{new Date(selectedReport.updatedAt).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>
              </div>
            </div>
            
            {/* Fixed Footer */}
            <div className="px-6 py-4 border-t border-gray-200">
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
    </div>
  )
}
