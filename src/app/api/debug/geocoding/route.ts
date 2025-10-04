import { NextResponse } from 'next/server'
import { env } from '@/lib/env'

export async function GET() {
  try {
    return NextResponse.json({
      hasApiKey: !!env.OPENCAGE_API_KEY,
      apiKeyLength: env.OPENCAGE_API_KEY?.length || 0,
      apiKeyPrefix: env.OPENCAGE_API_KEY?.substring(0, 8) || 'N/A',
      environment: process.env.NODE_ENV,
      nextAuthUrl: env.NEXTAUTH_URL
    })
  } catch (error) {
    return NextResponse.json({ error: 'Debug failed' }, { status: 500 })
  }
}