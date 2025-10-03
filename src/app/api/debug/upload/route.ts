import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { env } from '@/lib/env'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    return NextResponse.json({
      session: {
        hasSession: !!session,
        userId: session?.user?.id,
        userEmail: session?.user?.email
      },
      cloudinary: {
        cloudName: env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
        hasApiKey: !!process.env.CLOUDINARY_API_KEY,
        hasApiSecret: !!process.env.CLOUDINARY_API_SECRET,
        hasCloudinaryUrl: !!process.env.CLOUDINARY_URL
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        vercelUrl: process.env.VERCEL_URL
      }
    })
  } catch (error) {
    console.error('Debug upload error:', error)
    return NextResponse.json({ error: 'Debug failed' }, { status: 500 })
  }
}
