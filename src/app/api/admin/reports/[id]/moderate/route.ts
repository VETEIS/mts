import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const moderateSchema = z.object({
  action: z.enum(['approve', 'reject']),
  rejectionReason: z.string().optional(),
  adminNotes: z.string().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = moderateSchema.parse(body)
    const reportId = params.id

    // Validate rejection reason if rejecting
    if (validatedData.action === 'reject' && !validatedData.rejectionReason?.trim()) {
      return NextResponse.json(
        { error: 'Rejection reason is required when rejecting a report' },
        { status: 400 }
      )
    }

    // Get the report to check current status
    const existingReport = await prisma.report.findUnique({
      where: { id: reportId },
      select: { status: true, penaltyAmount: true }
    })

    if (!existingReport) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    if (existingReport.status !== 'SUBMITTED') {
      return NextResponse.json(
        { error: 'Report has already been moderated' },
        { status: 400 }
      )
    }

    // Update report status
    const newStatus = validatedData.action === 'approve' ? 'APPROVED' : 'REJECTED'
    
    const updatedReport = await prisma.report.update({
      where: { id: reportId },
      data: {
        status: newStatus,
        rejectionReason: validatedData.rejectionReason,
        adminNotes: validatedData.adminNotes,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: { name: true, email: true }
        },
        offense: {
          select: { name: true }
        }
      }
    })

    // TODO: Send notification to user about the decision
    // This could be email, in-app notification, etc.

    return NextResponse.json({
      message: `Report ${validatedData.action}d successfully`,
      report: updatedReport
    })
  } catch (error) {
    console.error('Error moderating report:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
