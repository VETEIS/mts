'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useToast } from '@/components/providers/toast-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import CameraCapture from '@/components/ui/camera-capture'
import Link from 'next/link'

const reportSchema = z.object({
  offenseId: z.string().min(1, 'Please select an offense'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(500, 'Description must be less than 500 characters'),
  locationAddress: z.string().optional(),
})

type ReportFormData = z.infer<typeof reportSchema>

interface Offense {
  id: string
  name: string
  description: string | null
  penaltyAmount: number
}

interface LocationData {
  latitude: number
  longitude: number
  accuracy: number
  address?: string
}

export default function NewReportPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [offenses, setOffenses] = useState<Offense[]>([])
  const [location, setLocation] = useState<LocationData | null>(null)
  const [locationError, setLocationError] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [mediaFiles, setMediaFiles] = useState<File[]>([])
  const [uploadingMedia, setUploadingMedia] = useState(false)

  const form = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      offenseId: '',
      description: '',
      locationAddress: '',
    },
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

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

  useEffect(() => {
    // Fetch offenses
    const fetchOffenses = async () => {
      try {
        const response = await fetch('/api/offenses')
        if (response.ok) {
          const data = await response.json()
          setOffenses(data)
        }
      } catch (error) {
        console.error('Error fetching offenses:', error)
      }
    }

    fetchOffenses()
  }, [])

  const getCurrentLocation = () => {
    setIsLoadingLocation(true)
    setLocationError('')

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser')
      setIsLoadingLocation(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords
        
        try {
          // Get address from coordinates using our geocoding API
          const response = await fetch('/api/geocoding', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ latitude, longitude })
          })
          
          let address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
          
          if (response.ok) {
            const data = await response.json()
            if (data.success && data.address) {
              address = data.address
            } else if (data.fallback) {
              address = data.fallback
            }
          }

          setLocation({
            latitude,
            longitude,
            accuracy: Math.round(accuracy),
            address
          })

          form.setValue('locationAddress', address)
        } catch (error) {
          console.error('Error getting address:', error)
          const address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
          setLocation({
            latitude,
            longitude,
            accuracy: Math.round(accuracy),
            address
          })
          form.setValue('locationAddress', address)
        }
        
        setIsLoadingLocation(false)
      },
      (error) => {
        setLocationError(`Location error: ${error.message}`)
        setIsLoadingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    )
  }

  const handleMediaCapture = async (file: File) => {
    setUploadingMedia(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        await response.json()
        setMediaFiles(prev => [...prev, file])
        toast({
          title: 'Media Uploaded',
          description: 'Evidence photo/video uploaded successfully',
          variant: 'success'
        })
      } else {
        const error = await response.json()
        toast({
          title: 'Upload Failed',
          description: error.error || 'Failed to upload media',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: 'Upload Error',
        description: 'Network error occurred while uploading',
        variant: 'destructive'
      })
    } finally {
      setUploadingMedia(false)
    }
  }

  const handleMediaError = (error: string) => {
    console.error('Camera error:', error)
    toast({
      title: 'Camera Error',
      description: error,
      variant: 'destructive'
    })
  }

  const onSubmit = async (data: ReportFormData) => {
    setIsSubmitting(true)

    try {
      const reportData = {
        ...data,
        locationLat: location?.latitude,
        locationLng: location?.longitude,
        locationAccuracy: location?.accuracy,
      }

      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData),
      })

      if (response.ok) {
        const report = await response.json()
        toast({
          title: 'Report Submitted',
          description: `Report ${report.reportCode} created successfully`,
          variant: 'success'
        })
        router.push(`/dashboard/reports/${report.id}`)
      } else {
        const error = await response.json()
        toast({
          title: 'Submission Failed',
          description: error.error || 'Failed to create report',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error submitting report:', error)
      toast({
        title: 'Submission Error',
        description: 'Network error occurred while submitting',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
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
          <div className="flex items-center space-x-4">
            <Button variant="outline" asChild>
              <Link href="/dashboard">
                ← Back to Dashboard
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Submit New Report</h1>
              <p className="text-sm text-gray-600">Report a traffic violation and earn rewards</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Traffic Violation Report</CardTitle>
              <CardDescription>
                Fill out the form below to report a traffic violation. Make sure to provide accurate information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Offense Selection */}
                  <FormField
                    control={form.control}
                    name="offenseId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Traffic Offense *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select the type of violation" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {offenses.map((offense) => (
                              <SelectItem key={offense.id} value={offense.id}>
                                <div className="flex justify-between items-center w-full">
                                  <span>{offense.name}</span>
                                  <span className="text-sm text-gray-500 ml-2">
                                    ₱{offense.penaltyAmount.toLocaleString()}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Select the type of traffic violation you witnessed
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Description */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe the violation in detail (license plate, vehicle description, circumstances, etc.)"
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Provide detailed information about the violation (minimum 10 characters)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Location */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Location Information</h3>
                        <p className="text-sm text-gray-600">GPS location helps verify the report</p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={getCurrentLocation}
                        disabled={isLoadingLocation}
                      >
                        {isLoadingLocation ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                            <span>Getting Location...</span>
                          </div>
                        ) : (
                          'Get Current Location'
                        )}
                      </Button>
                    </div>

                    {location && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center space-x-2 text-green-800">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="font-medium">Location captured</span>
                        </div>
                        <p className="text-sm text-green-700 mt-1">
                          Accuracy: ±{location.accuracy}m
                        </p>
                      </div>
                    )}

                    {locationError && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-700">{locationError}</p>
                      </div>
                    )}

                    <FormField
                      control={form.control}
                      name="locationAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address/Location</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter the address or location of the violation"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            You can manually enter the address or use GPS location
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Evidence Capture */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Evidence Photos</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Capture photos directly from camera for evidence integrity. 
                        Gallery access is disabled to prevent evidence tampering.
                      </p>
                    </div>

                    <CameraCapture
                      onCapture={handleMediaCapture}
                      onError={handleMediaError}
                      disabled={isSubmitting || uploadingMedia}
                      maxFiles={10}
                      maxTotalSize={100}
                    />

                    {mediaFiles.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-900">Captured Evidence</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {mediaFiles.map((file, index) => (
                            <div key={index} className="flex items-center space-x-2 p-2 bg-green-50 border border-green-200 rounded">
                              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span className="text-sm text-green-800">{file.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="flex space-x-4">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Submitting...</span>
                        </div>
                      ) : (
                        'Submit Report'
                      )}
                    </Button>
                    <Button type="button" variant="outline" asChild>
                      <Link href="/dashboard">Cancel</Link>
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
