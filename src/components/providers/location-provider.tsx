'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { useToast } from './toast-provider'

interface LocationContextType {
  currentLocation: string
  isDetectingLocation: boolean
  detectLocation: () => Promise<void>
}

const LocationContext = createContext<LocationContextType | undefined>(undefined)

export function LocationProvider({ children }: { children: ReactNode }) {
  const [currentLocation, setCurrentLocation] = useState<string>('')
  const [isDetectingLocation, setIsDetectingLocation] = useState(false)
  const { toast } = useToast()

  const detectLocation = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (isDetectingLocation) {
      console.log('🌍 Location detection already in progress, skipping...')
      return
    }

    if (!navigator.geolocation) {
      toast({
        title: 'Location Not Supported',
        description: 'Your browser does not support location services',
        variant: 'destructive'
      })
      return
    }

    console.log('🌍 Starting location detection...')
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
      console.log('🌐 Calling geocoding API...')
      const response = await fetch(`/api/geocoding?lat=${latitude}&lng=${longitude}`)
      console.log('🌐 Geocoding response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('📍 Geocoding response:', data)
        
        if (data.success && data.address) {
          setCurrentLocation(data.address)
        } else if (data.fallback) {
          setCurrentLocation(data.fallback)
        } else {
          throw new Error(data.message || 'No address found')
        }
      } else {
        const errorData = await response.json()
        console.error('Geocoding API error:', errorData)
        throw new Error(errorData.error || 'Failed to get location')
      }
    } catch (error) {
      console.error('Location detection error:', error)
      toast({
        title: 'Location Detection Failed',
        description: error instanceof Error ? error.message : 'Could not detect your location',
        variant: 'destructive'
      })
    } finally {
      setIsDetectingLocation(false)
    }
  }, [isDetectingLocation, toast])

  return (
    <LocationContext.Provider value={{ currentLocation, isDetectingLocation, detectLocation }}>
      {children}
    </LocationContext.Provider>
  )
}

export function useLocation() {
  const context = useContext(LocationContext)
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider')
  }
  return context
}
