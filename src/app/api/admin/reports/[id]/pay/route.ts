import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const markAsPaidSchema = z.object({
  paymentReceiptUrl: z.string().min(1, 'Payment receipt is required'),
  paymentReceiptId: z.string().min(1, 'Payment receipt ID is required'),
  paymentNotes: z.string().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = markAsPaidSchema.parse(body)

    // Get the report
    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true, gcashNumber: true }
        }
      }
    })

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    // Check if report is approved
    if (report.status !== 'APPROVED') {
      return NextResponse.json({ 
        error: 'Only approved reports can be marked as paid' 
      }, { status: 400 })
    }

    // Check if reporter has GCash number
    if (!report.user.gcashNumber) {
      return NextResponse.json({ 
        error: 'Reporter has not set up their GCash number' 
      }, { status: 400 })
    }

    // Calculate earnings (only when marking as paid)
    const reporterEarnings = report.penaltyAmount * 0.05 // 5% for reporter
    const systemEarnings = report.penaltyAmount * 0.93 // 93% for system
    const developerEarnings = report.penaltyAmount * 0.02 // 2% for developer

    // Update report status to PAID with receipt and earnings
    const updatedReport = await prisma.report.update({
      where: { id },
      data: {
        status: 'PAID',
        reporterPaymentStatus: 'COMPLETED',
        developerPaymentStatus: 'COMPLETED',
        reporterEarnings: reporterEarnings,
        developerEarnings: developerEarnings,
        paymentReceiptUrl: validatedData.paymentReceiptUrl,
        paymentReceiptId: validatedData.paymentReceiptId,
        paymentSentAt: new Date(),
        paymentSentBy: session.user.email,
        adminNotes: report.adminNotes 
          ? `${report.adminNotes}\n\n[PAYMENT] Marked as paid on ${new Date().toLocaleString()}${validatedData.paymentNotes ? `\nPayment Notes: ${validatedData.paymentNotes}` : ''}` 
          : `[PAYMENT] Marked as paid on ${new Date().toLocaleString()}${validatedData.paymentNotes ? `\nPayment Notes: ${validatedData.paymentNotes}` : ''}`
      },
      include: {
        user: {
          select: { name: true, gcashNumber: true }
        },
        offense: {
          select: { name: true }
        }
      }
    })

    // Log the payment action
    const reporterName = updatedReport.isAnonymous ? 'Anonymous Reporter' : updatedReport.user.name
    const gcashInfo = updatedReport.isAnonymous ? 'Hidden (Anonymous)' : updatedReport.user.gcashNumber
    await prisma.systemLog.create({
      data: {
        action: 'Report Marked as Paid',
        description: `Report #${updatedReport.reportCode} marked as paid with receipt`,
        details: `Reporter: ${reporterName}, GCash: ${gcashInfo}, Reporter Earnings: ₱${reporterEarnings.toLocaleString()}, System Earnings: ₱${systemEarnings.toLocaleString()}, Developer Earnings: ₱${developerEarnings.toLocaleString()}, Offense: ${updatedReport.offense.name}${validatedData.paymentNotes ? `, Notes: ${validatedData.paymentNotes}` : ''}`,
        userId: session.user.id
      }
    })

    console.log('💰 Report marked as paid with receipt:', {
      reportId: id,
      reportCode: updatedReport.reportCode,
      reporterName: updatedReport.user.name,
      gcashNumber: updatedReport.user.gcashNumber,
      earnings: updatedReport.reporterEarnings,
      offense: updatedReport.offense.name,
      receiptUrl: updatedReport.paymentReceiptUrl,
      sentBy: updatedReport.paymentSentBy,
      sentAt: updatedReport.paymentSentAt
    })

    return NextResponse.json({
      message: 'Report marked as paid successfully',
      report: {
        id: updatedReport.id,
        reportCode: updatedReport.reportCode,
        status: updatedReport.status,
        reporterEarnings: updatedReport.reporterEarnings,
        reporterGcash: updatedReport.user.gcashNumber
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: error.issues[0].message 
      }, { status: 400 })
    }
    
    console.error('Error marking report as paid:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
