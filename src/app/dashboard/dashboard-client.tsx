'use client'

import { signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Session } from 'next-auth'
import Icon from '@/components/ui/icon'
import FullscreenCamera from '@/components/ui/fullscreen-camera'
import { useToast } from '@/components/providers/toast-provider'

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
  
  // Camera and location state
  const [showCamera, setShowCamera] = useState(false)
  const [capturedEvidence, setCapturedEvidence] = useState<any[]>([])
  const [currentLocation, setCurrentLocation] = useState<string>('')
  const [isDetectingLocation, setIsDetectingLocation] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({})
  const [previewEvidence, setPreviewEvidence] = useState<any>(null)
  const [userGcashNumber, setUserGcashNumber] = useState<string | null>(null)
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

  // Detect current location
  const detectLocation = async () => {
    // Check if user has GCash number set up
    if (!userGcashNumber) {
      toast({
        title: "GCash number required",
        description: "Please set up your GCash number in your profile before submitting reports",
        variant: "destructive"
      })
      return
    }

    if (!navigator.geolocation) {
      toast({
        title: 'Location Not Supported',
        description: 'Your browser does not support location services',
        variant: 'destructive'
      })
      return
    }

    setIsDetectingLocation(true)
    
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        })
      })

      const { latitude, longitude } = position.coords
      console.log('📍 GPS coordinates:', { latitude, longitude })

      // Get address from coordinates using our geocoding API
      const response = await fetch(`/api/geocoding?lat=${latitude}&lng=${longitude}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log('📍 Geocoding response:', data)
        
        if (data.success && data.address) {
          setCurrentLocation(data.address)
          toast({
            title: 'Location Detected',
            description: `Found: ${data.address}`,
            variant: 'success'
          })
        } else if (data.fallback) {
          setCurrentLocation(data.fallback)
          toast({
            title: 'Location Detected (Coordinates)',
            description: `Using coordinates: ${data.fallback}`,
            variant: 'success'
          })
        } else {
          throw new Error(data.message || 'No address found')
        }
      } else {
        const errorData = await response.json()
        console.error('Geocoding API error:', errorData)
        throw new Error(errorData.error || 'Geocoding failed')
      }
    } catch (error) {
      console.error('Location detection error:', error)
      toast({
        title: 'Location Detection Failed',
        description: 'Could not detect your location. You can enter it manually.',
        variant: 'destructive'
      })
    } finally {
      setIsDetectingLocation(false)
    }
  }

  // Handle evidence captured
  const handleEvidenceCaptured = (file: File) => {
    const evidenceItem = {
      id: crypto.randomUUID(),
      file,
      type: file.type.startsWith('video') ? 'video' : 'photo',
      timestamp: new Date(),
      uploaded: false
    }

    setCapturedEvidence(prev => [...prev, evidenceItem])
    
    toast({
      title: 'Evidence Captured',
      description: 'Photo/video saved successfully',
      variant: 'success'
    })
  }

  // Handle location detected
  const handleLocationDetected = (location: string) => {
    setCurrentLocation(location)
  }

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
        setUploadProgress(prev => ({ ...prev, [item.id]: 0 }))
        
        // Simulate progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => ({
            ...prev,
            [item.id]: Math.min(prev[item.id] + 10, 90)
          }))
        }, 100)

        try {
          const url = await uploadEvidenceItem(item)
          uploadResults[item.id] = url
          
          // Update evidence with URL
          setCapturedEvidence(prev => prev.map(e => 
            e.id === item.id ? { ...e, url, uploaded: true } : e
          ))
          
          setUploadProgress(prev => ({ ...prev, [item.id]: 100 }))
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

    // Store evidence and location in session storage
    sessionStorage.setItem('reportEvidence', JSON.stringify(capturedEvidence))
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
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const data = await response.json()
        setUserGcashNumber(data.gcashNumber)
      }
    } catch (error) {
      console.error('Error fetching user GCash:', error)
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
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-red-600 rounded-lg flex items-center justify-center">
                <Icon name="dashboard" size={20} color="white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
                <p className="text-xs text-gray-600">Welcome, {session?.user?.name?.split(' ')[0]}</p>
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

        {/* GCash Setup Prompt */}
        {!userGcashNumber && (
          <Card className="border-2 border-yellow-200 bg-gradient-to-r from-yellow-50 to-yellow-100">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-yellow-600 rounded-2xl flex items-center justify-center mx-auto">
                  <Icon name="warning" size={32} color="white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-yellow-900">GCash Setup Required</h2>
                  <p className="text-sm text-yellow-700 mt-1">
                    Set up your GCash number to submit reports and receive payments
                  </p>
                </div>
                <Button 
                  onClick={() => router.push('/dashboard/profile')}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-white h-12 text-lg font-semibold rounded-xl"
                >
                  <Icon name="person" size={20} className="mr-2" />
                  Set Up GCash Number
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Primary Report Method - Mobile First */}
        <Card className={`border-2 ${!userGcashNumber ? 'border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100' : 'border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100'}`}>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className={`w-16 h-16 ${!userGcashNumber ? 'bg-gray-600' : 'bg-blue-600'} rounded-2xl flex items-center justify-center mx-auto`}>
                <Icon name="camera" size={32} color="white" />
              </div>
              <div>
                <h2 className={`text-xl font-bold ${!userGcashNumber ? 'text-gray-900' : 'text-blue-900'}`}>Report Traffic Violation</h2>
                <p className={`text-sm ${!userGcashNumber ? 'text-gray-700' : 'text-blue-700'} mt-1`}>
                  {!userGcashNumber ? 'Set up GCash number first to submit reports' : 'Capture evidence instantly, then complete the report'}
                </p>
              </div>
              <Button 
                onClick={() => {
                  if (!userGcashNumber) {
                    router.push('/dashboard/profile')
                    return
                  }
                  // Detect location first, then open camera
                  detectLocation()
                  setShowCamera(true)
                }}
                className={`w-full ${!userGcashNumber ? 'bg-gray-600 hover:bg-gray-700' : 'bg-blue-600 hover:bg-blue-700'} text-white h-12 text-lg font-semibold rounded-xl`}
              >
                {!userGcashNumber ? (
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
              <div className={`flex items-center justify-center space-x-4 text-xs ${!userGcashNumber ? 'text-gray-600' : 'text-blue-600'}`}>
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


        {/* Recent Activity - Mobile */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Recent Activity</CardTitle>
            <CardDescription className="text-sm">Your latest submissions</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-500 text-sm">Loading your reports...</p>
              </div>
            ) : recentReports.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Icon name="report" size={48} color="#D1D5DB" />
                <p className="text-sm mt-2">No reports yet. Submit your first report!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentReports.map((report) => (
                  <div key={report.id} className="p-4 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon name="report" size={20} color="#3B82F6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-gray-900 text-sm">#{report.reportCode}</h4>
                          <Badge className={getStatusColor(report.status)}>
                            {getStatusText(report.status)}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 mb-1">
                          {report.offense.name} • {new Date(report.createdAt).toLocaleDateString()}
                        </p>
                        {report.locationAddress && (
                          <p className="text-xs text-gray-500 flex items-center">
                            <Icon name="location" size={12} className="mr-1" />
                            {report.locationAddress}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-green-600">
                          ₱{(report.penaltyAmount * 0.05).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {report.status === 'PAID' ? 'Earned' : 
                           report.status === 'APPROVED' ? 'Approved' : 'Potential'}
                        </p>
                        {report.media.length > 0 && (
                          <p className="text-xs text-gray-500 flex items-center">
                            <Icon name="photo" size={12} className="mr-1" />
                            {report.media.length}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {recentReports.length > 0 && (
                  <div className="p-4">
                    <Button variant="outline" asChild className="w-full">
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

        {/* Evidence Management - Show when camera is active */}
        {showCamera && (
          <Card className="fixed inset-0 z-50 bg-black">
            <FullscreenCamera
              onEvidenceCaptured={handleEvidenceCaptured}
              onLocationDetected={handleLocationDetected}
              onClose={() => setShowCamera(false)}
            />
          </Card>
        )}

        {/* Evidence Preview - Show when evidence is captured */}
        {capturedEvidence.length > 0 && !showCamera && (
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
                        setCapturedEvidence(prev => prev.filter(e => e.id !== item.id))
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
      </main>
    </div>
  )
}
