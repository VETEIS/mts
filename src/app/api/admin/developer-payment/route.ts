import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const developerPaymentSchema = z.object({
  amount: z.number().min(0),
  receiptUrl: z.string().min(1, 'Receipt URL is required'),
  receiptId: z.string().min(1, 'Receipt ID is required')
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = developerPaymentSchema.parse(body)

    // Create developer payment record
    const payment = await prisma.developerPayment.create({
      data: {
        amount: validatedData.amount,
        receiptUrl: validatedData.receiptUrl,
        receiptId: validatedData.receiptId,
        sentBy: session.user.id,
        status: 'PENDING_CONFIRMATION',
        sentAt: new Date()
      }
    })

    // Log the developer payment action
    await prisma.systemLog.create({
      data: {
        action: 'Developer Payment Sent',
        description: `Monthly developer payment of ₱${validatedData.amount.toLocaleString()} sent`,
        details: `Amount: ₱${validatedData.amount.toLocaleString()}, Receipt: ${validatedData.receiptUrl}, Status: Pending Developer Confirmation`,
        userId: session.user.id
      }
    })

    return NextResponse.json({
      message: 'Developer payment recorded successfully',
      payment: {
        id: payment.id,
        amount: payment.amount,
        status: payment.status,
        sentAt: payment.sentAt
      }
    })
  } catch (error) {
    console.error('Error processing developer payment:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
