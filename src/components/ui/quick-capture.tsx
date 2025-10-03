'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/components/providers/toast-provider'

interface QuickCaptureProps {
  onEvidenceCaptured: (file: File) => void
  disabled?: boolean
}

export default function QuickCapture({ onEvidenceCaptured, disabled = false }: QuickCaptureProps) {
  const [isStreaming, setIsStreaming] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordingChunksRef = useRef<Blob[]>([])
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)
  
  const { toast } = useToast()

  const startCamera = useCallback(async () => {
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported on this device')
      }

      // Mobile-optimized camera constraints
      const constraints = {
        video: {
          facingMode: 'environment', // Back camera
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 }
        },
        audio: true
      }
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        // Ensure video plays on mobile
        await videoRef.current.play()
      }
      
      setIsStreaming(true)
      setHasPermission(true)
      
      toast({
        title: '📸 Camera Ready',
        description: 'Full screen camera activated - tap the white circle to capture!',
        variant: 'success'
      })
    } catch (error) {
      console.error('Camera access error:', error)
      setHasPermission(false)
      
      let errorMessage = 'Please allow camera access to capture evidence'
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Camera permission denied. Please allow camera access in your browser settings.'
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No camera found on this device.'
        } else if (error.name === 'NotSupportedError') {
          errorMessage = 'Camera not supported on this device.'
        }
      }
      
      toast({
        title: 'Camera Access Failed',
        description: errorMessage,
        variant: 'error'
      })
    }
  }, [toast])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsStreaming(false)
    setIsRecording(false)
    setRecordingTime(0)
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current)
      recordingTimerRef.current = null
    }
  }, [])

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const video = videoRef.current
    const context = canvas.getContext('2d')
    
    if (!context) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    context.drawImage(video, 0, 0)
    
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `evidence-${Date.now()}.jpg`, { type: 'image/jpeg' })
        onEvidenceCaptured(file)
        
        toast({
          title: 'Photo Captured',
          description: 'Evidence photo saved - you can add more or complete the report',
          variant: 'success'
        })
      }
    }, 'image/jpeg', 0.9)
  }, [onEvidenceCaptured, toast])

  const startVideoRecording = useCallback(() => {
    if (!streamRef.current) return

    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType: 'video/webm;codecs=vp9'
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
      const file = new File([blob], `evidence-video-${Date.now()}.webm`, { type: 'video/webm' })
      onEvidenceCaptured(file)
      
      toast({
        title: 'Video Captured',
        description: 'Evidence video saved - you can add more or complete the report',
        variant: 'success'
      })
      
      setIsRecording(false)
      setRecordingTime(0)
    }
    
    mediaRecorder.start()
    setIsRecording(true)
    setRecordingTime(0)
    
    recordingTimerRef.current = setInterval(() => {
      setRecordingTime(prev => {
        if (prev >= 20) {
          stopVideoRecording()
          return 20
        }
        return prev + 1
      })
    }, 1000)
  }, [onEvidenceCaptured, toast])

  const stopVideoRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current)
      recordingTimerRef.current = null
    }
  }, [isRecording])

  return (
    <div className="space-y-4">
      {!isStreaming && hasPermission !== false && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">📱 Mobile Camera Access</h3>
          <p className="text-gray-600 mb-4">
            Tap to start camera - will request permission first
          </p>
          <Button 
            type="button"
            onClick={startCamera} 
            disabled={disabled}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            size="lg"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            📸 Open Camera
          </Button>
        </div>
      )}

      {isStreaming && (
        <div className="fixed inset-0 z-50 bg-black">
          {/* Full Screen Camera View */}
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Recording Indicator */}
            {isRecording && (
              <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center">
                <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                REC {recordingTime}s
              </div>
            )}
            
            {/* Camera Controls Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <div className="flex items-center justify-center space-x-4 mb-4">
                {/* Photo Button - Large Circle */}
                <button
                  type="button"
                  onClick={capturePhoto}
                  disabled={disabled || isRecording}
                  className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg disabled:opacity-50"
                >
                  <svg className="w-8 h-8 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                
                {/* Video Button */}
                {!isRecording ? (
                  <button
                    type="button"
                    onClick={startVideoRecording}
                    disabled={disabled}
                    className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center shadow-lg disabled:opacity-50"
                  >
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopVideoRecording}
                    disabled={disabled}
                    className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center shadow-lg disabled:opacity-50"
                  >
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <rect x="6" y="6" width="12" height="12" rx="2" />
                    </svg>
                  </button>
                )}
              </div>
              
              {/* Close Button */}
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={stopCamera}
                  disabled={disabled || isRecording}
                  className="bg-white/20 text-white px-6 py-2 rounded-full text-sm font-medium disabled:opacity-50"
                >
                  Close Camera
                </button>
              </div>
            </div>
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
          <p className="text-red-600 text-sm mb-2">Camera access denied</p>
          <p className="text-xs text-gray-500 mb-4">
            Make sure to allow camera access in your browser settings
          </p>
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

      {/* Debug Info for Mobile */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
          <p><strong>Debug Info:</strong></p>
          <p>Streaming: {isStreaming ? 'Yes' : 'No'}</p>
          <p>Permission: {hasPermission === null ? 'Unknown' : hasPermission ? 'Granted' : 'Denied'}</p>
          <p>User Agent: {navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'}</p>
          <p>HTTPS: {location.protocol === 'https:' ? 'Yes' : 'No'}</p>
        </div>
      )}
    </div>
  )
}
