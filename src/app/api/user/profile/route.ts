import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateProfileSchema = z.object({
  gcashNumber: z.string().min(1, 'GCash number is required'),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        gcashNumber: true,
        gcashQr: true,
        createdAt: true,
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateProfileSchema.parse(body)

    // Validate GCash number format
    const gcashRegex = /^(\+63|0)?9\d{9}$/
    const cleanNumber = validatedData.gcashNumber.replace(/\s/g, '')
    
    if (!gcashRegex.test(cleanNumber)) {
      return NextResponse.json({ 
        error: 'Invalid GCash number format. Please use a valid Philippine mobile number.' 
      }, { status: 400 })
    }

    // Normalize the number
    const normalizedNumber = cleanNumber.startsWith('+63') 
      ? cleanNumber 
      : cleanNumber.startsWith('0') 
        ? '+63' + cleanNumber.substring(1)
        : '+63' + cleanNumber

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        gcashNumber: normalizedNumber,
      },
      select: {
        id: true,
        name: true,
        email: true,
        gcashNumber: true,
      }
    })

    return NextResponse.json({ 
      message: 'Profile updated successfully',
      user 
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: error.issues[0].message 
      }, { status: 400 })
    }
    
    console.error('Error updating user profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
