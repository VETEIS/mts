import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { env } from '@/lib/env'
import { sendEmail } from '@/lib/email'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check email configuration
    const emailConfig = {
      MAIL_HOST: env.MAIL_HOST,
      MAIL_PORT: env.MAIL_PORT,
      MAIL_USERNAME: env.MAIL_USERNAME,
      MAIL_FROM_ADDRESS: env.MAIL_FROM_ADDRESS,
      MAIL_FROM_NAME: env.MAIL_FROM_NAME,
      hasPassword: !!env.MAIL_PASSWORD,
      passwordLength: env.MAIL_PASSWORD?.length || 0,
      // Check if credentials are properly set
      credentialsValid: !!(env.MAIL_USERNAME && env.MAIL_PASSWORD && env.MAIL_HOST),
      // Show first few characters of password for debugging (be careful in production)
      passwordPreview: env.MAIL_PASSWORD ? env.MAIL_PASSWORD.substring(0, 4) + '...' : 'NOT SET'
    }

    return NextResponse.json({
      message: 'Email configuration debug',
      config: emailConfig,
      appUrl: env.APP_URL
    })
  } catch (error) {
    console.error('Error in email debug:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { to } = body

    if (!to) {
      return NextResponse.json({ 
        error: 'Email address is required' 
      }, { status: 400 })
    }

    // Send a simple test email
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #3B82F6, #1E40AF); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">🧪 MTS Email Debug Test</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Testing email functionality</p>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e2e8f0;">
          <h2 style="color: #1e293b; margin: 0 0 20px 0;">Debug Information</h2>
          
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #3B82F6;">
            <p style="margin: 0 0 10px 0;"><strong>Test Time:</strong> ${new Date().toLocaleString()}</p>
            <p style="margin: 0 0 10px 0;"><strong>From:</strong> ${env.MAIL_FROM_ADDRESS}</p>
            <p style="margin: 0 0 10px 0;"><strong>Host:</strong> ${env.MAIL_HOST}</p>
            <p style="margin: 0 0 10px 0;"><strong>Port:</strong> ${env.MAIL_PORT}</p>
            <p style="margin: 0;"><strong>Status:</strong> <span style="background: #d1fae5; color: #065f46; padding: 4px 8px; border-radius: 4px; font-size: 12px;">✅ EMAIL SENT</span></p>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 14px;">
            <p>This is a debug email from MTS (Menace to Society)</p>
            <p style="margin: 5px 0 0 0;">If you received this, email is working correctly!</p>
          </div>
        </div>
      </div>
    `

    // Test SMTP connection first
    try {
      const nodemailer = require('nodemailer')
      const transporter = nodemailer.createTransport({
        host: env.MAIL_HOST,
        port: parseInt(env.MAIL_PORT),
        secure: false,
        auth: {
          user: env.MAIL_USERNAME,
          pass: env.MAIL_PASSWORD,
        },
      })
      
      // Verify connection
      await transporter.verify()
      console.log('✅ SMTP connection verified')
      
      const result = await sendEmail(to, 'MTS Email Debug Test', html)
      
      return NextResponse.json({
        message: 'Debug email sent',
        result,
        smtpVerified: true
      })
    } catch (smtpError) {
      console.error('❌ SMTP verification failed:', smtpError)
      return NextResponse.json({
        message: 'SMTP verification failed',
        error: smtpError instanceof Error ? smtpError.message : 'Unknown SMTP error',
        smtpVerified: false
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Error sending debug email:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
