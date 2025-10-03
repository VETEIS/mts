import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, name: true, role: true, isActive: true }
    })

    return NextResponse.json({
      session: {
        user: session.user
      },
      database: dbUser,
      isAdmin: session.user.role === 'ADMIN',
      shouldBeAdmin: session.user.email === 'vescoton0@gmail.com',
      middlewareWouldSee: {
        email: session.user.email,
        isAdminByEmail: session.user.email === 'vescoton0@gmail.com'
      }
    })
  } catch (error) {
    console.error('Error fetching user debug info:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
