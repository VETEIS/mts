'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { Toast, Toaster } from '@/components/ui/toast'

interface ToastData {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive' | 'success' | 'warning'
  duration?: number
}

interface ToastContextType {
  toasts: ToastData[]
  toast: (data: Omit<ToastData, 'id'>) => void
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([])
  const [lastToastTime, setLastToastTime] = useState<number>(0)

  const toast = useCallback((data: Omit<ToastData, 'id'>) => {
    const now = Date.now()
    
    // Debounce: prevent toasts within 500ms of each other
    if (now - lastToastTime < 500) {
      return
    }
    
    // Check for duplicate toasts (same title and description)
    const isDuplicate = toasts.some(existing => 
      existing.title === data.title && 
      existing.description === data.description
    )
    
    if (isDuplicate) {
      return // Don't show duplicate toasts
    }
    
    setLastToastTime(now)
    const id = Math.random().toString(36).substr(2, 9)
    const newToast = { ...data, id }
    
    setToasts(prev => [...prev, newToast])
    
    // Auto dismiss after duration (shorter default)
    const duration = data.duration || 2000
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duration)
  }, [toasts, lastToastTime])

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <Toaster>
        {toasts.map(({ id, title, description, variant = 'default' }) => (
          <Toast 
            key={id} 
            variant={variant} 
            className="max-w-xs text-xs p-3 shadow-lg border"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                {title && <div className="text-xs font-medium truncate mb-1">{title}</div>}
                {description && <div className="text-xs opacity-80 leading-tight">{description}</div>}
              </div>
              <button
                onClick={() => dismiss(id)}
                className="flex-shrink-0 p-0.5 text-foreground/50 hover:text-foreground transition-colors rounded"
              >
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </Toast>
        ))}
      </Toaster>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
