'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { useToast } from './toast-provider'

interface EvidenceItem {
  id: string
  file: File
  type: 'photo' | 'video'
  timestamp: Date
  uploaded: boolean
  url?: string
}

interface EvidenceContextType {
  capturedEvidence: EvidenceItem[]
  evidenceCount: number
  addEvidence: (file: File) => void
  removeEvidence: (id: string) => void
  updateEvidenceUpload: (id: string, uploaded: boolean, url?: string) => void
  clearEvidence: () => void
  isUploading: boolean
  uploadProgress: { [key: string]: number }
  setUploadProgress: (progress: { [key: string]: number }) => void
  setIsUploading: (uploading: boolean) => void
}

const EvidenceContext = createContext<EvidenceContextType | undefined>(undefined)

export function EvidenceProvider({ children }: { children: ReactNode }) {
  const [capturedEvidence, setCapturedEvidence] = useState<EvidenceItem[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const { toast } = useToast()

  const addEvidence = useCallback((file: File) => {
    const evidenceItem: EvidenceItem = {
      id: crypto.randomUUID(),
      file,
      type: file.type.startsWith('video') ? 'video' : 'photo',
      timestamp: new Date(),
      uploaded: false
    }

    setCapturedEvidence(prev => [...prev, evidenceItem])
    
    // Save to session storage
    const updatedEvidence = [...capturedEvidence, evidenceItem]
    sessionStorage.setItem('reportEvidence', JSON.stringify(updatedEvidence))
  }, [capturedEvidence])

  const removeEvidence = useCallback((id: string) => {
    setCapturedEvidence(prev => {
      const newEvidence = prev.filter(item => item.id !== id)
      sessionStorage.setItem('reportEvidence', JSON.stringify(newEvidence))
      return newEvidence
    })
  }, [])

  const updateEvidenceUpload = useCallback((id: string, uploaded: boolean, url?: string) => {
    setCapturedEvidence(prev => {
      const newEvidence = prev.map(item => 
        item.id === id 
          ? { ...item, uploaded, url }
          : item
      )
      sessionStorage.setItem('reportEvidence', JSON.stringify(newEvidence))
      return newEvidence
    })
  }, [])

  const clearEvidence = useCallback(() => {
    setCapturedEvidence([])
    sessionStorage.removeItem('reportEvidence')
  }, [])

  return (
    <EvidenceContext.Provider value={{
      capturedEvidence,
      evidenceCount: capturedEvidence.length,
      addEvidence,
      removeEvidence,
      updateEvidenceUpload,
      clearEvidence,
      isUploading,
      uploadProgress,
      setUploadProgress,
      setIsUploading
    }}>
      {children}
    </EvidenceContext.Provider>
  )
}

export function useEvidence() {
  const context = useContext(EvidenceContext)
  if (context === undefined) {
    throw new Error('useEvidence must be used within an EvidenceProvider')
  }
  return context
}
