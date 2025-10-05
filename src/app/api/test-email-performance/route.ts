import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sendEmail } from '@/lib/email'
import { sendSimpleEmail } from '@/lib/email-simple'

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

    const results = {
      complex: { success: false, time: 0, error: null },
      simple: { success: false, time: 0, error: null }
    }

    // Test complex email template
    console.log('🧪 Testing complex email template...')
    const complexStart = Date.now()
    try {
      const complexResult = await sendEmail(to, 'MTS Complex Email Test', `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #3B82F6, #1E40AF); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">🧪 MTS Complex Email Test</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Testing complex HTML template performance</p>
          </div>
          <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e2e8f0;">
            <h2 style="color: #1e293b; margin: 0 0 20px 0;">Performance Test</h2>
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #3B82F6; margin-bottom: 20px;">
              <p style="margin: 0 0 10px 0;"><strong>Template Type:</strong> Complex HTML with inline CSS</p>
              <p style="margin: 0 0 10px 0;"><strong>Size:</strong> Large HTML template</p>
              <p style="margin: 0;"><strong>Status:</strong> <span style="background: #d1fae5; color: #065f46; padding: 4px 8px; border-radius: 4px; font-size: 12px;">TEST EMAIL</span></p>
            </div>
            <div style="background: #ecfdf5; border: 1px solid #a7f3d0; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #065f46; margin: 0 0 10px 0;">📋 What this tests:</h3>
              <ul style="color: #047857; margin: 0; padding-left: 20px;">
                <li>Complex HTML template processing time</li>
                <li>Large email size impact on SMTP</li>
                <li>Inline CSS rendering performance</li>
                <li>Email delivery speed with rich content</li>
              </ul>
            </div>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 14px;">
              <p>This is a performance test email from MTS (Menace to Society)</p>
              <p style="margin: 5px 0 0 0;">Sent at: ${new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>
      `)
      results.complex.success = complexResult.success
      results.complex.time = Date.now() - complexStart
      if (!complexResult.success) {
        results.complex.error = complexResult.error
      }
    } catch (error) {
      results.complex.time = Date.now() - complexStart
      results.complex.error = error instanceof Error ? error.message : 'Unknown error'
    }

    // Wait 2 seconds between tests
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Test simple email template
    console.log('🧪 Testing simple email template...')
    const simpleStart = Date.now()
    try {
      const simpleResult = await sendSimpleEmail(to, 'MTS Simple Email Test', `
        <h2>MTS Simple Email Test</h2>
        <p><strong>Template Type:</strong> Simple HTML</p>
        <p><strong>Size:</strong> Minimal HTML template</p>
        <p><strong>Status:</strong> TEST EMAIL</p>
        <p>This tests simple HTML template processing time and minimal email size impact on SMTP.</p>
        <p>This is a performance test email from MTS (Menace to Society)</p>
        <p>Sent at: ${new Date().toLocaleString()}</p>
      `)
      results.simple.success = simpleResult.success
      results.simple.time = Date.now() - simpleStart
      if (!simpleResult.success) {
        results.simple.error = simpleResult.error
      }
    } catch (error) {
      results.simple.time = Date.now() - simpleStart
      results.simple.error = error instanceof Error ? error.message : 'Unknown error'
    }

    return NextResponse.json({
      message: 'Email performance test completed',
      results,
      analysis: {
        complexTime: `${results.complex.time}ms`,
        simpleTime: `${results.simple.time}ms`,
        timeDifference: `${Math.abs(results.complex.time - results.simple.time)}ms`,
        fasterTemplate: results.complex.time < results.simple.time ? 'Complex' : 'Simple',
        performanceImpact: results.complex.time > results.simple.time * 2 ? 'Significant' : 'Minimal'
      }
    })
  } catch (error) {
    console.error('Error in email performance test:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
