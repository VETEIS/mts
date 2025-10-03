'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface ReportDetail {
  id: string
  reportCode: string
  status: string
  description: string
  locationAddress: string
  licensePlate?: string
  vehicleColor?: string
  vehicleModel?: string
  penaltyAmount: number
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string
    email: string
    role: string
  }
  offense: {
    id: string
    name: string
    description: string
    penaltyAmount: number
  }
  media: Array<{
    id: string
    type: string
    url: string
    createdAt: string
  }>
  adminNotes?: string
  rejectionReason?: string
}

interface ReportDetailModalProps {
  report: ReportDetail | null
  isOpen: boolean
  onClose: () => void
  onModerate: (reportId: string, action: 'approve' | 'reject', reason?: string, notes?: string) => Promise<void>
  onDelete?: (reportId: string) => void
}

export default function ReportDetailModal({ report, isOpen, onClose, onModerate, onDelete }: ReportDetailModalProps) {
  const [isModerating, setIsModerating] = useState(false)
  const [moderationAction, setModerationAction] = useState<'approve' | 'reject' | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [adminNotes, setAdminNotes] = useState('')

  // Debug media data
  useEffect(() => {
    if (report) {
      console.log('📸 Report media data:', report.media)
      console.log('📍 Report location data:', {
        address: report.locationAddress,
        lat: report.locationLat,
        lng: report.locationLng,
        accuracy: report.locationAccuracy
      })
      console.log('🚗 Report vehicle data:', {
        licensePlate: report.licensePlate,
        vehicleColor: report.vehicleColor,
        vehicleModel: report.vehicleModel
      })
    }
  }, [report])

  if (!report) return null

  const handleModerate = async () => {
    if (!moderationAction) return

    setIsModerating(true)
    try {
      await onModerate(
        report.id,
        moderationAction,
        moderationAction === 'reject' ? rejectionReason : undefined,
        adminNotes || undefined
      )
      onClose()
    } catch (error) {
      console.error('Moderation error:', error)
    } finally {
      setIsModerating(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      case 'SUBMITTED': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Report Details - {report.reportCode}</span>
            <Badge className={getStatusColor(report.status)}>
              {report.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Report Information */}
          <Card>
            <CardHeader>
              <CardTitle>📋 Report Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Report Code</label>
                  <p className="text-lg font-mono">{report.reportCode}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <Badge className={getStatusColor(report.status)}>
                    {report.status}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Created</label>
                  <p>{new Date(report.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Last Updated</label>
                  <p>{new Date(report.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reporter Information */}
          <Card>
            <CardHeader>
              <CardTitle>👤 Reporter Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Name</label>
                  <p className="font-medium">{report.user.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p className="font-medium">{report.user.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Role</label>
                  <Badge variant="outline">{report.user.role}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Violation Details */}
          <Card>
            <CardHeader>
              <CardTitle>🚨 Violation Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Offense</label>
                  <p className="font-medium">{report.offense.name}</p>
                  <p className="text-sm text-gray-600">{report.offense.description}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Penalty Amount</label>
                  <p className="text-lg font-bold text-red-600">₱{report.penaltyAmount.toLocaleString()}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Location</label>
                {report.locationAddress ? (
                  <p className="font-medium">{report.locationAddress}</p>
                ) : report.locationLat && report.locationLng ? (
                  <p className="font-medium text-gray-500">
                    📍 Coordinates: {report.locationLat.toFixed(6)}, {report.locationLng.toFixed(6)}
                    {report.locationAccuracy && (
                      <span className="text-sm text-gray-400 ml-2">
                        (Accuracy: ±{report.locationAccuracy}m)
                      </span>
                    )}
                  </p>
                ) : (
                  <p className="text-gray-500 italic">No location information provided</p>
                )}
              </div>

              {report.description && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Additional Details</label>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded">{report.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Vehicle Information */}
          {(report.licensePlate || report.vehicleColor || report.vehicleModel) && (
            <Card>
              <CardHeader>
                <CardTitle>🚗 Vehicle Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {report.licensePlate && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">License Plate</label>
                      <p className="font-mono text-lg font-bold">{report.licensePlate}</p>
                    </div>
                  )}
                  {report.vehicleColor && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Color</label>
                      <p className="font-medium">{report.vehicleColor}</p>
                    </div>
                  )}
                  {report.vehicleModel && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Model</label>
                      <p className="font-medium">{report.vehicleModel}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Evidence Media */}
          <Card>
            <CardHeader>
              <CardTitle>📸 Evidence Media ({report.media?.length || 0} items)</CardTitle>
            </CardHeader>
            <CardContent>
              {report.media && report.media.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {report.media.map((media) => (
                    <div key={media.id} className="border rounded-lg overflow-hidden">
                      <div className="p-2 bg-gray-50 border-b">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {media.type === 'IMAGE' ? '📸' : '🎥'} {media.type === 'IMAGE' ? 'Photo' : 'Video'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(media.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="p-2">
                        {media.type === 'IMAGE' ? (
                          <img 
                            src={media.url} 
                            alt="Evidence" 
                            className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-80"
                            onClick={() => window.open(media.url, '_blank')}
                          />
                        ) : (
                          <video 
                            src={media.url} 
                            className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-80"
                            controls
                            onClick={() => window.open(media.url, '_blank')}
                          />
                        )}
                        <div className="mt-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => window.open(media.url, '_blank')}
                            className="w-full"
                          >
                            View Full Size
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📷</div>
                  <p className="text-lg font-medium">No evidence media provided</p>
                  <p className="text-sm">This report was submitted without photos or videos.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Admin Notes */}
          {(report.adminNotes || report.rejectionReason) && (
            <Card>
              <CardHeader>
                <CardTitle>📝 Admin Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {report.adminNotes && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Notes</label>
                    <p className="text-gray-700 bg-blue-50 p-3 rounded">{report.adminNotes}</p>
                  </div>
                )}
                {report.rejectionReason && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Rejection Reason</label>
                    <p className="text-gray-700 bg-red-50 p-3 rounded">{report.rejectionReason}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Moderation Actions */}
          {report.status === 'SUBMITTED' && (
            <Card>
              <CardHeader>
                <CardTitle>⚖️ Moderation Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-4">
                  <Button
                    onClick={() => setModerationAction('approve')}
                    className={moderationAction === 'approve' ? 'bg-green-600' : 'bg-gray-200'}
                    variant={moderationAction === 'approve' ? 'default' : 'outline'}
                  >
                    ✅ Approve Report
                  </Button>
                  <Button
                    onClick={() => setModerationAction('reject')}
                    className={moderationAction === 'reject' ? 'bg-red-600' : 'bg-gray-200'}
                    variant={moderationAction === 'reject' ? 'default' : 'outline'}
                  >
                    ❌ Reject Report
                  </Button>
                </div>

                {moderationAction === 'reject' && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Rejection Reason *</label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Explain why this report is being rejected..."
                      className="w-full mt-1 p-3 border rounded-md"
                      rows={3}
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-600">Admin Notes (Optional)</label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add any additional notes about this report..."
                    className="w-full mt-1 p-3 border rounded-md"
                    rows={2}
                  />
                </div>

                {moderationAction && (
                  <div className="flex space-x-2">
                    <Button
                      onClick={handleModerate}
                      disabled={isModerating || (moderationAction === 'reject' && !rejectionReason.trim())}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isModerating ? 'Processing...' : `Submit ${moderationAction === 'approve' ? 'Approval' : 'Rejection'}`}
                    </Button>
                    <Button
                      onClick={() => {
                        setModerationAction(null)
                        setRejectionReason('')
                        setAdminNotes('')
                      }}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Development Delete Action */}
          {onDelete && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-800">🗑️ Development Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-red-700">
                    <strong>⚠️ Development Mode:</strong> This will permanently delete the report and all associated media.
                  </p>
                  <Button
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete report ${report.reportCode}? This action cannot be undone.`)) {
                        onDelete(report.id)
                      }
                    }}
                    variant="destructive"
                    className="w-full"
                  >
                    🗑️ Delete Report Permanently
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
