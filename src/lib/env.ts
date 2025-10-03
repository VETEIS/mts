import fs from 'fs'
import path from 'path'

// Manual environment loader as fallback
function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local')
  
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local file not found at:', envPath)
    return {}
  }

  try {
    // Read as buffer first to handle encoding issues
    const buffer = fs.readFileSync(envPath)
    let envContent = buffer.toString('utf8')
    
    // If it looks like UTF-16, try to convert it
    if (envContent.includes('\x00')) {
      console.log('⚠️  Detected UTF-16 encoding, attempting conversion...')
      envContent = buffer.toString('utf16le').replace(/\x00/g, '')
    }
    
    const envVars: Record<string, string> = {}
    
    envContent.split('\n').forEach((line, index) => {
      const trimmed = line.trim()
      console.log(`📝 Line ${index + 1}: "${trimmed}"`)
      
      if (trimmed && !trimmed.startsWith('#')) {
        const equalIndex = trimmed.indexOf('=')
        if (equalIndex > 0) {
          const key = trimmed.substring(0, equalIndex).trim()
          let value = trimmed.substring(equalIndex + 1).trim()
          
          // Remove quotes if present
          value = value.replace(/^["']|["']$/g, '')
          
          // Handle special characters and ensure no extra processing
          const cleanValue = value
          
          console.log(`🔑 Found: ${key} = ${key.includes('SECRET') || key.includes('CLIENT_SECRET') ? '[HIDDEN]' : cleanValue}`)
          console.log(`📏 Value length: ${cleanValue.length}`)
          
          envVars[key] = cleanValue
          // Set in process.env if not already set
          if (!process.env[key]) {
            process.env[key] = cleanValue
            console.log(`✅ Set process.env.${key}`)
          } else {
            console.log(`ℹ️  process.env.${key} already exists`)
          }
        } else {
          console.log(`⚠️  Invalid line format: ${trimmed}`)
        }
      }
    })
    
    console.log('✅ Loaded environment variables:', Object.keys(envVars))
    return envVars
  } catch (error) {
    console.error('❌ Error reading .env.local:', error)
    return {}
  }
}

// Load environment variables
const envVars = loadEnvFile()

// Export environment variables with fallbacks
export const env = {
  DATABASE_URL: process.env.DATABASE_URL || envVars.DATABASE_URL || 'file:./dev.db',
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || envVars.NEXTAUTH_URL || 'http://localhost:3000',
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || envVars.NEXTAUTH_SECRET || 'fallback-secret',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || envVars.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || envVars.GOOGLE_CLIENT_SECRET || '',
  CLOUDINARY_URL: process.env.CLOUDINARY_URL || envVars.CLOUDINARY_URL || '',
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || envVars.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '',
  OPENCAGE_API_KEY: process.env.OPENCAGE_API_KEY || envVars.OPENCAGE_API_KEY || '',
  APP_NAME: process.env.APP_NAME || envVars.APP_NAME || 'MTS',
  APP_URL: process.env.APP_URL || envVars.APP_URL || 'http://localhost:3000',
}

// Validation
export function validateEnv() {
  const required = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'NEXTAUTH_SECRET']
  const missing = required.filter(key => !env[key as keyof typeof env])
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing)
    return false
  }
  
  console.log('✅ All required environment variables are present')
  return true
}

// Debug function
export function debugEnv() {
  console.log('🔍 Environment Debug Info:')
  console.log('- Current working directory:', process.cwd())
  console.log('- .env.local path:', path.join(process.cwd(), '.env.local'))
  console.log('- .env.local exists:', fs.existsSync(path.join(process.cwd(), '.env.local')))
  console.log('- NODE_ENV:', process.env.NODE_ENV)
  console.log('- Environment variables loaded:', Object.keys(envVars))
  
  // Special debug for Google credentials
  console.log('🔍 Google Credentials Debug:')
  console.log('- GOOGLE_CLIENT_ID from process.env:', !!process.env.GOOGLE_CLIENT_ID)
  console.log('- GOOGLE_CLIENT_ID from env object:', !!env.GOOGLE_CLIENT_ID)
  console.log('- GOOGLE_CLIENT_ID length:', env.GOOGLE_CLIENT_ID?.length || 0)
  console.log('- GOOGLE_CLIENT_SECRET from process.env:', !!process.env.GOOGLE_CLIENT_SECRET)
  console.log('- GOOGLE_CLIENT_SECRET from env object:', !!env.GOOGLE_CLIENT_SECRET)
  console.log('- GOOGLE_CLIENT_SECRET length:', env.GOOGLE_CLIENT_SECRET?.length || 0)
  
  Object.entries(env).forEach(([key, value]) => {
    if (key.includes('SECRET') || key.includes('CLIENT_SECRET')) {
      console.log(`- ${key}: ${value ? `[SET - ${value.length} chars]` : '[MISSING]'}`)
    } else {
      console.log(`- ${key}: ${value || '[MISSING]'}`)
    }
  })
}
