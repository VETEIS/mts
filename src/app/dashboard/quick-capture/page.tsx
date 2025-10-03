'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/providers/toast-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import QuickCapture from '@/components/ui/quick-capture'
import Link from 'next/link'

interface CapturedEvidence {
  id: string
  file: File
  type: 'photo' | 'video'
  timestamp: Date
  uploaded: boolean
  url?: string
}

export default function QuickCapturePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  
  const [capturedEvidence, setCapturedEvidence] = useState<CapturedEvidence[]>([])
  const [isUploading, setIsUploading] = useState(false)

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
    }
  }, [session, status, router])

  const handleEvidenceCaptured = async (file: File) => {
    const evidence: CapturedEvidence = {
      id: `evidence-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      type: file.type.startsWith('video/') ? 'video' : 'photo',
      timestamp: new Date(),
      uploaded: false
    }

    setCapturedEvidence(prev => [...prev, evidence])

    // Auto-upload evidence
    try {
      setIsUploading(true)
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        setCapturedEvidence(prev => 
          prev.map(e => 
            e.id === evidence.id 
              ? { ...e, uploaded: true, url: result.url }
              : e
          )
        )
        
        toast({
          title: 'Evidence Uploaded',
          description: `${evidence.type === 'photo' ? 'Photo' : 'Video'} uploaded successfully`,
          variant: 'success'
        })
      } else {
        throw new Error('Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload evidence. Will retry when you complete the report.',
        variant: 'error'
      })
    } finally {
      setIsUploading(false)
    }
  }

  const removeEvidence = (id: string) => {
    setCapturedEvidence(prev => prev.filter(e => e.id !== id))
  }

  const proceedToReport = () => {
    // Store evidence in sessionStorage for the report form
    const evidenceData = capturedEvidence.map(e => ({
      id: e.id,
      type: e.type,
      timestamp: e.timestamp,
      uploaded: e.uploaded,
      url: e.url,
      fileName: e.file.name
    }))
    
    sessionStorage.setItem('quickCaptureEvidence', JSON.stringify(evidenceData))
    router.push('/dashboard/report/new?quickCapture=true')
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="outline" asChild>
                <Link href="/dashboard">
                  ← Back to Dashboard
                </Link>
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">📸 Report Traffic Violation</h1>
                <p className="text-sm text-gray-600">Capture evidence instantly - fill details later (Recommended method)</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Instructions */}
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-800">📸 Recommended Reporting Method</CardTitle>
              <CardDescription className="text-blue-700">
                <strong>Why this method is better:</strong> Traffic violations happen in seconds. 
                Capture evidence instantly, then fill out details when convenient. 
                This ensures you don't miss critical evidence!
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Quick Capture Component */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Evidence Capture</CardTitle>
              <CardDescription>
                Start the camera to capture photos or videos of the violation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <QuickCapture 
                onEvidenceCaptured={handleEvidenceCaptured}
                disabled={isUploading}
              />
            </CardContent>
          </Card>

          {/* Captured Evidence */}
          {capturedEvidence.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Captured Evidence ({capturedEvidence.length})</CardTitle>
                <CardDescription>
                  Review your captured evidence before proceeding to the report form
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
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
                      <p className="text-xs text-gray-600">
                        {evidence.timestamp.toLocaleTimeString()}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {evidence.file.name}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="flex space-x-4">
                  <Button 
                    onClick={proceedToReport}
                    className="flex-1"
                    disabled={capturedEvidence.length === 0}
                  >
                    📝 Complete Report ({capturedEvidence.length} evidence)
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => setCapturedEvidence([])}
                    disabled={capturedEvidence.length === 0}
                  >
                    Clear All
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tips */}
          <Card className="bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-green-800">💡 Pro Tips</CardTitle>
            </CardHeader>
            <CardContent className="text-green-700">
              <ul className="space-y-2 text-sm">
                <li>• <strong>License plates:</strong> Try to capture clear, readable license plate numbers</li>
                <li>• <strong>Vehicle details:</strong> Include make, model, color, and any distinctive features</li>
                <li>• <strong>Location context:</strong> Capture street signs, landmarks, or building names</li>
                <li>• <strong>Multiple angles:</strong> Take photos from different perspectives for better evidence</li>
                <li>• <strong>Video duration:</strong> Keep videos under 20 seconds for quick upload</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
