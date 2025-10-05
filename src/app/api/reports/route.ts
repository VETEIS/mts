import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendReportStatusNotification } from '@/lib/email'
import { z } from 'zod'

const createReportSchema = z.object({
  offenseId: z.string().min(1, 'Offense is required'),
  description: z.string().optional(),
  locationLat: z.number().optional(),
  locationLng: z.number().optional(),
  locationAccuracy: z.number().optional(),
  locationAddress: z.string().optional(),
  isAnonymous: z.boolean().optional().default(false),
  evidenceUrls: z.array(z.string().nullable()).optional().transform((urls) => 
    urls ? urls.filter((url): url is string => url !== null && url !== undefined) : []
  ),
})

// Generate unique report code (format: ABCD-1234)
function generateReportCode(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const numbers = '0123456789'
  
  let code = ''
  // 4 random letters
  for (let i = 0; i < 4; i++) {
    code += letters.charAt(Math.floor(Math.random() * letters.length))
  }
  code += '-'
  // 4 random numbers
  for (let i = 0; i < 4; i++) {
    code += numbers.charAt(Math.floor(Math.random() * numbers.length))
  }
  
  return code
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createReportSchema.parse(body)

    // Get user and offense details in parallel
    const [user, offense] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { gcashNumber: true, email: true, name: true }
      }),
      prisma.offense.findUnique({
        where: { id: validatedData.offenseId },
        select: { name: true, penaltyAmount: true, isActive: true }
      })
    ])

    if (!user?.gcashNumber) {
      return NextResponse.json({ 
        error: 'GCash number is required to submit reports. Please set up your GCash number in your profile first.' 
      }, { status: 400 })
    }

    if (!offense || !offense.isActive) {
      return NextResponse.json({ error: 'Invalid offense' }, { status: 400 })
    }

    // Generate unique report code (optimized)
    let reportCode = generateReportCode()
    const existingCodes = await prisma.report.findMany({
      where: { 
        reportCode: { in: [reportCode] }
      },
      select: { reportCode: true }
    })
    
    // Ensure code is unique (only check once)
    if (existingCodes.length > 0) {
      reportCode = generateReportCode()
    }

    // Calculate earnings (Reporter gets 5%, Developer gets 95%)
    const reporterEarnings = offense.penaltyAmount * 0.05
    const developerEarnings = offense.penaltyAmount * 0.95

    // Create report with media records
    const report = await prisma.report.create({
      data: {
        reportCode,
        userId: session.user.id,
        offenseId: validatedData.offenseId,
        description: validatedData.description,
        locationLat: validatedData.locationLat,
        locationLng: validatedData.locationLng,
        locationAccuracy: validatedData.locationAccuracy,
        locationAddress: validatedData.locationAddress,
        isAnonymous: validatedData.isAnonymous,
        penaltyAmount: offense.penaltyAmount,
        reporterEarnings,
        developerEarnings,
        // Create media records if evidence URLs are provided
        media: validatedData.evidenceUrls && validatedData.evidenceUrls.length > 0 ? {
          create: validatedData.evidenceUrls.map((url: string) => {
            const mediaType = url.includes('video') ? 'VIDEO' : 'IMAGE'
            return {
              type: mediaType,
              url: url,
              publicId: url.split('/').pop()?.split('.')[0] || `evidence-${Date.now()}`,
              filename: url.split('/').pop() || `evidence-${Date.now()}`,
            }
          })
        } : undefined,
      },
      include: {
        offense: {
          select: { name: true, penaltyAmount: true }
        },
        media: {
          select: { id: true, type: true, url: true, createdAt: true }
        }
      }
    })

    // Send email notification asynchronously (don't wait for it)
    if (user.email) {
      // Fire and forget - don't await the email
      sendReportStatusNotification(
        user.email,
        report.reportCode,
        'SUBMITTED',
        {
          offenseName: offense.name,
          penaltyAmount: offense.penaltyAmount
        }
      ).catch(error => {
        console.error('❌ Email notification failed (background):', error)
      })
    }

    return NextResponse.json(report, { status: 201 })
  } catch (error) {
    console.error('Error creating report:', error)
    
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

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')

    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {
      userId: session.user.id,
      ...(status && { status })
    }

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          offense: {
            select: { name: true }
          },
          media: {
            select: { id: true, type: true, url: true }
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
    console.error('Error fetching reports:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
