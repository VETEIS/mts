import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const skip = (page - 1) * limit

    // Build where clause
    const where: Record<string, unknown> = {}
    if (status && status !== 'ALL') {
      where.status = status
    }

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        select: {
          id: true,
          reportCode: true,
          status: true,
          description: true,
          locationLat: true,
          locationLng: true,
          locationAccuracy: true,
          locationAddress: true,
          licensePlate: true,
          vehicleColor: true,
          vehicleModel: true,
          penaltyAmount: true,
          reporterEarnings: true,
          developerEarnings: true,
          reporterPaymentStatus: true,
          developerPaymentStatus: true,
          rejectionReason: true,
          adminNotes: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: { id: true, name: true, email: true, role: true }
          },
          offense: {
            select: { id: true, name: true, description: true, penaltyAmount: true }
          },
          media: {
            select: { id: true, type: true, url: true, createdAt: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.report.count({ where })
    ])

    return NextResponse.json({
      reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching admin reports:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
