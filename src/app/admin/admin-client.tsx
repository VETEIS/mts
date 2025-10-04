'use client'

import { signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Session } from 'next-auth'
import Icon from '@/components/ui/icon'

interface AdminStats {
  totalReports: number
  pendingReports: number
  approvedReports: number
  rejectedReports: number
  totalUsers: number
  totalRevenue: number
  developerEarnings: number
  pendingPayments: number
}

interface AdminClientProps {
  session: Session
}

export default function AdminClient({ session }: AdminClientProps) {
  const [stats, setStats] = useState<AdminStats>({
    totalReports: 0,
    pendingReports: 0,
    approvedReports: 0,
    rejectedReports: 0,
    totalUsers: 0,
    totalRevenue: 0,
    developerEarnings: 0,
    pendingPayments: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [systemLogs, setSystemLogs] = useState<any[]>([])
  const [showMonthlyModal, setShowMonthlyModal] = useState(false)
  const [devPaymentReceipt, setDevPaymentReceipt] = useState<File | null>(null)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [playfulMessage, setPlayfulMessage] = useState('')
  const [selectedLog, setSelectedLog] = useState<any>(null)
  const [showLogModal, setShowLogModal] = useState(false)

  // Playful messages for developer payment
  const playfulMessages = [
    "For dev's vacation fund, send here:",
    "For dev's dream bike, send here:",
    "For dev's coffee addiction, send here:",
    "For dev's gaming setup, send here:",
    "For dev's new laptop, send here:",
    "For dev's food delivery, send here:",
    "For dev's Netflix subscription, send here:",
    "For dev's gym membership, send here:",
    "For dev's weekend getaway, send here:",
    "For dev's midnight snacks, send here:"
  ]

  const getRandomPlayfulMessage = () => {
    const randomIndex = Math.floor(Math.random() * playfulMessages.length)
    return playfulMessages[randomIndex]
  }

  // Handle logout with loading
  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await signOut({ callbackUrl: '/' })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  useEffect(() => {
    fetchAdminStats()
    fetchSystemLogs()
    
    // Check if it's the 30th of the month - simple check on dashboard load
    const today = new Date()
    const is30th = today.getDate() === 30
    if (is30th) {
      setPlayfulMessage(getRandomPlayfulMessage())
      setShowMonthlyModal(true)
    }
    
    // Debug: Check for test parameter in URL
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('test') === 'monthly') {
      setPlayfulMessage(getRandomPlayfulMessage())
      setShowMonthlyModal(true)
    }
    
    // Listen for refresh messages from other admin pages
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'REFRESH_SYSTEM_LOGS') {
        fetchSystemLogs()
      }
    }
    
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  // Update playful message whenever modal opens
  useEffect(() => {
    if (showMonthlyModal) {
      setPlayfulMessage(getRandomPlayfulMessage())
    }
  }, [showMonthlyModal])

  const fetchAdminStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSystemLogs = async () => {
    try {
      const response = await fetch('/api/admin/logs')
      if (response.ok) {
        const data = await response.json()
        setSystemLogs(data.logs)
      }
    } catch (error) {
      console.error('Error fetching system logs:', error)
    }
  }

  const downloadSystemLogs = async () => {
    if (systemLogs.length === 0) {
      alert('No system logs to download')
      return
    }

    // Log the download action
    try {
      await fetch('/api/admin/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'System Logs Downloaded',
          description: `Downloaded ${systemLogs.length} system log entries`,
          details: `CSV file generated with ${systemLogs.length} log entries`
        })
      })
    } catch (error) {
      console.error('Error logging download action:', error)
    }

    // Create CSV content
    const csvContent = [
      'Date,Time,Action,Description,User,Details',
      ...systemLogs.map(log => [
        new Date(log.createdAt).toLocaleDateString(),
        new Date(log.createdAt).toLocaleTimeString(),
        log.action,
        `"${log.description}"`,
        log.user?.name || 'Unknown',
        `"${log.details || ''}"`
      ].join(','))
    ].join('\n')

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `system-logs-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Refresh system logs to show the new download entry
    fetchSystemLogs()
  }

  const handleDeveloperPayment = async () => {
    if (!devPaymentReceipt) {
      alert('Please attach the GCash transaction receipt first')
      return
    }

    setIsProcessingPayment(true)
    try {
      // Upload receipt
      const formData = new FormData()
      formData.append('file', devPaymentReceipt)
      
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      
      if (!uploadResponse.ok) {
        throw new Error('Failed to upload receipt')
      }
      
      const receiptData = await uploadResponse.json()
      
      // Mark developer payment as sent
      const paymentResponse = await fetch('/api/admin/developer-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: stats.developerEarnings,
          receiptUrl: receiptData.url,
          receiptId: receiptData.publicId
        })
      })
      
      if (paymentResponse.ok) {
        setShowMonthlyModal(false)
        setDevPaymentReceipt(null)
        fetchAdminStats() // Refresh stats
        fetchSystemLogs() // Refresh logs
        alert('Developer payment marked as sent successfully!')
      } else {
        throw new Error('Failed to process payment')
      }
    } catch (error) {
      console.error('Error processing developer payment:', error)
      alert('Failed to process developer payment. Please try again.')
    } finally {
      setIsProcessingPayment(false)
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
      {/* Mobile Header - Match Dashboard Design */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-lg flex items-center justify-center">
                <img 
                  src="/mts-icon.webp" 
                  alt="MTS Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col justify-center items-start">
                <h1 className="text-lg font-semibold text-gray-900 leading-tight">Admin Panel</h1>
                <p className="text-xs text-gray-600 leading-tight">Welcome, {session?.user?.name?.split(' ')[0]}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Developer Earnings in Header */}
              <div className="hidden sm:flex items-center space-x-2 bg-orange-50 px-3 py-1.5 rounded-lg">
                <Icon name="money" size={16} color="#F97316" />
                <span className="text-sm font-medium text-orange-700">
                  Dev: ₱{stats.developerEarnings.toLocaleString()}
                </span>
              </div>
              
                {/* Debug Buttons for Testing */}
                <div className="flex items-center space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      // Test email functionality
                      try {
                        const response = await fetch('/api/debug/email', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ to: session?.user?.email || 'test@example.com' })
                        })
                        const result = await response.json()
                        if (response.ok) {
                          alert('Test email sent! Check your inbox.')
                        } else {
                          alert('Email test failed: ' + result.error)
                        }
                      } catch (error) {
                        alert('Email test error: ' + error)
                      }
                    }}
                    className="text-xs px-2 py-1 h-6 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                  >
                    Test Email
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Simulate 30th day
                      const mockDate = new Date()
                      mockDate.setDate(30)
                      console.log('🎯 Simulating 30th day:', mockDate)
                      setShowMonthlyModal(true)
                    }}
                    className="text-xs px-2 py-1 h-6 bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                  >
                    Sim 30th
                  </Button>
                </div>
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="text-gray-600 hover:text-gray-900 disabled:opacity-50"
              >
                {isLoggingOut ? (
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                ) : (
                  <Icon name="signout" size={18} />
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Mobile First */}
      <main className="px-4 py-6 space-y-6">
        {/* Stats Overview - Mobile Grid */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Icon name="report" size={20} color="#3B82F6" />
              </div>
              <div>
                <div className="text-lg font-bold text-gray-900">{stats.totalReports}</div>
                <p className="text-xs text-gray-600">Total Reports</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Icon name="pending" size={20} color="#F59E0B" />
              </div>
              <div>
                <div className="text-lg font-bold text-yellow-600">{stats.pendingReports}</div>
                <p className="text-xs text-gray-600">Pending</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <Icon name="check" size={20} color="#10B981" />
              </div>
              <div>
                <div className="text-lg font-bold text-green-600">{stats.approvedReports}</div>
                <p className="text-xs text-gray-600">Approved</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Icon name="peso" size={20} color="#8B5CF6" />
              </div>
              <div>
                <div className="text-lg font-bold text-purple-600">₱{stats.totalRevenue.toLocaleString()}</div>
                <p className="text-xs text-gray-600">Revenue</p>
              </div>
            </div>
          </Card>
        </div>


        {/* Quick Actions - Mobile First */}
        <div className="space-y-4">
          {/* Primary Action - Moderate Reports */}
          <Card className="border-2 border-yellow-200 bg-gradient-to-r from-yellow-50 to-yellow-100">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-yellow-600 rounded-2xl flex items-center justify-center mx-auto">
                  <Icon name="settings" size={32} color="white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-yellow-900">Moderate Reports</h2>
                  <p className="text-sm text-yellow-700 mt-1">
                    Review and approve pending reports
                  </p>
                </div>
                <Button asChild className="w-full bg-yellow-600 hover:bg-yellow-700 text-white h-12 text-lg font-semibold rounded-xl">
                  <Link href="/admin/reports">
                    <Icon name="settings" size={20} className="mr-2" />
                    Review Reports ({stats.pendingReports})
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Secondary Actions */}
          <div className="grid grid-cols-1 gap-4">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Icon name="person" size={24} color="#3B82F6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">Manage Users</h3>
                    <p className="text-sm text-gray-600">User accounts and roles</p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/admin/users">
                      <Icon name="forward" size={16} />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                    <Icon name="warning" size={24} color="#EF4444" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">Manage Offenses</h3>
                    <p className="text-sm text-gray-600">Violation types and penalties</p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/admin/offenses">
                      <Icon name="forward" size={16} />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* System Logs - Match Recent Activity Design */}
        <Card className="border border-gray-200 shadow-sm">
          <div className="px-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">
                  System Logs
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadSystemLogs()}
                  className="text-xs px-3 py-1.5 border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700 hover:text-blue-700"
                >
                  <Icon name="download" size={14} className="mr-1" />
                  Download
                </Button>
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Icon name="notification" size={16} color="#3B82F6" />
                </div>
              </div>
            </div>
          </div>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-500 text-sm">Loading system logs...</p>
              </div>
            ) : systemLogs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Icon name="notification" size={24} color="#9CA3AF" />
                </div>
                <p className="text-sm font-medium mb-1">No system logs yet</p>
                <p className="text-xs text-gray-400">Admin actions will be logged here</p>
              </div>
            ) : (
              <div className="space-y-0">
                {systemLogs.map((log, index) => (
                  <div 
                    key={log.id} 
                    className={`${index === 0 ? 'pt-0 pb-4 px-6' : 'pt-2 pb-2 px-5'} border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors cursor-pointer`}
                    onClick={() => {
                      setSelectedLog(log)
                      setShowLogModal(true)
                    }}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Log Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-gray-900 text-sm">{log.action}</h4>
                          <span className="text-xs text-gray-500">
                            {new Date(log.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                            <p className="text-sm text-gray-700 font-medium truncate">
                              {log.description}
                            </p>
                            <span className="text-sm font-bold text-blue-600 flex-shrink-0">
                              {log.userName && !log.userName.includes('Anonymous') ? log.userName : 'System'}
                            </span>
                          </div>
                          <div className="flex items-center text-xs text-gray-500 flex-shrink-0 ml-2">
                            <Icon name="time" size={12} className="mr-1" />
                            {new Date(log.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                        
                        {log.details && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {log.details}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

       {/* Monthly Developer Payment Modal - Unclosable */}
       {showMonthlyModal && (
         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-2xl max-w-md w-full mx-4 animate-in zoom-in-95 duration-300">
             {/* Fixed Header */}
             <div className="px-6 py-4 border-b border-gray-200">
               <div className="flex items-center justify-between">
                 <div>
                   <h2 className="text-xl font-bold text-gray-900">¡DevDay!</h2>
                 </div>
                 {/* Testing Close Button */}
                 <Button
                   variant="ghost"
                   size="sm"
                   onClick={() => setShowMonthlyModal(false)}
                   className="text-gray-400 hover:text-gray-600 p-2"
                 >
                   <Icon name="cancel" size={16} />
                 </Button>
               </div>
             </div>
            
            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Payment Amount */}
              <div className="bg-orange-50 rounded-xl p-4">
                <div className="text-center">
                  <p className="text-sm text-orange-700 mb-1">Total Developer Earnings</p>
                  <p className="text-3xl font-bold text-orange-900">₱{stats.developerEarnings.toLocaleString()}</p>
                  <p className="text-xs text-orange-600 mt-1">2% of all paid penalties in {new Date().toLocaleString('default', { month: 'long' })}</p>
                </div>
              </div>

              {/* Developer GCash QR Code */}
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700 mb-3">
                  {playfulMessage || "Send payment to developer's GCash:"}
                </p>
                <div className="bg-gray-100 rounded-xl p-8 mb-4">
                  <div className="w-32 h-32 bg-white rounded-lg mx-auto flex items-center justify-center border-2 border-dashed border-gray-300">
                    <div className="text-center">
                      <Icon name="photo" size={48} color="#9CA3AF" />
                      <p className="text-xs text-gray-500 mt-2">QR Code</p>
                      <p className="text-xs text-gray-400">(Placeholder)</p>
                    </div>
                  </div>
                </div>
              </div>

               {/* Receipt Upload */}
               <div className="text-center">
                 <label className="text-sm font-medium text-gray-700 mb-2 block">
                   Attach GCash Transaction Receipt *
                 </label>
                 <input
                   type="file"
                   accept="image/*"
                   onChange={(e) => setDevPaymentReceipt(e.target.files?.[0] || null)}
                   className="w-full text-sm text-gray-500 border border-gray-300 rounded-lg p-2 hover:border-orange-300 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                 />
                 {devPaymentReceipt && (
                   <p className="text-sm text-green-600 mt-2">
                     ✓ Receipt selected: {devPaymentReceipt.name}
                   </p>
                 )}
               </div>
            </div>
            
            {/* Fixed Footer */}
            <div className="px-6 py-4 border-t border-gray-200">
              <Button
                onClick={handleDeveloperPayment}
                disabled={!devPaymentReceipt || isProcessingPayment}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white h-12 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessingPayment ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Icon name="money" size={18} className="mr-2" />
                    Mark as Paid
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* System Log Detail Modal */}
      {showLogModal && selectedLog && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full mx-4 animate-in zoom-in-95 duration-300 max-h-[80vh] flex flex-col">
            {/* Fixed Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">System Log Details</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowLogModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-2"
                >
                  <Icon name="cancel" size={16} />
                </Button>
              </div>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Log Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{selectedLog.action}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(selectedLog.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-700">
                      {selectedLog.userName && !selectedLog.userName.includes('Anonymous') ? selectedLog.userName : 'System'}
                    </p>
                    <p className="text-xs text-gray-500">Performed by</p>
                  </div>
                </div>
                
                {/* Description */}
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-2 block">Description</label>
                  <p className="text-gray-900 bg-gray-50 rounded-lg p-3">{selectedLog.description}</p>
                </div>
                
                {/* Details */}
                {selectedLog.details && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 mb-2 block">Details</label>
                    <p className="text-gray-900 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">{selectedLog.details}</p>
                  </div>
                )}
                
                {/* Timestamps */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="text-center">
                    <p className="text-xs text-gray-500">
                      Log ID: {selectedLog.id}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Created: {new Date(selectedLog.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
