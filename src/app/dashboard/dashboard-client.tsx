'use client'

import { signOut } from 'next-auth/react'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Session } from 'next-auth'
import Icon from '@/components/ui/icon'
import CameraPortal from '@/components/camera/camera-portal'
import { useToast } from '@/components/providers/toast-provider'
import { useLocation } from '@/components/providers/location-provider'
import { useEvidence } from '@/components/providers/evidence-provider'

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
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  
  // Camera state
  const [showCamera, setShowCamera] = useState(false)
  const [previewEvidence, setPreviewEvidence] = useState<any>(null)
  
  // Location from context
  const { currentLocation, isDetectingLocation, detectLocation } = useLocation()
  
  // Evidence from context
  const { 
    capturedEvidence, 
    evidenceCount, 
    addEvidence, 
    removeEvidence, 
    updateEvidenceUpload, 
    clearEvidence,
    isUploading,
    uploadProgress,
    setUploadProgress,
    setIsUploading
  } = useEvidence()
  const [userGcashNumber, setUserGcashNumber] = useState<string | null>(null)
  const [isLoadingGcash, setIsLoadingGcash] = useState(true)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedReport, setSelectedReport] = useState<any>(null)
  const { toast } = useToast()
  const router = useRouter()

  // Handle logout with loading
  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await signOut({ callbackUrl: '/' })
    } catch (error) {
      console.error('Logout error:', error)
      toast({
        title: 'Logout Failed',
        description: 'Please try again',
        variant: 'destructive'
      })
    } finally {
      setIsLoggingOut(false)
    }
  }


  // Handle evidence captured
  const handleEvidenceCaptured = useCallback((file: File) => {
    addEvidence(file)
  }, [addEvidence])


  // Upload individual evidence item
  const uploadEvidenceItem = async (evidenceItem: any) => {
    const formData = new FormData()
    formData.append('file', evidenceItem.file)
    formData.append('type', evidenceItem.type)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        return result.url
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      throw error
    }
  }

  // Upload all selected evidence
  const uploadAllEvidence = async () => {
    const unuploadedItems = capturedEvidence.filter(item => !item.uploaded)
    
    if (unuploadedItems.length === 0) {
      toast({
        title: 'All Evidence Uploaded',
        description: 'All evidence has already been uploaded',
        variant: 'default'
      })
      return
    }

    setIsUploading(true)
    const uploadResults: {[key: string]: string} = {}

    try {
      for (const item of unuploadedItems) {
        setUploadProgress({ ...uploadProgress, [item.id]: 0 })
        
        // Simulate progress
        const progressInterval = setInterval(() => {
          setUploadProgress({
            ...uploadProgress,
            [item.id]: Math.min((uploadProgress[item.id] || 0) + 10, 90)
          })
        }, 100)

        try {
          const url = await uploadEvidenceItem(item)
          uploadResults[item.id] = url
          
          // Update evidence with URL using context
          updateEvidenceUpload(item.id, true, url)
          
          setUploadProgress({ ...uploadProgress, [item.id]: 100 })
          clearInterval(progressInterval)
          
        } catch (error) {
          clearInterval(progressInterval)
          throw error
        }
      }

      toast({
        title: 'Upload Complete',
        description: `Successfully uploaded ${unuploadedItems.length} evidence items`,
        variant: 'success'
      })

    } catch (error) {
      console.error('Bulk upload error:', error)
      toast({
        title: 'Upload Failed',
        description: 'Some evidence failed to upload. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsUploading(false)
      setUploadProgress({})
    }
  }

  // Proceed to form with captured evidence
  const proceedToForm = async () => {
    if (capturedEvidence.length === 0) {
      toast({
        title: 'No Evidence Captured',
        description: 'Please capture at least one photo or video before proceeding',
        variant: 'destructive'
      })
      return
    }

    // Check if all evidence is uploaded
    const unuploadedItems = capturedEvidence.filter(item => !item.uploaded)
    if (unuploadedItems.length > 0) {
      toast({
        title: 'Evidence Not Uploaded',
        description: 'Please upload all evidence before proceeding to the form',
        variant: 'destructive'
      })
      return
    }

    // Evidence is already stored in context, just save location
    if (currentLocation) {
      sessionStorage.setItem('detectedLocation', currentLocation)
    }

    // Navigate to form
    window.location.href = '/dashboard/report/complete'
  }

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
            .filter((r: Report) => r.status === 'PAID')
            .reduce((sum: number, r: Report) => sum + (r.penaltyAmount * 0.05), 0)
          
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
    fetchUserGcash()
  }, [])

  // Fetch user GCash number
  const fetchUserGcash = async () => {
    try {
      setIsLoadingGcash(true)
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const data = await response.json()
        setUserGcashNumber(data.gcashNumber)
      }
    } catch (error) {
      console.error('Error fetching user GCash:', error)
    } finally {
      setIsLoadingGcash(false)
    }
  }

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
      case 'SUBMITTED': return 'Pending'
      default: return status
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-First Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-lg flex items-center justify-center">
                <img src="/mts-icon.webp" alt="MTS Logo" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col justify-center items-start">
                <h1 className="text-lg font-semibold text-gray-900 leading-tight">Dashboard</h1>
                <p className="text-xs text-gray-600 leading-tight">Welcome, {session?.user?.name?.split(' ')[0]}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="sm"
                asChild
                className="text-gray-600 hover:text-gray-900"
              >
                <Link href="/dashboard/profile">
                  <Icon name="person" size={18} />
                </Link>
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="text-gray-600 hover:text-gray-900 disabled:opacity-50"
              >
                {isLoggingOut ? (
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                ) : (
                  <Icon name="signout" size={18} />
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Mobile First */}
      <main className="px-4 py-6 space-y-6">
        {/* Stats Cards - Mobile Grid */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Icon name="report" size={20} color="#3B82F6" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600">Total</p>
                <p className="text-lg font-bold text-gray-900">{stats.totalReports}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Icon name="check" size={20} color="#10B981" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600">Approved</p>
                <p className="text-lg font-bold text-green-600">{stats.approvedReports}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Icon name="pending" size={20} color="#F59E0B" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600">Pending</p>
                <p className="text-lg font-bold text-yellow-600">{stats.pendingReports}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Icon name="peso" size={20} color="#8B5CF6" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600">Earnings</p>
                <p className="text-lg font-bold text-purple-600">₱{stats.totalEarnings.toLocaleString()}</p>
              </div>
            </div>
          </Card>
        </div>


        {/* Primary Report Method - Mobile First */}
        <Card className={`border-2 ${!isLoadingGcash && !userGcashNumber ? 'border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100' : 'border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100'}`}>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className={`w-16 h-16 ${!isLoadingGcash && !userGcashNumber ? 'bg-gray-600' : 'bg-blue-600'} rounded-2xl flex items-center justify-center mx-auto`}>
                <Icon name="camera" size={32} color="white" />
                </div>
                <div>
                <h2 className={`text-xl font-bold ${!isLoadingGcash && !userGcashNumber ? 'text-gray-900' : 'text-blue-900'}`}>Report Traffic Violation</h2>
                <p className={`text-sm ${!isLoadingGcash && !userGcashNumber ? 'text-gray-700' : 'text-blue-700'} mt-1`}>
                  {!isLoadingGcash && !userGcashNumber ? 'Set up GCash number first to submit reports' : 'Capture evidence instantly, then complete the report'}
                </p>
              </div>
              <Button 
                onClick={() => {
                  if (!isLoadingGcash && !userGcashNumber) {
                    router.push('/dashboard/profile')
                    return
                  }
                  // Detect location first, then open camera
                  detectLocation()
                  setShowCamera(true)
                }}
                className={`w-full ${!isLoadingGcash && !userGcashNumber ? 'bg-gray-600 hover:bg-gray-700' : 'bg-blue-600 hover:bg-blue-700'} text-white h-12 text-lg font-semibold rounded-xl`}
                disabled={isLoadingGcash}
              >
                {isLoadingGcash ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Loading...
                  </>
                ) : !userGcashNumber ? (
                  <>
                    <Icon name="warning" size={20} className="mr-2" />
                    Set Up GCash First
                  </>
                ) : (
                  <>
                    <Icon name="camera" size={20} className="mr-2" />
                    Start Evidence Capture
                  </>
                )}
              </Button>
              <div className={`flex items-center justify-center space-x-4 text-xs ${!isLoadingGcash && !userGcashNumber ? 'text-gray-600' : 'text-blue-600'}`}>
                <div className="flex items-center space-x-1">
                  <Icon name="smartphone" size={14} />
                  <span>Full-screen</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Icon name="photo" size={14} />
                  <span>Photos</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Icon name="video" size={14} />
                  <span>Videos</span>
                </div>
                </div>
              </div>
            </CardContent>
          </Card>

        {/* Evidence Upload Section - Show when evidence is captured */}
        {capturedEvidence.length > 0 && (
          <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-green-100 shadow-lg">
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Header */}
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Icon name="photo" size={24} color="white" />
                  </div>
                  <h3 className="text-xl font-bold text-green-900 mb-2">
                    Evidence Captured ({capturedEvidence.length})
                  </h3>
                  <p className="text-sm text-green-700">
                    Review and upload your evidence to complete the report
                  </p>
                </div>

                {/* Upload Progress Summary */}
                <div className="bg-white rounded-xl p-4 border border-green-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">Upload Progress</span>
                    <span className="text-sm text-gray-600">
                      {capturedEvidence.filter(item => item.uploaded).length} of {capturedEvidence.length} uploaded
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${(capturedEvidence.filter(item => item.uploaded).length / capturedEvidence.length) * 100}%` 
                      }}
                    />
                  </div>
                </div>

                {/* Evidence Grid */}
                <div className="grid grid-cols-1 gap-3">
                  {capturedEvidence.map((item, index) => (
                    <div key={index} className="bg-white rounded-xl p-4 border border-gray-200 hover:border-green-300 transition-colors">
                      <div className="flex items-center space-x-4">
                        {/* Thumbnail */}
                        <div className="relative w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          {item.type === 'photo' ? (
                            <img 
                              src={URL.createObjectURL(item.file)} 
                              alt={`Evidence ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                              <Icon name="video" size={20} color="#6B7280" />
                            </div>
                          )}
                          <div className="absolute top-1 right-1">
                            <div className={`w-3 h-3 rounded-full ${
                              item.uploaded ? 'bg-green-500' : 
                              uploadProgress[item.id] > 0 ? 'bg-blue-500' : 'bg-yellow-500'
                            }`} />
                          </div>
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-semibold text-gray-900 truncate">
                              {item.type === 'photo' ? 'Photo' : 'Video'} {index + 1}
                            </h4>
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => setPreviewEvidence(item)}
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Preview"
                              >
                                <Icon name="view" size={14} />
                              </button>
                              <button
                                onClick={() => {
                                  const itemToRemove = capturedEvidence[index]
                                  if (itemToRemove) {
                                    removeEvidence(itemToRemove.id)
                                  }
                                }}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Icon name="delete" size={14} />
                              </button>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-500">
                              {(item.file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                            
                            {/* Status */}
                            {item.uploaded ? (
                              <div className="flex items-center space-x-1 text-green-600">
                                <Icon name="check" size={12} />
                                <span className="text-xs font-medium">Uploaded</span>
                              </div>
                            ) : uploadProgress[item.id] > 0 ? (
                              <div className="flex items-center space-x-2">
                                <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-blue-600 transition-all duration-300"
                                    style={{ width: `${uploadProgress[item.id]}%` }}
                                  />
                                </div>
                                <span className="text-xs text-gray-500">{uploadProgress[item.id]}%</span>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-500">Pending</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  {capturedEvidence.some(item => !item.uploaded) && (
                    <Button
                      onClick={uploadAllEvidence}
                      disabled={isUploading}
                      className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-base font-semibold rounded-xl shadow-lg"
                    >
                      {isUploading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
                          Uploading Evidence...
                        </>
                      ) : (
                        <>
                          <Icon name="upload" size={20} className="mr-3" />
                          Upload All Evidence
                        </>
                      )}
                    </Button>
                  )}

                  {capturedEvidence.every(item => item.uploaded) && (
                    <Button
                      onClick={proceedToForm}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-base font-semibold rounded-xl shadow-lg"
                    >
                      <Icon name="send" size={20} className="mr-3" />
                      Complete Report
                    </Button>
                  )}
                </div>

                {/* Help Text */}
                <div className="text-center">
                  <p className="text-xs text-green-600">
                    💡 Tip: You can preview each item before uploading
                  </p>
                </div>
                </div>
            </CardContent>
          </Card>
        )}


        {/* Recent Activity - Mobile */}
        <Card className="border border-gray-200 shadow-sm">
          <div className="px-4 pt-4 pb-0">
            <div className="flex items-center justify-between">
                <div>
                <h3 className="text-lg font-semibold">
                  Recent Activity
                </h3>
              </div>
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <Icon name="trending" size={16} color="#3B82F6" />
                </div>
              </div>
            </div>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-500 text-sm">Loading your reports...</p>
              </div>
            ) : recentReports.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Icon name="report" size={24} color="#9CA3AF" />
                </div>
                <p className="text-sm font-medium mb-1">No reports yet</p>
                <p className="text-xs text-gray-400">Submit your first report to start earning!</p>
              </div>
            ) : (
              <div className="space-y-0">
                {recentReports.map((report) => (
                  <div 
                    key={report.id} 
                    className="p-4 border-b border-gray-50 last:border-b-0 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedReport(report)
                      setShowPaymentModal(true)
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
                
                {recentReports.length > 0 && (
                  <div className="p-4 pt-2">
                    <Button variant="outline" asChild className="w-full border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700 hover:text-blue-700">
                <Link href="/dashboard/reports">
                        <Icon name="list" size={16} className="mr-2" />
                        View All Reports
                </Link>
              </Button>
                  </div>
                )}
              </div>
            )}
            </CardContent>
          </Card>

        {/* Camera Portal - Completely isolated from dashboard re-renders */}
        <CameraPortal
          isOpen={showCamera}
          onClose={() => setShowCamera(false)}
          onEvidenceCaptured={handleEvidenceCaptured}
        />

        {/* Evidence Preview - Show when evidence is captured - REMOVED - Now integrated into main capture card */}
        {false && capturedEvidence.length > 0 && !showCamera && (
          <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-green-100">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2">
                <Icon name="folder" size={20} color="#10B981" />
                <span>Captured Evidence ({capturedEvidence.length} items)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Location Status */}
              {currentLocation && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Icon name="location" size={16} color="#10B981" />
                    <span className="text-sm font-medium text-green-800">Location Detected</span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">{currentLocation}</p>
                </div>
              )}

              {/* Evidence Items */}
              <div className="space-y-2">
                {capturedEvidence.map((item, index) => (
                  <div key={item.id} className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      {item.type === 'photo' ? (
                        <Icon name="photo" size={18} color="#3B82F6" />
                      ) : (
                        <Icon name="video" size={18} color="#3B82F6" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-gray-900">
                          {item.type === 'photo' ? 'Photo' : 'Video'} #{index + 1}
                        </p>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPreviewEvidence(item)}
                            className="text-blue-600 hover:text-blue-700 p-1"
                          >
                            <Icon name="view" size={14} />
                          </Button>
                          {item.uploaded ? (
                            <div className="flex items-center space-x-1 text-green-600">
                              <Icon name="check" size={14} />
                              <span className="text-xs font-medium">Uploaded</span>
                            </div>
                          ) : uploadProgress[item.id] > 0 ? (
                            <div className="flex items-center space-x-2">
                              <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-blue-600 transition-all duration-300"
                                  style={{ width: `${uploadProgress[item.id]}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-500">{uploadProgress[item.id]}%</span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500">Pending</span>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        removeEvidence(item.id)
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Icon name="delete" size={14} />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Upload Status */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-center space-y-2">
                  <p className="text-sm text-gray-600">
                    {capturedEvidence.filter(e => e.uploaded).length} uploaded, {capturedEvidence.filter(e => !e.uploaded).length} pending
                  </p>
                  
                  {/* Upload All Button */}
                  {capturedEvidence.some(e => !e.uploaded) && (
                    <Button
                      onClick={uploadAllEvidence}
                      disabled={isUploading}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isUploading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Uploading Evidence...
                        </>
                      ) : (
                        <>
                          <Icon name="upload" size={16} className="mr-2" />
                          Upload All Evidence
                        </>
                      )}
                    </Button>
                  )}
                </div>
        </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <Button
                  onClick={() => setShowCamera(true)}
                  variant="outline"
                  className="flex-1"
                >
                  <Icon name="camera" size={16} className="mr-2" />
                  Add More
                </Button>
                <Button
                  onClick={proceedToForm}
                  disabled={capturedEvidence.some(e => !e.uploaded)}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <Icon name="send" size={16} className="mr-2" />
                  Complete Report
                </Button>
            </div>
          </CardContent>
        </Card>
        )}

        {/* Evidence Preview Modal */}
        {previewEvidence && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">
                  {previewEvidence.type === 'photo' ? 'Photo' : 'Video'} Preview
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewEvidence(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <Icon name="close" size={20} />
                </Button>
              </div>
              <div className="p-4">
                {previewEvidence.type === 'photo' ? (
                  <img
                    src={URL.createObjectURL(previewEvidence.file)}
                    alt="Evidence preview"
                    className="w-full h-auto rounded-lg"
                  />
                ) : (
                  <video
                    src={URL.createObjectURL(previewEvidence.file)}
                    controls
                    className="w-full h-auto rounded-lg"
                  />
                )}
                <div className="mt-4 text-sm text-gray-600">
                  <p><strong>Type:</strong> {previewEvidence.type}</p>
                  <p><strong>Size:</strong> {(previewEvidence.file.size / 1024 / 1024).toFixed(2)} MB</p>
                  <p><strong>Captured:</strong> {new Date(previewEvidence.timestamp).toLocaleString()}</p>
                  <p><strong>Status:</strong> {previewEvidence.uploaded ? 'Uploaded' : 'Pending'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status Description Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 animate-in zoom-in-95 duration-300">
              <div className="text-center">
                {/* Dynamic Header */}
                <div className="flex items-center justify-center mb-4">
                  {selectedReport ? (
                    (() => {
                      if (selectedReport.status === 'SUBMITTED' || selectedReport.status === 'UNDER_REVIEW') {
                        return (
                          <>
                            <Icon name="pending" size={24} color="#F59E0B" className="mr-2" />
                            <h2 className="text-xl font-bold text-gray-900">Pending</h2>
                          </>
                        )
                      } else if (selectedReport.status === 'APPROVED') {
                        return (
                          <>
                            <Icon name="check" size={24} color="#10B981" className="mr-2" />
                            <h2 className="text-xl font-bold text-gray-900">Approved</h2>
                          </>
                        )
                      } else if (selectedReport.status === 'PAID') {
                        return (
                          <>
                            <Icon name="money" size={24} color="#10B981" className="mr-2" />
                            <h2 className="text-xl font-bold text-gray-900">Paid</h2>
                          </>
                        )
                      } else if (selectedReport.status === 'REJECTED') {
                        return (
                          <>
                            <Icon name="cancel" size={24} color="#EF4444" className="mr-2" />
                            <h2 className="text-xl font-bold text-gray-900">Rejected</h2>
                          </>
                        )
                      }
                      return (
                        <>
                          <Icon name="info" size={24} color="#3B82F6" className="mr-2" />
                          <h2 className="text-xl font-bold text-gray-900">Report Status</h2>
                        </>
                      )
                    })()
                  ) : (
                    <>
                      <Icon name="info" size={24} color="#3B82F6" className="mr-2" />
                      <h2 className="text-xl font-bold text-gray-900">Report Status</h2>
                    </>
                  )}
                </div>
                
                {/* Status Description */}
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <p className="text-sm text-gray-700">
                    {selectedReport ? (
                      (() => {
                        if (selectedReport.status === 'SUBMITTED' || selectedReport.status === 'UNDER_REVIEW') {
                          return "Your report is being reviewed by our traffic enforcement team. We'll notify you once it's approved!"
                        } else if (selectedReport.status === 'APPROVED') {
                          return "Your report has been approved! We're now waiting for the offender to pay the penalty. Once they do, you'll receive your 5% cut via GCash."
                        } else if (selectedReport.status === 'PAID') {
                          return "Payment sent! Check your GCash for the 5% earnings from this approved report."
                        } else if (selectedReport.status === 'REJECTED') {
                          return "This report was not approved. Please review the feedback and submit a new report if needed."
                        }
                        return "Submit your first report to start earning!"
                      })()
                    ) : "Submit your first report to start earning!"}
                  </p>
                </div>
                
                {/* Close Button */}
                <Button
                  onClick={() => setShowPaymentModal(false)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white h-10 rounded-xl font-medium"
                >
                  <Icon name="check" size={16} className="mr-2" />
                  Got it!
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
