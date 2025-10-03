'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/providers/toast-provider'

interface FullscreenCameraProps {
  onEvidenceCaptured: (file: File) => void
  onClose: () => void
  disabled?: boolean
}

export default function FullscreenCamera({ onEvidenceCaptured, onClose, disabled = false }: FullscreenCameraProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [recording, setRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [chunks, setChunks] = useState<Blob[]>([])
  
  const { toast } = useToast()

  // Start camera stream
  useEffect(() => {
    const startCamera = async () => {
      try {
        console.log('Starting fullscreen camera...')
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'environment',
            width: { ideal: 1920, max: 1920 },
            height: { ideal: 1080, max: 1080 }
          },
          audio: true,
        })
        console.log('Fullscreen camera stream obtained:', mediaStream)
        setStream(mediaStream)
        
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
          console.log('Fullscreen video srcObject set')
        }
      } catch (err) {
        console.error('Fullscreen camera access error:', err)
        toast({
          title: 'Camera Access Failed',
          description: 'Please allow camera access to capture evidence',
          variant: 'error'
        })
        onClose()
      }
    }
    
    if (!disabled) {
      startCamera()
    }

    return () => {
      // Cleanup will be handled by the component unmount
    }
  }, [disabled, toast, onClose])

  // Cleanup effect for stream
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [stream])

  // Take a photo
  const capturePhoto = () => {
    if (!videoRef.current) return
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    const ctx = canvas.getContext('2d')
    ctx?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
    
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `evidence-${Date.now()}.jpg`, { type: 'image/jpeg' })
        onEvidenceCaptured(file)
        
        toast({
          title: 'Photo Captured',
          description: 'Evidence photo saved successfully',
          variant: 'success'
        })
      }
    }, 'image/jpeg', 0.9)
  }

  // Start recording
  const startRecording = () => {
    if (!stream) return
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' })
    mediaRecorderRef.current = recorder
    setChunks([])
    recorder.ondataavailable = e => {
      if (e.data.size > 0) setChunks(prev => [...prev, e.data])
    }
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' })
      const file = new File([blob], `evidence-video-${Date.now()}.webm`, { type: 'video/webm' })
      onEvidenceCaptured(file)
      
      toast({
        title: 'Video Captured',
        description: 'Evidence video saved successfully',
        variant: 'success'
      })
    }
    recorder.start()
    setRecording(true)
    setRecordingTime(0)
    
    // 20 second timer
    const timer = setInterval(() => {
      setRecordingTime(prev => {
        if (prev >= 20) {
          stopRecording()
          return 20
        }
        return prev + 1
      })
    }, 1000)
    
    // Store timer for cleanup
    mediaRecorderRef.current = recorder as any
    ;(mediaRecorderRef.current as any).timer = timer
  }

  // Stop recording
  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    setRecording(false)
    if ((mediaRecorderRef.current as any)?.timer) {
      clearInterval((mediaRecorderRef.current as any).timer)
    }
  }

  return (
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
        
        {/* Recording Indicator */}
        {recording && (
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
              disabled={disabled || recording}
              className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg disabled:opacity-50"
            >
              <svg className="w-8 h-8 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            
            {/* Video Button */}
            {!recording ? (
              <button
                type="button"
                onClick={startRecording}
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
                onClick={stopRecording}
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
              onClick={onClose}
              disabled={disabled || recording}
              className="bg-white/20 text-white px-6 py-2 rounded-full text-sm font-medium disabled:opacity-50"
            >
              Close Camera
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
