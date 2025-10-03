import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const offenses = await prisma.offense.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        penaltyAmount: true
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(offenses)
  } catch (error) {
    console.error('Error fetching offenses:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
