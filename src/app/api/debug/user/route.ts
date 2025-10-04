import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user details from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        id: true, 
        name: true, 
        email: true, 
        gcashNumber: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      message: 'User debug information',
      session: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role
      },
      database: user
    })
  } catch (error) {
    console.error('Error in user debug:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    if (action === 'fix-email') {
      // Update user email from session if it's missing in database
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { email: true }
      })

      if (!user?.email && session.user.email) {
        await prisma.user.update({
          where: { id: session.user.id },
          data: { email: session.user.email }
        })

        return NextResponse.json({
          message: 'User email updated successfully',
          email: session.user.email
        })
      } else {
        return NextResponse.json({
          message: 'User email already exists or no email in session',
          currentEmail: user?.email,
          sessionEmail: session.user.email
        })
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error in user debug POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}