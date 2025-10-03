import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { v2 as cloudinary } from 'cloudinary'
import { env } from '@/lib/env'

// Configure Cloudinary
console.log('🔧 Cloudinary config check:', {
  cloudName: env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  hasApiKey: !!process.env.CLOUDINARY_API_KEY,
  hasApiSecret: !!process.env.CLOUDINARY_API_SECRET,
  hasCloudinaryUrl: !!process.env.CLOUDINARY_URL
})

// Use CLOUDINARY_URL if available, otherwise use separate credentials
if (process.env.CLOUDINARY_URL) {
  console.log('✅ Using CLOUDINARY_URL for configuration')
  cloudinary.config({
    secure: true
  })
} else {
  console.log('⚠️ Using separate credentials for configuration')
  cloudinary.config({
    cloud_name: env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })
}

// Security: Allowed file types for evidence
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'video/webm', 'video/mp4']
const MAX_IMAGE_SIZE = 25 * 1024 * 1024 // 25MB for images
const MAX_VIDEO_SIZE = 50 * 1024 * 1024 // 50MB for videos

// Security: File signature validation (magic numbers)
const FILE_SIGNATURES = {
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/png': [0x89, 0x50, 0x4E, 0x47],
  'video/webm': [0x1A, 0x45, 0xDF, 0xA3],
  'video/mp4': [0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70] // MP4 signature
}

// Security: Validate file signature to prevent file type spoofing
function validateFileSignature(buffer: Buffer, expectedType: string): boolean {
  const signature = FILE_SIGNATURES[expectedType as keyof typeof FILE_SIGNATURES]
  if (!signature) return false
  
  for (let i = 0; i < signature.length; i++) {
    if (buffer[i] !== signature[i]) {
      return false
    }
  }
  return true
}

export async function POST(request: NextRequest) {
  try {
    console.log('📤 Upload API called')
    
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

    // Security validation
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only JPEG, PNG images and WebM/MP4 videos are allowed.' 
      }, { status: 400 })
    }

    // Check file size based on type
    const isVideo = file.type.startsWith('video/')
    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE
    const maxSizeMB = isVideo ? 50 : 25
    
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: `File too large. Maximum size is ${maxSizeMB}MB for ${isVideo ? 'videos' : 'images'}.` 
      }, { status: 400 })
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Security: Validate file signature to prevent file type spoofing
    if (!validateFileSignature(buffer, file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file format. File signature does not match declared type.' 
      }, { status: 400 })
    }

    // Determine resource type based on file type
    const resourceType = isVideo ? 'video' : 'image'
    
    // Check if Cloudinary is properly configured
    const hasCloudinaryUrl = !!process.env.CLOUDINARY_URL
    const hasSeparateCredentials = !!(env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
    
    if (!hasCloudinaryUrl && !hasSeparateCredentials) {
      console.error('❌ Cloudinary not configured properly')
      console.error('Missing:', {
        cloudinaryUrl: !hasCloudinaryUrl,
        cloudName: !env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
        apiKey: !process.env.CLOUDINARY_API_KEY,
        apiSecret: !process.env.CLOUDINARY_API_SECRET
      })
      return NextResponse.json({ 
        error: 'Upload service not configured. Please contact administrator.' 
      }, { status: 500 })
    }

    // Upload to Cloudinary with security settings
    console.log('☁️ Starting Cloudinary upload:', {
      resourceType,
      isVideo,
      bufferSize: buffer.length,
      cloudName: env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    })

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'mts-evidence',
          public_id: `evidence-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          resource_type: resourceType,
          quality: 'auto',
          fetch_format: 'auto',
          // Security: Disable transformations that could be used to hide evidence
          allowed_formats: isVideo ? ['webm', 'mp4'] : ['jpg', 'jpeg', 'png'],
          // Video-specific settings
          ...(isVideo && {
            video_codec: 'auto',
            audio_codec: 'auto',
            format: 'mp4' // Convert to MP4 for better compatibility
          }),
          // Add metadata for tracking
          context: {
            user_id: session.user.id,
            upload_source: 'camera_capture',
            media_type: isVideo ? 'video' : 'image',
            timestamp: new Date().toISOString()
          }
        },
        (error, result) => {
          if (error) {
            console.error('❌ Cloudinary upload error:', error)
            reject(error)
          } else {
            console.log('✅ Cloudinary upload successful:', result)
            resolve(result)
          }
        }
      ).end(buffer)
    })

    const response = NextResponse.json({
      success: true,
      url: (result as { secure_url: string }).secure_url,
      publicId: (result as { public_id: string }).public_id,
      width: (result as { width: number }).width,
      height: (result as { height: number }).height,
      bytes: (result as { bytes: number }).bytes
    })

    // Security headers
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    
    return response

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Upload failed. Please try again.' },
      { status: 500 }
    )
  }
}
