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
import Icon from '@/components/ui/icon'

interface EvidenceData {
  id: string
  type: 'photo' | 'video'
  timestamp: Date
  url?: string
  uploaded: boolean
  file?: File
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
  const [isLoadingOffenses, setIsLoadingOffenses] = useState(true)
  const [userGcashNumber, setUserGcashNumber] = useState<string | null>(null)
  const [isLoadingGcash, setIsLoadingGcash] = useState(true)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [submittedReportCode, setSubmittedReportCode] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    offenseId: '',
    location: '',
    description: '',
    isAnonymous: false
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
        router.push('/dashboard')
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

    // Load user GCash number
    const fetchUserGcash = async () => {
      try {
        setIsLoadingGcash(true)
        const response = await fetch('/api/user/profile')
        if (response.ok) {
          const data = await response.json()
          setUserGcashNumber(data.gcashNumber)
        }
      } catch (error) {
        console.error('Error fetching user GCash:', error)
      } finally {
        setIsLoadingGcash(false)
      }
    }
    fetchUserGcash()
  }, [router, toast])

  // Load offenses
  useEffect(() => {
    const fetchOffenses = async () => {
      try {
        setIsLoadingOffenses(true)
        const response = await fetch('/api/offenses')
        if (response.ok) {
          const data = await response.json()
          setOffenses(data)
        } else {
          throw new Error('Failed to load offenses')
        }
      } catch (error) {
        console.error('Error loading offenses:', error)
        toast({
          title: 'Failed to Load Offenses',
          description: 'Please refresh the page and try again',
          variant: 'error'
        })
      } finally {
        setIsLoadingOffenses(false)
      }
    }
    fetchOffenses()
  }, [toast])

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

    // Check if all evidence is uploaded
    const unuploadedEvidence = evidence.filter(e => !e.uploaded || !e.url)
    if (unuploadedEvidence.length > 0) {
      toast({
        title: 'Evidence Not Uploaded',
        description: `${unuploadedEvidence.length} evidence items are not uploaded. Please go back and upload them first.`,
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
        isAnonymous: formData.isAnonymous,
        evidenceUrls: evidence
          .map(e => e.url)
          .filter(url => url !== null && url !== undefined && url !== '')
      }
      
      console.log('Submitting report with data:', reportData)
      
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
        
        // Show success modal
        setSubmittedReportCode(result.reportCode)
        setShowSuccessModal(true)
        
        // Auto redirect after 3 seconds
        setTimeout(() => {
          router.push('/dashboard')
        }, 3000)
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Mobile Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="p-2"
            >
              <Icon name="back" size={20} />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Complete Report</h1>
              <p className="text-xs text-gray-500">Finalize your evidence</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard')}
            className="p-2"
          >
            <Icon name="home" size={20} />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-6">

        {/* GCash Setup Warning */}
        {!isLoadingGcash && !userGcashNumber && (
          <Card className="border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Icon name="warning" size={20} color="#F59E0B" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-yellow-900 mb-1">GCash Number Required</h3>
                  <p className="text-sm text-yellow-800 mb-3">
                    Set up your GCash number to submit reports and receive 5% earnings
                  </p>
                  <Button
                    onClick={() => router.push('/dashboard/profile')}
                    size="sm"
                    className="bg-yellow-600 hover:bg-yellow-700 text-white h-8 text-xs font-semibold"
                  >
                    <Icon name="person" size={14} className="mr-2" />
                    Set Up GCash
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Evidence Summary */}
        <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Icon name="folder" size={20} color="#10B981" />
              </div>
              <div>
                <h3 className="font-bold text-green-900">Evidence Captured</h3>
                <p className="text-sm text-green-700">Review your captured evidence</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-white/60 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-1">
                  <Icon name="photo" size={14} color="#6B7280" />
                  <span className="font-semibold text-gray-700">Photos</span>
                </div>
                <span className="text-lg font-bold text-green-600">
                  {evidence.filter(e => e.type === 'photo').length}
                </span>
              </div>
              
              <div className="bg-white/60 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-1">
                  <Icon name="video" size={14} color="#6B7280" />
                  <span className="font-semibold text-gray-700">Videos</span>
                </div>
                <span className="text-lg font-bold text-green-600">
                  {evidence.filter(e => e.type === 'video').length}
                </span>
              </div>
            </div>
            
            <div className="mt-3 pt-3 border-t border-green-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Upload Status</span>
                {evidence.every(e => e.uploaded && e.url) ? (
                  <div className="flex items-center space-x-1 text-green-600">
                    <Icon name="check" size={14} />
                    <span className="text-sm font-semibold">All Uploaded</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1 text-red-600">
                    <Icon name="warning" size={14} />
                    <span className="text-sm font-semibold">Not All Uploaded</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upload Warning */}
        {evidence.some(e => !e.uploaded || !e.url) && (
          <Card className="border-red-200 bg-gradient-to-r from-red-50 to-pink-50 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Icon name="warning" size={20} color="#EF4444" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-red-900 mb-1">Evidence Not Uploaded</h3>
                  <p className="text-sm text-red-800 mb-3">
                    Some evidence items are not uploaded yet. Please go back to the dashboard and upload them first.
                  </p>
                  <Button
                    onClick={() => router.push('/dashboard')}
                    size="sm"
                    variant="outline"
                    className="border-red-300 text-red-700 hover:bg-red-50 h-8 text-xs font-semibold"
                  >
                    <Icon name="back" size={14} className="mr-2" />
                    Back to Dashboard
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Report Form */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
            <CardTitle className="flex items-center space-x-2 text-blue-900">
              <Icon name="report" size={20} />
              <span>Violation Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Offense Type */}
              <div className="space-y-2">
                <Label htmlFor="offenseId" className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                  <Icon name="warning" size={16} color="#6B7280" />
                  <span>Traffic Violation *</span>
                </Label>
                <Select 
                  value={formData.offenseId} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, offenseId: value }))}
                  disabled={isLoadingOffenses}
                >
                  <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-blue-500 rounded-xl">
                    <SelectValue placeholder={isLoadingOffenses ? "Loading violations..." : "Select the type of violation"} />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingOffenses ? (
                      <div className="p-4 text-center">
                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Loading violations...</p>
                      </div>
                    ) : (
                      offenses.map((offense) => (
                        <SelectItem key={offense.id} value={offense.id} className="py-2">
                          <div className="flex items-center justify-between w-full text-sm">
                            <span className="font-medium truncate">{offense.name}</span>
                            <span className="text-green-600 font-semibold ml-2 text-xs">₱{(offense.penaltyAmount * 0.05).toLocaleString()}</span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location" className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                  <Icon name="location" size={16} color="#6B7280" />
                  <span>Location *</span>
                </Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="e.g., EDSA corner Ayala Avenue, Makati City"
                  required
                  className="h-12 border-2 border-gray-200 focus:border-blue-500 rounded-xl"
                />
                {formData.location && (
                  <div className="flex items-center space-x-2 text-green-600 bg-green-50 p-2 rounded-lg">
                    <Icon name="check" size={14} />
                    <span className="text-sm font-medium">Location auto-detected from GPS</span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                  <Icon name="edit" size={16} color="#6B7280" />
                  <span>Additional Details</span>
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what happened, time of day, weather conditions, etc."
                  rows={3}
                  className="border-2 border-gray-200 focus:border-blue-500 rounded-xl resize-none"
                />
              </div>

              {/* Anonymous Reporting */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="isAnonymous"
                    checked={formData.isAnonymous}
                    onChange={(e) => setFormData(prev => ({ ...prev, isAnonymous: e.target.checked }))}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Icon name="security" size={18} color="#3B82F6" />
                      <Label htmlFor="isAnonymous" className="text-sm font-bold text-blue-900 cursor-pointer">
                        Report Anonymously
                      </Label>
                    </div>
                    <p className="text-xs text-blue-800">
                      Your name will be hidden from the public report to protect your identity
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex flex-col space-y-3 pt-6">
                <Button
                  type="submit"
                  disabled={isSubmitting || isLoadingOffenses || evidence.some(e => !e.uploaded || !e.url) || isLoadingGcash || !userGcashNumber}
                  className="w-full h-14 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed rounded-xl shadow-lg font-semibold text-base"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
                      Submitting Report...
                    </>
                  ) : isLoadingGcash ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
                      Loading...
                    </>
                  ) : !userGcashNumber ? (
                    <>
                      <Icon name="warning" size={18} className="mr-3" />
                      Set Up GCash Number First
                    </>
                  ) : evidence.some(e => !e.uploaded || !e.url) ? (
                    <>
                      <Icon name="warning" size={18} className="mr-3" />
                      Upload Evidence First
                    </>
                  ) : (
                    <>
                      <Icon name="send" size={18} className="mr-3" />
                      Submit Report
                    </>
                  )}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/dashboard')}
                  disabled={isSubmitting}
                  className="w-full h-12 border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 rounded-xl font-medium"
                >
                  <Icon name="back" size={16} className="mr-2" />
                  Back to Dashboard
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 animate-in zoom-in-95 duration-300">
            <div className="text-center">
              {/* Success Animation */}
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Icon name="check" size={40} color="#10B981" />
              </div>
              
              {/* Success Message */}
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Report Submitted Successfully!
              </h2>
              
              <p className="text-gray-600 mb-4">
                Your report has been submitted for review by our traffic enforcement team.
              </p>
              
              {/* Report Code */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <p className="text-sm text-gray-500 mb-1">Report Code</p>
                <p className="text-lg font-mono font-bold text-gray-900">
                  {submittedReportCode}
                </p>
              </div>
              
              {/* Auto Redirect Info */}
              <div className="flex items-center justify-center text-sm text-gray-500 mb-6">
                <Icon name="time" size={16} className="mr-2" />
                Redirecting to dashboard in 3 seconds...
              </div>
              
              {/* Manual Redirect Button */}
              <Button
                onClick={() => router.push('/dashboard')}
                className="w-full bg-green-600 hover:bg-green-700 text-white h-12 rounded-xl font-semibold"
              >
                <Icon name="dashboard" size={18} className="mr-2" />
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
