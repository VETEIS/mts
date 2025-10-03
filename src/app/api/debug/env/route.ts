import { NextResponse } from 'next/server'
import { env, debugEnv } from '@/lib/env'

export async function GET() {
  // Run debug on each request
  debugEnv()
  
  return NextResponse.json({
    hasGoogleClientId: !!env.GOOGLE_CLIENT_ID,
    hasGoogleClientSecret: !!env.GOOGLE_CLIENT_SECRET,
    hasNextAuthUrl: !!env.NEXTAUTH_URL,
    hasNextAuthSecret: !!env.NEXTAUTH_SECRET,
    googleClientIdLength: env.GOOGLE_CLIENT_ID?.length || 0,
    nextAuthUrl: env.NEXTAUTH_URL,
    googleClientIdPreview: env.GOOGLE_CLIENT_ID ? `${env.GOOGLE_CLIENT_ID.substring(0, 10)}...` : 'MISSING',
    envFileExists: true, // We'll know from the debug logs
    // Don't expose actual secrets, just check if they exist
  })
}
