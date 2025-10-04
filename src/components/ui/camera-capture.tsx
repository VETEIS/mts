'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface CameraCaptureProps {
  onCapture: (file: File) => void
  onError: (error: string) => void
  disabled?: boolean
  maxFiles?: number
  maxTotalSize?: number // in MB
}

export default function CameraCapture({ 
  onCapture, 
  onError, 
  disabled = false, 
  maxFiles = 10, 
  maxTotalSize = 100 
}: CameraCaptureProps) {
  const [isStreaming, setIsStreaming] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [capturedMedia, setCapturedMedia] = useState<File[]>([])
  const [totalSize, setTotalSize] = useState(0)
  const [recordingTime, setRecordingTime] = useState(0)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordingChunksRef = useRef<Blob[]>([])
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)

  const startCamera = useCallback(async () => {
    try {
      // Request camera access with specific constraints to prevent gallery access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          // Security: Restrict to specific constraints
          frameRate: { ideal: 30, max: 60 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsStreaming(true)
        setHasPermission(true)
      }
    } catch (error) {
      console.error('Camera access error:', error)
      setHasPermission(false)
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          onError('Camera permission denied. Please allow camera access to capture evidence.')
        } else if (error.name === 'NotFoundError') {
          onError('No camera found. Please ensure you have a working camera.')
        } else {
          onError('Failed to access camera. Please try again.')
        }
      } else {
        onError('Camera access failed. Please try again.')
      }
    }
  }, [onError])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsStreaming(false)
  }, [])

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context) return

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Flip the image horizontally to correct the mirror effect
    context.save()
    context.scale(-1, 1)
    context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height)
    context.restore()

    // Convert canvas to blob with compression
    canvas.toBlob((blob) => {
      if (blob) {
        // Create file with timestamp for uniqueness
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const file = new File([blob], `evidence-photo-${timestamp}.jpg`, {
          type: 'image/jpeg',
          lastModified: Date.now()
        })
        
        // Check size limits
        const newTotalSize = totalSize + (file.size / (1024 * 1024)) // Convert to MB
        if (newTotalSize > maxTotalSize) {
          onError(`Total file size would exceed ${maxTotalSize}MB limit`)
          return
        }
        
        if (capturedMedia.length >= maxFiles) {
          onError(`Maximum ${maxFiles} files allowed`)
          return
        }
        
        setCapturedMedia(prev => [...prev, file])
        setTotalSize(newTotalSize)
        onCapture(file)
      }
    }, 'image/jpeg', 0.8) // Compressed JPEG for size management
  }, [onCapture, totalSize, maxTotalSize, maxFiles, capturedMedia.length, onError])

  const stopVideoRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current)
      recordingTimerRef.current = null
    }
  }, [isRecording])

  const startVideoRecording = useCallback(() => {
    if (!streamRef.current) return

    try {
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: 'video/webm;codecs=vp9' // Better compression
      })
      
      mediaRecorderRef.current = mediaRecorder
      recordingChunksRef.current = []
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordingChunksRef.current.push(event.data)
        }
      }
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordingChunksRef.current, { type: 'video/webm' })
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const file = new File([blob], `evidence-video-${timestamp}.webm`, {
          type: 'video/webm',
          lastModified: Date.now()
        })
        
        // Check size limits
        const newTotalSize = totalSize + (file.size / (1024 * 1024))
        if (newTotalSize > maxTotalSize) {
          onError(`Total file size would exceed ${maxTotalSize}MB limit`)
          return
        }
        
        if (capturedMedia.length >= maxFiles) {
          onError(`Maximum ${maxFiles} files allowed`)
          return
        }
        
        setCapturedMedia(prev => [...prev, file])
        setTotalSize(newTotalSize)
        onCapture(file)
        setIsRecording(false)
        setRecordingTime(0)
      }
      
      mediaRecorder.start()
      setIsRecording(true)
      
      // Start recording timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 20) { // 20 second limit
            stopVideoRecording()
            return 20
          }
          return prev + 1
        })
      }, 1000)
      
    } catch (error) {
      console.error('Recording start error:', error)
      onError('Failed to start video recording')
    }
  }, [totalSize, maxTotalSize, maxFiles, capturedMedia.length, onError, onCapture, stopVideoRecording])

  const removeMedia = useCallback((index: number) => {
    const fileToRemove = capturedMedia[index]
    const removedSize = fileToRemove.size / (1024 * 1024)
    
    setCapturedMedia(prev => prev.filter((_, i) => i !== index))
    setTotalSize(prev => prev - removedSize)
  }, [capturedMedia])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Evidence Capture</span>
        </CardTitle>
        <CardDescription>
          Capture photos and videos directly from camera for evidence integrity. 
          Gallery access is disabled for security. Max {maxFiles} files, {maxTotalSize}MB total.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isStreaming && !hasPermission && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-gray-600 mb-4">Camera access required for evidence capture</p>
            <Button 
              type="button"
              onClick={startCamera} 
              disabled={disabled}
              className="w-full"
            >
              Start Camera
            </Button>
          </div>
        )}

        {isStreaming && (
          <div className="space-y-4">
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-64 object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />
              <div className="absolute inset-0 border-2 border-white border-dashed rounded-lg pointer-events-none" />
            </div>
            
            <div className="space-y-3">
              {/* Recording Timer */}
              {isRecording && (
                <div className="text-center">
                  <div className="inline-flex items-center space-x-2 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span>Recording: {recordingTime}s / 20s</span>
                  </div>
                </div>
              )}
              
              {/* Camera Controls */}
              <div className="flex space-x-2">
                <Button 
                  type="button"
                  onClick={capturePhoto}
                  className="flex-1"
                  disabled={disabled || isRecording}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Photo
                </Button>
                
                {!isRecording ? (
                  <Button 
                    type="button"
                    onClick={startVideoRecording}
                    variant="outline"
                    className="flex-1"
                    disabled={disabled}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Video (20s)
                  </Button>
                ) : (
                  <Button 
                    type="button"
                    onClick={stopVideoRecording}
                    variant="destructive"
                    className="flex-1"
                    disabled={disabled}
                  >
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <rect x="6" y="6" width="12" height="12" rx="2" />
                    </svg>
                    Stop Recording
                  </Button>
                )}
              </div>
              
              <Button 
                type="button"
                variant="outline" 
                onClick={stopCamera}
                disabled={disabled || isRecording}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {hasPermission === false && (
          <div className="text-center py-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-red-600 text-sm">Camera access denied</p>
            <Button 
              type="button"
              variant="outline" 
              onClick={startCamera}
              className="mt-2"
              disabled={disabled}
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Captured Media Display */}
        {capturedMedia.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-900">
                Captured Evidence ({capturedMedia.length}/{maxFiles})
              </h4>
              <span className="text-xs text-gray-500">
                {totalSize.toFixed(1)}MB / {maxTotalSize}MB
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {capturedMedia.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    {file.type.startsWith('video/') ? (
                      <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                    <span className="text-sm text-green-800 truncate">{file.name}</span>
                  </div>
                  <button
                    onClick={() => removeMedia(index)}
                    className="ml-2 p-1 text-red-600 hover:text-red-800"
                    disabled={disabled}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hidden canvas for photo capture */}
        <canvas ref={canvasRef} className="hidden" />
      </CardContent>
    </Card>
  )
}
