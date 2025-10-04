import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createLogSchema = z.object({
  action: z.string(),
  description: z.string(),
  details: z.string().optional()
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get system logs from the database
    const logs = await prisma.systemLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50, // Limit to last 50 logs
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    })

    return NextResponse.json({ logs })
  } catch (error) {
    console.error('Error fetching system logs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createLogSchema.parse(body)

    // Create new system log entry
    const log = await prisma.systemLog.create({
      data: {
        action: validatedData.action,
        description: validatedData.description,
        details: validatedData.details,
        userId: session.user.id
      },
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    })

    return NextResponse.json({ log })
  } catch (error) {
    console.error('Error creating system log:', error)
    
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
