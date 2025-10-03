'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/components/providers/toast-provider'

interface QuickCaptureProps {
  onEvidenceCaptured: (file: File) => void
  disabled?: boolean
}

export default function QuickCapture({ onEvidenceCaptured, disabled = false }: QuickCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [photo, setPhoto] = useState<string | null>(null)
  const [videoURL, setVideoURL] = useState<string | null>(null)
  const [chunks, setChunks] = useState<Blob[]>([])
  const [recording, setRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  
  const { toast } = useToast()

  // Start camera stream
  useEffect(() => {
    const startCamera = async () => {
      try {
        console.log('Starting camera...')
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: true,
        })
        console.log('Camera stream obtained:', mediaStream)
        setStream(mediaStream)
        
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
          console.log('Video srcObject set')
        }
      } catch (err) {
        console.error('Camera access error:', err)
        toast({
          title: 'Camera Access Failed',
          description: 'Please allow camera access to capture evidence',
          variant: 'error'
        })
      }
    }
    
    if (!disabled) {
      startCamera()
    }

    return () => {
      // Cleanup will be handled by the component unmount
    }
  }, [disabled, toast]) // REMOVED 'stream' from dependencies!

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
    
    // Flip the image horizontally to correct the mirror effect
    ctx?.save()
    ctx?.scale(-1, 1)
    ctx?.drawImage(videoRef.current, -canvas.width, 0, canvas.width, canvas.height)
    ctx?.restore()
    
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `evidence-${Date.now()}.jpg`, { type: 'image/jpeg' })
        onEvidenceCaptured(file)
        setPhoto(canvas.toDataURL('image/png'))
        
        toast({
          title: 'Photo Captured',
          description: 'Evidence photo saved - you can add more or complete the report',
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
      setVideoURL(URL.createObjectURL(blob))
      
      toast({
        title: 'Video Captured',
        description: 'Evidence video saved - you can add more or complete the report',
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
    <div className="flex flex-col items-center gap-4">
      {/* Camera Preview */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full max-w-md rounded-lg shadow"
      />

      {/* Controls */}
      <div className="flex gap-2">
        <button
          onClick={capturePhoto}
          className="px-4 py-2 rounded bg-blue-600 text-white"
          disabled={disabled}
        >
          📸 Take Photo
        </button>
        {!recording ? (
          <button
            onClick={startRecording}
            className="px-4 py-2 rounded bg-red-600 text-white"
            disabled={disabled}
          >
            🎥 Record
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="px-4 py-2 rounded bg-gray-600 text-white"
            disabled={disabled}
          >
            ⏹ Stop ({recordingTime}s)
          </button>
        )}
      </div>

      {/* Preview */}
      {photo && <img src={photo} alt="Captured" className="rounded shadow" />}
      {videoURL && (
        <video src={videoURL} controls className="rounded shadow w-full" />
      )}

      {/* Debug Info */}
      <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
        <p><strong>Debug Info:</strong></p>
        <p>Stream: {stream ? 'Active' : 'None'}</p>
        <p>Video Element: {videoRef.current ? 'Found' : 'Not Found'}</p>
        <p>Recording: {recording ? 'Yes' : 'No'}</p>
        {videoRef.current && (
          <p>Video Ready State: {videoRef.current.readyState}</p>
        )}
        {stream && (
          <p>Stream Tracks: {stream.getTracks().length}</p>
        )}
      </div>
    </div>
  )
}
