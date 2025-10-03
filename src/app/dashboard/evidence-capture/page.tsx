'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/providers/toast-provider'
import FullscreenCamera from '@/components/ui/fullscreen-camera'
import Icon from '@/components/ui/icon'

interface EvidenceItem {
  id: string
  file: File
  type: 'photo' | 'video'
  timestamp: Date
  uploaded: boolean
  url?: string
}

export default function EvidenceCapturePage() {
  const [showCamera, setShowCamera] = useState(false)
  const [capturedEvidence, setCapturedEvidence] = useState<EvidenceItem[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<string>('')
  const [isDetectingLocation, setIsDetectingLocation] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Detect current location
  const detectLocation = async () => {
    if (!navigator.geolocation) {
      toast({
        title: 'Location Not Supported',
        description: 'Your browser does not support location services',
        variant: 'error'
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
        variant: 'error'
      })
    } finally {
      setIsDetectingLocation(false)
    }
  }

  // Remove auto-detect location on page load
  // Location will be detected when camera opens

  // Handle pre-captured evidence from quick capture
  useEffect(() => {
    const quickCaptureEvidence = sessionStorage.getItem('quickCaptureEvidence')
    if (quickCaptureEvidence) {
      try {
        const evidenceData = JSON.parse(quickCaptureEvidence)
        if (evidenceData.length > 0) {
          toast({
            title: 'Pre-captured Evidence Loaded',
            description: `${evidenceData.length} evidence items loaded from quick capture`,
            variant: 'success'
          })
          // Clear the session storage after loading
          sessionStorage.removeItem('quickCaptureEvidence')
        }
      } catch (error) {
        console.error('Error loading quick capture evidence:', error)
      }
    }
  }, [toast])

  const handleEvidenceCaptured = async (file: File) => {
    const evidenceItem: EvidenceItem = {
      id: `evidence-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      type: file.type.startsWith('video') ? 'video' : 'photo',
      timestamp: new Date(),
      uploaded: false
    }

    setCapturedEvidence(prev => [...prev, evidenceItem])
    
    // Don't auto-upload - let user select which ones to upload
    toast({
      title: 'Evidence Captured',
      description: 'Photo/video saved locally. Select which ones to upload.',
      variant: 'success'
    })
  }

  const uploadEvidence = async (evidence: EvidenceItem) => {
    setIsUploading(true)
    try {
      console.log('Starting upload for evidence:', {
        id: evidence.id,
        type: evidence.type,
        fileSize: evidence.file.size,
        fileName: evidence.file.name
      })

      const formData = new FormData()
      formData.append('file', evidence.file)

      console.log('FormData created, sending request to /api/upload')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      console.log('Upload response status:', response.status)
      console.log('Upload response headers:', Object.fromEntries(response.headers.entries()))

      if (response.ok) {
        const result = await response.json()
        console.log('Upload successful:', result)
        
        // Update evidence with upload URL
        setCapturedEvidence(prev => 
          prev.map(item => 
            item.id === evidence.id 
              ? { ...item, uploaded: true, url: result.url }
              : item
          )
        )

        toast({
          title: 'Evidence Uploaded',
          description: `${evidence.type === 'photo' ? 'Photo' : 'Video'} uploaded successfully`,
          variant: 'success'
        })
      } else {
        const errorText = await response.text()
        console.error('Upload failed with response:', errorText)
        throw new Error(`Upload failed: ${response.status} - ${errorText}`)
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: 'Upload Failed',
        description: `Failed to upload evidence: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'error'
      })
    } finally {
      setIsUploading(false)
    }
  }

  const removeEvidence = (id: string) => {
    setCapturedEvidence(prev => prev.filter(item => item.id !== id))
    toast({
      title: 'Evidence Removed',
      description: 'Evidence item removed from your report',
      variant: 'success'
    })
  }

  const uploadSelectedEvidence = async () => {
    const unuploadedEvidence = capturedEvidence.filter(item => !item.uploaded)
    
    if (unuploadedEvidence.length === 0) {
      toast({
        title: 'No Evidence to Upload',
        description: 'All evidence is already uploaded',
        variant: 'info'
      })
      return
    }

    setIsUploading(true)
    let successCount = 0
    let failCount = 0

    for (const evidence of unuploadedEvidence) {
      try {
        await uploadEvidence(evidence)
        successCount++
      } catch (error) {
        console.error('Upload failed for evidence:', evidence.id, error)
        failCount++
      }
    }

    setIsUploading(false)

    if (successCount > 0) {
      toast({
        title: 'Upload Complete',
        description: `${successCount} evidence items uploaded successfully`,
        variant: 'success'
      })
    }

    if (failCount > 0) {
      toast({
        title: 'Some Uploads Failed',
        description: `${failCount} evidence items failed to upload`,
        variant: 'error'
      })
    }
  }

  const proceedToForm = () => {
    if (capturedEvidence.length === 0) {
      toast({
        title: 'No Evidence Captured',
        description: 'Please capture at least one piece of evidence before proceeding',
        variant: 'error'
      })
      return
    }

    // Store evidence in session for the form
    const evidenceData = capturedEvidence.map(item => ({
      id: item.id,
      type: item.type,
      timestamp: item.timestamp,
      url: item.url,
      uploaded: item.uploaded
    }))
    
    sessionStorage.setItem('reportEvidence', JSON.stringify(evidenceData))
    
    // Store detected location for the form
    if (currentLocation) {
      sessionStorage.setItem('detectedLocation', currentLocation)
    }
    
    // Redirect to completion form
    router.push('/dashboard/report/complete')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
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
              <h1 className="text-lg font-semibold text-gray-900">Capture Evidence</h1>
              <p className="text-xs text-gray-600">Document traffic violations</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Mobile First */}
      <main className="px-4 py-6 space-y-6">
        {/* Location Status */}
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Icon name="location" size={20} color="#3B82F6" />
            </div>
            <div className="flex-1">
              {isDetectingLocation ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-blue-600 text-sm">Detecting location...</span>
                </div>
              ) : currentLocation ? (
                <div>
                  <p className="text-sm font-medium text-gray-900">Location Detected</p>
                  <p className="text-xs text-gray-600 truncate">{currentLocation}</p>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Location Not Detected</p>
                    <p className="text-xs text-gray-600">Tap to detect your location</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={detectLocation}
                    className="text-blue-600 border-blue-200"
                  >
                    <Icon name="location" size={16} className="mr-1" />
                    Detect
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Evidence Preview - Mobile */}
        {capturedEvidence.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Icon name="folder" size={20} color="#6B7280" />
                  <span>Captured Evidence ({capturedEvidence.length})</span>
                </CardTitle>
                <span className="text-sm text-gray-500">
                  {capturedEvidence.filter(e => e.uploaded).length} uploaded
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-3">
                {capturedEvidence.map((evidence) => (
                  <div key={evidence.id} className="p-4 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-start space-x-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        {evidence.type === 'photo' ? (
                          <Icon name="photo" size={24} color="#6B7280" />
                        ) : (
                          <Icon name="video" size={24} color="#6B7280" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">
                            {evidence.type.toUpperCase()}
                          </span>
                          <div className="flex items-center space-x-2">
                            {evidence.uploaded ? (
                              <span className="text-green-600 text-xs flex items-center">
                                <Icon name="check" size={12} className="mr-1" />
                                Uploaded
                              </span>
                            ) : (
                              <span className="text-yellow-600 text-xs flex items-center">
                                <Icon name="pending" size={12} className="mr-1" />
                                Pending
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Media Preview */}
                        <div className="mb-2">
                          {evidence.type === 'photo' ? (
                            <img 
                              src={URL.createObjectURL(evidence.file)} 
                              alt="Evidence preview"
                              className="w-full h-20 object-cover rounded border"
                            />
                          ) : (
                            <video 
                              src={URL.createObjectURL(evidence.file)}
                              className="w-full h-20 object-cover rounded border"
                              controls
                              muted
                            />
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-600">
                            {evidence.timestamp.toLocaleTimeString()}
                          </p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeEvidence(evidence.id)}
                            className="text-red-600 hover:text-red-700 p-1"
                          >
                            <Icon name="delete" size={16} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Camera Controls - Mobile */}
        <div className="space-y-4">
          <Button
            onClick={() => setShowCamera(true)}
            size="lg"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white h-14 text-lg font-semibold rounded-xl"
            disabled={isUploading}
          >
            <Icon name="camera" size={24} className="mr-3" />
            Open Camera
          </Button>
          
          <p className="text-center text-sm text-gray-500">
            Capture photos and videos of traffic violations
          </p>
        </div>

        {/* Upload and Proceed Buttons - Mobile */}
        {capturedEvidence.length > 0 && (
          <div className="space-y-4">
            {/* Upload Status */}
            <Card className="p-4 bg-gray-50">
              <div className="text-center space-y-3">
                <p className="text-sm text-gray-600">
                  {capturedEvidence.filter(e => e.uploaded).length} uploaded, {capturedEvidence.filter(e => !e.uploaded).length} pending
                </p>
                
                {/* Bulk Upload Button */}
                {capturedEvidence.some(e => !e.uploaded) && (
                  <Button
                    onClick={uploadSelectedEvidence}
                    disabled={isUploading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12"
                  >
                    {isUploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Icon name="upload" size={20} className="mr-2" />
                        Upload All Evidence
                      </>
                    )}
                  </Button>
                )}
              </div>
            </Card>

            {/* Proceed Button */}
            <Button
              onClick={proceedToForm}
              size="lg"
              className="w-full bg-green-600 hover:bg-green-700 text-white h-14 text-lg font-semibold rounded-xl"
            >
              <Icon name="send" size={24} className="mr-3" />
              Complete Report ({capturedEvidence.length} items)
            </Button>
          </div>
        )}

        {/* Fullscreen Camera */}
        {showCamera && (
          <FullscreenCamera
            onEvidenceCaptured={handleEvidenceCaptured}
            onClose={() => setShowCamera(false)}
            onLocationDetected={(location) => setCurrentLocation(location)}
            disabled={isUploading}
          />
        )}
      </main>
    </div>
  )
}
