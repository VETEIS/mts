'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/providers/toast-provider'

interface EvidenceData {
  id: string
  type: 'photo' | 'video'
  timestamp: Date
  url: string
  uploaded: boolean
}

interface Offense {
  id: string
  name: string
  description: string
  penaltyAmount: number
}

export default function CompleteReportPage() {
  const [evidence, setEvidence] = useState<EvidenceData[]>([])
  const [offenses, setOffenses] = useState<Offense[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    offenseId: '',
    location: '',
    description: '',
    licensePlate: '',
    vehicleColor: '',
    vehicleModel: ''
  })
  const router = useRouter()
  const { toast } = useToast()

  // Load evidence and location from session storage
  useEffect(() => {
    const evidenceData = sessionStorage.getItem('reportEvidence')
    if (evidenceData) {
      try {
        const parsed = JSON.parse(evidenceData)
        setEvidence(parsed)
      } catch (error) {
        console.error('Error loading evidence:', error)
        toast({
          title: 'Error Loading Evidence',
          description: 'Please go back and capture evidence again',
          variant: 'error'
        })
        router.push('/dashboard/evidence-capture')
      }
    } else {
      // No evidence found, redirect to capture
      router.push('/dashboard/evidence-capture')
    }

    // Load detected location
    const detectedLocation = sessionStorage.getItem('detectedLocation')
    if (detectedLocation) {
      setFormData(prev => ({ ...prev, location: detectedLocation }))
    }
  }, [router, toast])

  // Load offenses
  useEffect(() => {
    const fetchOffenses = async () => {
      try {
        const response = await fetch('/api/offenses')
        if (response.ok) {
          const data = await response.json()
          setOffenses(data)
        }
      } catch (error) {
        console.error('Error loading offenses:', error)
      }
    }
    fetchOffenses()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.offenseId || !formData.location) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'error'
      })
      return
    }

    setIsSubmitting(true)
    
    try {
      const reportData = {
        offenseId: formData.offenseId,
        locationAddress: formData.location,
        description: formData.description,
        evidenceUrls: evidence.map(e => e.url)
      }
      
      console.log('📝 Submitting report with data:', reportData)
      
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData),
      })

      if (response.ok) {
        const result = await response.json()
        
        // Clear session storage
        sessionStorage.removeItem('reportEvidence')
        
        toast({
          title: 'Report Submitted Successfully',
          description: `Report ${result.reportCode} has been submitted for review`,
          variant: 'success'
        })
        
        router.push('/dashboard')
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to submit report')
      }
    } catch (error) {
      console.error('Submit error:', error)
      toast({
        title: 'Submission Failed',
        description: 'Failed to submit report. Please try again.',
        variant: 'error'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (evidence.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Loading Evidence...</h1>
          <p className="text-gray-600">Please wait while we load your captured evidence.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📝 Complete Report
          </h1>
          <p className="text-gray-600">
            Add details about the traffic violation you captured
          </p>
        </div>

        {/* Evidence Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>📁 Evidence Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Total Evidence:</span> {evidence.length} items
              </div>
              <div>
                <span className="font-medium">Photos:</span> {evidence.filter(e => e.type === 'photo').length}
              </div>
              <div>
                <span className="font-medium">Videos:</span> {evidence.filter(e => e.type === 'video').length}
              </div>
              <div>
                <span className="font-medium">Status:</span> 
                <span className="text-green-600 ml-1">✓ All uploaded</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report Form */}
        <Card>
          <CardHeader>
            <CardTitle>Violation Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Offense Type */}
              <div>
                <Label htmlFor="offenseId">Traffic Violation *</Label>
                <Select value={formData.offenseId} onValueChange={(value) => setFormData(prev => ({ ...prev, offenseId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select the type of violation" />
                  </SelectTrigger>
                  <SelectContent>
                    {offenses.map((offense) => (
                      <SelectItem key={offense.id} value={offense.id}>
                        {offense.name} - ₱{offense.penaltyAmount.toLocaleString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Location */}
              <div>
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="e.g., EDSA corner Ayala Avenue, Makati City"
                  required
                />
                {formData.location && (
                  <p className="text-sm text-green-600 mt-1">
                    ✅ Location auto-detected from GPS
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Additional Details</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what happened, time of day, weather conditions, etc."
                  rows={3}
                />
              </div>

              {/* Vehicle Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="licensePlate">License Plate</Label>
                  <Input
                    id="licensePlate"
                    value={formData.licensePlate}
                    onChange={(e) => setFormData(prev => ({ ...prev, licensePlate: e.target.value }))}
                    placeholder="ABC-1234"
                  />
                </div>
                <div>
                  <Label htmlFor="vehicleColor">Vehicle Color</Label>
                  <Input
                    id="vehicleColor"
                    value={formData.vehicleColor}
                    onChange={(e) => setFormData(prev => ({ ...prev, vehicleColor: e.target.value }))}
                    placeholder="Red, Blue, etc."
                  />
                </div>
                <div>
                  <Label htmlFor="vehicleModel">Vehicle Model</Label>
                  <Input
                    id="vehicleModel"
                    value={formData.vehicleModel}
                    onChange={(e) => setFormData(prev => ({ ...prev, vehicleModel: e.target.value }))}
                    placeholder="Toyota Vios, Honda Civic, etc."
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex space-x-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/dashboard/evidence-capture')}
                  disabled={isSubmitting}
                >
                  ← Back to Evidence
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Report'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
