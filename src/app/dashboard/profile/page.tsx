'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/providers/toast-provider'
import Icon from '@/components/ui/icon'

export default function ProfilePage() {
  const { data: session } = useSession()
  const [gcashNumber, setGcashNumber] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/user/profile')
        if (response.ok) {
          const data = await response.json()
          setGcashNumber(data.gcashNumber || '')
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const handleSave = async () => {
    if (!gcashNumber.trim()) {
      toast({
        title: 'GCash Number Required',
        description: 'Please enter your GCash number to receive payments',
        variant: 'destructive'
      })
      return
    }

    // Validate GCash number format (Philippine mobile number)
    const gcashRegex = /^(\+63|0)?9\d{9}$/
    if (!gcashRegex.test(gcashNumber.replace(/\s/g, ''))) {
      toast({
        title: 'Invalid GCash Number',
        description: 'Please enter a valid Philippine mobile number (e.g., 09123456789)',
        variant: 'destructive'
      })
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gcashNumber }),
      })

      if (response.ok) {
        toast({
          title: 'Profile Updated',
          description: 'Your GCash number has been saved successfully',
          variant: 'success'
        })
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: 'Update Failed',
        description: 'Please try again',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-red-600 rounded-lg flex items-center justify-center">
                <Icon name="person" size={20} color="white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Profile</h1>
                <p className="text-xs text-gray-600">Manage your account settings</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 space-y-6">
        {/* User Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Icon name="person" size={20} color="#3B82F6" />
              <span>Account Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">Name</Label>
              <p className="text-sm text-gray-900 mt-1">{session?.user?.name || 'Not provided'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Email</Label>
              <p className="text-sm text-gray-900 mt-1">{session?.user?.email}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Role</Label>
              <p className="text-sm text-gray-900 mt-1 capitalize">{session?.user?.role?.toLowerCase()}</p>
            </div>
          </CardContent>
        </Card>

        {/* Payment Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Icon name="money" size={20} color="#10B981" />
              <span>Payment Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Icon name="info" size={16} color="#10B981" />
                <span className="text-sm font-medium text-green-800">How Payments Work</span>
              </div>
              <p className="text-xs text-green-700">
                You earn <strong>5% of the penalty amount</strong> when your reports are approved. 
                Payments are sent to your GCash number within 24-48 hours after the offender pays their penalty.
              </p>
            </div>

            <div>
              <Label htmlFor="gcashNumber" className="text-sm font-medium text-gray-700">
                GCash Number *
              </Label>
              <Input
                id="gcashNumber"
                value={gcashNumber}
                onChange={(e) => setGcashNumber(e.target.value)}
                placeholder="09123456789"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter your GCash-registered mobile number to receive payments
              </p>
            </div>

            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Icon name="save" size={16} className="mr-2" />
                  Save GCash Number
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Earnings Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Icon name="chart" size={20} color="#8B5CF6" />
              <span>Earnings Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">Example Earnings</h4>
                <div className="space-y-1 text-xs text-blue-800">
                  <p>• Speeding (₱2,000 penalty) → <strong>₱100 earnings</strong></p>
                  <p>• No Helmet (₱1,500 penalty) → <strong>₱75 earnings</strong></p>
                  <p>• DUI (₱10,000 penalty) → <strong>₱500 earnings</strong></p>
                  <p>• Red Light Violation (₱3,000 penalty) → <strong>₱150 earnings</strong></p>
                </div>
              </div>
              
              <div className="text-xs text-gray-600">
                <p><strong>Note:</strong> You only receive payment after the offender pays their penalty to the authorities.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
