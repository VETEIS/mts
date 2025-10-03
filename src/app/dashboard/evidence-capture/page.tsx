'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/providers/toast-provider'
import FullscreenCamera from '@/components/ui/fullscreen-camera'

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
        setCurrentLocation(data.address)
        
        toast({
          title: 'Location Detected',
          description: `Found: ${data.address}`,
          variant: 'success'
        })
      } else {
        throw new Error('Geocoding failed')
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

  // Auto-detect location on page load
  useEffect(() => {
    detectLocation()
  }, [])

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
    
    // Auto-upload evidence
    await uploadEvidence(evidenceItem)
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
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📸 Capture Evidence
          </h1>
          <p className="text-gray-600">
            Document traffic violations with photos and videos. Evidence is automatically saved.
          </p>
          
          {/* Location Display */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-center space-x-2">
              <span className="text-blue-600">📍</span>
              {isDetectingLocation ? (
                <span className="text-blue-600 text-sm">Detecting your location...</span>
              ) : currentLocation ? (
                <div className="text-center">
                  <span className="text-blue-800 font-medium text-sm">Current Location:</span>
                  <p className="text-blue-700 text-sm mt-1">{currentLocation}</p>
                </div>
              ) : (
                <div className="text-center">
                  <span className="text-gray-600 text-sm">Location not detected</span>
                  <button
                    onClick={detectLocation}
                    className="ml-2 text-blue-600 text-sm underline hover:text-blue-700"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Evidence Preview */}
        {capturedEvidence.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>📁 Captured Evidence ({capturedEvidence.length})</span>
                <span className="text-sm font-normal text-gray-500">
                  {capturedEvidence.filter(e => e.uploaded).length} uploaded
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {capturedEvidence.map((evidence) => (
                  <div key={evidence.id} className="border rounded-lg p-3 bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        {evidence.type === 'photo' ? '📸' : '🎥'} {evidence.type.toUpperCase()}
                      </span>
                      <div className="flex items-center space-x-2">
                        {evidence.uploaded ? (
                          <span className="text-green-600 text-xs">✓ Uploaded</span>
                        ) : (
                          <span className="text-yellow-600 text-xs">⏳ Uploading...</span>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeEvidence(evidence.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                    
                    {/* Media Preview */}
                    <div className="mb-2">
                      {evidence.type === 'photo' ? (
                        <img 
                          src={URL.createObjectURL(evidence.file)} 
                          alt="Evidence preview"
                          className="w-full h-24 object-cover rounded border"
                        />
                      ) : (
                        <video 
                          src={URL.createObjectURL(evidence.file)}
                          className="w-full h-24 object-cover rounded border"
                          controls
                          muted
                        />
                      )}
                    </div>
                    
                    <p className="text-xs text-gray-600">
                      {evidence.timestamp.toLocaleTimeString()}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {evidence.file.name}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Camera Controls */}
        <div className="text-center space-y-4">
          <Button
            onClick={() => setShowCamera(true)}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg"
            disabled={isUploading}
          >
            📸 Open Camera
          </Button>
          
          <p className="text-sm text-gray-500">
            Capture photos and videos of traffic violations
          </p>
        </div>

        {/* Proceed Button */}
        {capturedEvidence.length > 0 && (
          <div className="mt-8 text-center">
            <Button
              onClick={proceedToForm}
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg"
              disabled={capturedEvidence.some(e => !e.uploaded)}
            >
              📝 Complete Report ({capturedEvidence.length} evidence items)
            </Button>
            {capturedEvidence.some(e => !e.uploaded) && (
              <p className="text-sm text-yellow-600 mt-2">
                ⏳ Please wait for all evidence to finish uploading...
              </p>
            )}
          </div>
        )}

        {/* Fullscreen Camera */}
        {showCamera && (
          <FullscreenCamera
            onEvidenceCaptured={handleEvidenceCaptured}
            onClose={() => setShowCamera(false)}
            disabled={isUploading}
          />
        )}
      </div>
    </div>
  )
}
