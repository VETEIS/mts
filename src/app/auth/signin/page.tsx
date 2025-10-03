'use client'

import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Icon from '@/components/ui/icon'

export default function SignInPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Check if user is already signed in
    const checkSession = async () => {
      const session = await getSession()
      if (session) {
        router.push('/dashboard')
      }
    }
    checkSession()
  }, [router])

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    try {
      const result = await signIn('google', {
        callbackUrl: '/dashboard',
        redirect: false,
      })
      
      if (result?.error) {
        console.error('Sign in error:', result.error)
      } else if (result?.url) {
        router.push(result.url)
      }
    } catch (error) {
      console.error('Sign in failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50">
      {/* Mobile-First Layout */}
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <div className="px-6 py-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Icon name="admin" size={32} color="white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Modern Traffic System
            </h1>
            <p className="text-gray-600 text-sm">
              Philippine Traffic Violation Reporting Platform
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center px-6 pb-8">
          <Card className="w-full max-w-sm shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="text-center space-y-6">
                {/* Welcome Message */}
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Welcome Back
                  </h2>
                  <p className="text-sm text-gray-600">
                    Sign in to access your dashboard
                  </p>
                </div>

                {/* Google Sign In Button */}
                <Button
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 h-14 text-base font-medium rounded-xl shadow-sm"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-3">
                      <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3">
                      <svg className="w-6 h-6" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      <span>Continue with Google</span>
                    </div>
                  )}
                </Button>

                {/* Features Preview */}
                <div className="space-y-4 pt-4">
                  <div className="text-xs text-gray-500 text-center">
                    What you can do with MTS:
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Icon name="camera" size={16} color="#3B82F6" />
                      <span>Capture Evidence</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Icon name="report" size={16} color="#10B981" />
                      <span>Submit Reports</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Icon name="location" size={16} color="#F59E0B" />
                      <span>GPS Location</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Icon name="peso" size={16} color="#8B5CF6" />
                      <span>Earn Rewards</span>
                    </div>
                  </div>
                </div>

                {/* Terms */}
                <div className="text-xs text-gray-500 text-center leading-relaxed">
                  By signing in, you agree to our Terms of Service and Privacy Policy
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 text-center">
          <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
            <Icon name="security" size={14} color="#6B7280" />
            <span>Secure • Fast • Reliable</span>
          </div>
        </div>
      </div>
    </div>
  )
}
