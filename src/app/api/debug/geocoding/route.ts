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
      opencage: {
        hasApiKey: !!env.OPENCAGE_API_KEY,
        apiKeyLength: env.OPENCAGE_API_KEY?.length || 0
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        vercelUrl: process.env.VERCEL_URL
      }
    })
  } catch (error) {
    console.error('Debug geocoding error:', error)
    return NextResponse.json({ error: 'Debug failed' }, { status: 500 })
  }
}
