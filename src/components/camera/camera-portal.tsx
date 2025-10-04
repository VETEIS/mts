'use client'

import { createPortal } from 'react-dom'
import { useEffect, useState } from 'react'
import FullscreenCamera from '@/components/ui/fullscreen-camera'
import { useEvidence } from '@/components/providers/evidence-provider'
import { useLocation } from '@/components/providers/location-provider'

interface CameraPortalProps {
  isOpen: boolean
  onClose: () => void
  onEvidenceCaptured: (file: File) => void
}

export default function CameraPortal({ isOpen, onClose, onEvidenceCaptured }: CameraPortalProps) {
  const [mounted, setMounted] = useState(false)
  const { evidenceCount } = useEvidence()
  const { currentLocation, isDetectingLocation } = useLocation()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !isOpen) {
    return null
  }

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black">
      <FullscreenCamera
        onEvidenceCaptured={onEvidenceCaptured}
        onClose={onClose}
        currentLocation={currentLocation}
        isDetectingLocation={isDetectingLocation}
      />
    </div>,
    document.body
  )
}
