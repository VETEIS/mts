import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.email !== 'vescoton0@gmail.com') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get report statistics
    const [
      totalReports,
      pendingReports,
      approvedReports,
      rejectedReports,
      totalUsers,
      totalRevenue,
      developerEarnings
    ] = await Promise.all([
      prisma.report.count(),
      prisma.report.count({ where: { status: 'SUBMITTED' } }),
      prisma.report.count({ where: { status: 'APPROVED' } }),
      prisma.report.count({ where: { status: 'REJECTED' } }),
      prisma.user.count(),
      prisma.report.aggregate({
        where: { status: 'PAID' },
        _sum: { penaltyAmount: true }
      }),
      prisma.report.aggregate({
        where: { status: 'PAID' },
        _sum: { developerEarnings: true }
      })
    ])

    // Get pending payments count
    const pendingPayments = await prisma.report.count({
      where: {
        status: 'APPROVED',
        OR: [
          { reporterPaymentStatus: 'PENDING' },
          { developerPaymentStatus: 'PENDING' }
        ]
      }
    })

    return NextResponse.json({
      totalReports,
      pendingReports,
      approvedReports,
      rejectedReports,
      totalUsers,
      totalRevenue: (totalRevenue._sum.penaltyAmount || 0) * 0.93, // 93% system cut
      developerEarnings: developerEarnings._sum.developerEarnings || 0,
      pendingPayments
    })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
