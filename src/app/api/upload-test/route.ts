import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { env } from '@/lib/env'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Test upload API called')
    
    const session = await getServerSession(authOptions)
    console.log('🔐 Session check:', { hasSession: !!session, userId: session?.user?.id })
    
    if (!session?.user?.id) {
      console.log('❌ Unauthorized - no session or user ID')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    console.log('📁 File received:', { 
      hasFile: !!file, 
      fileName: file?.name, 
      fileSize: file?.size, 
      fileType: file?.type 
    })

    if (!file) {
      console.log('❌ No file provided')
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Check Cloudinary configuration
    const cloudinaryConfig = {
      cloudName: env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      hasApiKey: !!process.env.CLOUDINARY_API_KEY,
      hasApiSecret: !!process.env.CLOUDINARY_API_SECRET,
      hasCloudinaryUrl: !!process.env.CLOUDINARY_URL
    }
    
    console.log('☁️ Cloudinary config:', cloudinaryConfig)

    // For now, return a mock response to test the flow
    const mockUrl = `https://example.com/mock-upload-${Date.now()}.${file.type.includes('video') ? 'mp4' : 'jpg'}`
    
    return NextResponse.json({
      success: true,
      url: mockUrl,
      publicId: `mock-${Date.now()}`,
      width: 1920,
      height: 1080,
      bytes: file.size,
      mock: true,
      cloudinaryConfig
    })

  } catch (error) {
    console.error('Test upload error:', error)
    return NextResponse.json(
      { error: 'Test upload failed. Please try again.' },
      { status: 500 }
    )
  }
}
