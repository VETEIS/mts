import nodemailer from 'nodemailer'
import { env } from './env'

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: env.MAIL_HOST,
    port: parseInt(env.MAIL_PORT),
    secure: false, // true for 465, false for other ports
    auth: {
      user: env.MAIL_USERNAME,
      pass: env.MAIL_PASSWORD,
    },
  })
}

// Email templates
export const emailTemplates = {
  reportSubmitted: (reportCode: string, offenseName: string, penaltyAmount: number) => ({
    subject: `Report #${reportCode} Submitted Successfully - MTS`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #3B82F6, #1E40AF); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">🚨 MTS Report Submitted</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Menace to Society - Traffic Violation Reporting</p>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e2e8f0;">
          <h2 style="color: #1e293b; margin: 0 0 20px 0;">Report Details</h2>
          
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #3B82F6; margin-bottom: 20px;">
            <p style="margin: 0 0 10px 0;"><strong>Report Code:</strong> <span style="font-family: monospace; background: #f1f5f9; padding: 4px 8px; border-radius: 4px;">#${reportCode}</span></p>
            <p style="margin: 0 0 10px 0;"><strong>Offense:</strong> ${offenseName}</p>
            <p style="margin: 0 0 10px 0;"><strong>Penalty Amount:</strong> <span style="color: #dc2626; font-weight: bold;">₱${penaltyAmount.toLocaleString()}</span></p>
            <p style="margin: 0;"><strong>Status:</strong> <span style="background: #fef3c7; color: #92400e; padding: 4px 8px; border-radius: 4px; font-size: 12px;">PENDING REVIEW</span></p>
          </div>
          
          <div style="background: #ecfdf5; border: 1px solid #a7f3d0; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #065f46; margin: 0 0 10px 0;">📋 What happens next?</h3>
            <ul style="color: #047857; margin: 0; padding-left: 20px;">
              <li>Your report is now under admin review</li>
              <li>We'll verify the evidence and location details</li>
              <li>You'll receive an email when the status changes</li>
              <li>If approved, you'll earn 5% of the penalty amount</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${env.APP_URL}/dashboard/reports" style="background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">View Your Reports</a>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 14px;">
            <p>Thank you for helping make Philippine roads safer! 🇵🇭</p>
            <p style="margin: 5px 0 0 0;">This is an automated message from MTS (Menace to Society)</p>
          </div>
        </div>
      </div>
    `
  }),

  reportApproved: (reportCode: string, offenseName: string, penaltyAmount: number, earnings: number) => ({
    subject: `🎉 Report #${reportCode} Approved - You Earned ₱${earnings.toLocaleString()}!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">🎉 Report Approved!</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Your report has been verified and approved</p>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e2e8f0;">
          <h2 style="color: #1e293b; margin: 0 0 20px 0;">Report Details</h2>
          
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #10B981; margin-bottom: 20px;">
            <p style="margin: 0 0 10px 0;"><strong>Report Code:</strong> <span style="font-family: monospace; background: #f1f5f9; padding: 4px 8px; border-radius: 4px;">#${reportCode}</span></p>
            <p style="margin: 0 0 10px 0;"><strong>Offense:</strong> ${offenseName}</p>
            <p style="margin: 0 0 10px 0;"><strong>Penalty Amount:</strong> <span style="color: #dc2626; font-weight: bold;">₱${penaltyAmount.toLocaleString()}</span></p>
            <p style="margin: 0;"><strong>Status:</strong> <span style="background: #d1fae5; color: #065f46; padding: 4px 8px; border-radius: 4px; font-size: 12px;">✅ APPROVED</span></p>
          </div>
          
          <div style="background: linear-gradient(135deg, #fef3c7, #fde68a); border: 1px solid #f59e0b; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
            <h3 style="color: #92400e; margin: 0 0 10px 0; font-size: 24px;">💰 Your Earnings</h3>
            <p style="color: #92400e; margin: 0; font-size: 32px; font-weight: bold;">₱${earnings.toLocaleString()}</p>
            <p style="color: #92400e; margin: 5px 0 0 0; font-size: 14px;">5% of the penalty amount</p>
          </div>
          
          <div style="background: #ecfdf5; border: 1px solid #a7f3d0; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #065f46; margin: 0 0 10px 0;">📋 What happens next?</h3>
            <ul style="color: #047857; margin: 0; padding-left: 20px;">
              <li>Your earnings will be added to your account</li>
              <li>You'll receive payment once the report is marked as paid</li>
              <li>Payment will be sent to your registered GCash account</li>
              <li>You'll receive another email when payment is processed</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${env.APP_URL}/dashboard/reports" style="background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">View Your Reports</a>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 14px;">
            <p>Thank you for helping make Philippine roads safer! 🇵🇭</p>
            <p style="margin: 5px 0 0 0;">This is an automated message from MTS (Menace to Society)</p>
          </div>
        </div>
      </div>
    `
  }),

  reportRejected: (reportCode: string, offenseName: string, rejectionReason: string) => ({
    subject: `❌ Report #${reportCode} Rejected - MTS`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #EF4444, #DC2626); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">❌ Report Rejected</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Your report could not be approved</p>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e2e8f0;">
          <h2 style="color: #1e293b; margin: 0 0 20px 0;">Report Details</h2>
          
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #EF4444; margin-bottom: 20px;">
            <p style="margin: 0 0 10px 0;"><strong>Report Code:</strong> <span style="font-family: monospace; background: #f1f5f9; padding: 4px 8px; border-radius: 4px;">#${reportCode}</span></p>
            <p style="margin: 0 0 10px 0;"><strong>Offense:</strong> ${offenseName}</p>
            <p style="margin: 0;"><strong>Status:</strong> <span style="background: #fee2e2; color: #dc2626; padding: 4px 8px; border-radius: 4px; font-size: 12px;">❌ REJECTED</span></p>
          </div>
          
          <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #dc2626; margin: 0 0 10px 0;">📋 Rejection Reason</h3>
            <p style="color: #991b1b; margin: 0; line-height: 1.5;">${rejectionReason}</p>
          </div>
          
          <div style="background: #f0f9ff; border: 1px solid #bae6fd; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #0369a1; margin: 0 0 10px 0;">💡 Tips for Better Reports</h3>
            <ul style="color: #0c4a6e; margin: 0; padding-left: 20px;">
              <li>Ensure clear, high-quality photos/videos</li>
              <li>Include license plate numbers when possible</li>
              <li>Provide accurate location information</li>
              <li>Submit reports promptly after witnessing violations</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${env.APP_URL}/dashboard/reports" style="background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">View Your Reports</a>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 14px;">
            <p>Thank you for helping make Philippine roads safer! 🇵🇭</p>
            <p style="margin: 5px 0 0 0;">This is an automated message from MTS (Menace to Society)</p>
          </div>
        </div>
      </div>
    `
  }),

  reportPaid: (reportCode: string, offenseName: string, earnings: number, paymentReceiptUrl?: string) => ({
    subject: `💰 Report #${reportCode} Payment Processed - ₱${earnings.toLocaleString()} Sent!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #8B5CF6, #7C3AED); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">💰 Payment Processed!</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Your earnings have been sent to your GCash account</p>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e2e8f0;">
          <h2 style="color: #1e293b; margin: 0 0 20px 0;">Payment Details</h2>
          
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #8B5CF6; margin-bottom: 20px;">
            <p style="margin: 0 0 10px 0;"><strong>Report Code:</strong> <span style="font-family: monospace; background: #f1f5f9; padding: 4px 8px; border-radius: 4px;">#${reportCode}</span></p>
            <p style="margin: 0 0 10px 0;"><strong>Offense:</strong> ${offenseName}</p>
            <p style="margin: 0 0 10px 0;"><strong>Status:</strong> <span style="background: #ddd6fe; color: #5b21b6; padding: 4px 8px; border-radius: 4px; font-size: 12px;">💰 PAID</span></p>
          </div>
          
          <div style="background: linear-gradient(135deg, #ddd6fe, #c4b5fd); border: 1px solid #8b5cf6; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
            <h3 style="color: #5b21b6; margin: 0 0 10px 0; font-size: 24px;">💰 Payment Amount</h3>
            <p style="color: #5b21b6; margin: 0; font-size: 32px; font-weight: bold;">₱${earnings.toLocaleString()}</p>
            <p style="color: #5b21b6; margin: 5px 0 0 0; font-size: 14px;">Sent to your GCash account</p>
          </div>
          
          ${paymentReceiptUrl ? `
          <div style="background: #f0f9ff; border: 1px solid #bae6fd; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #0369a1; margin: 0 0 10px 0;">📄 Payment Receipt</h3>
            <p style="color: #0c4a6e; margin: 0 0 10px 0;">Your payment has been processed with receipt verification.</p>
            <a href="${paymentReceiptUrl}" style="color: #0369a1; text-decoration: underline;">View Payment Receipt</a>
          </div>
          ` : ''}
          
          <div style="background: #ecfdf5; border: 1px solid #a7f3d0; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #065f46; margin: 0 0 10px 0;">✅ What's Next?</h3>
            <ul style="color: #047857; margin: 0; padding-left: 20px;">
              <li>Check your GCash account for the payment</li>
              <li>Your earnings have been successfully processed</li>
              <li>Continue reporting violations to earn more</li>
              <li>Thank you for making roads safer!</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${env.APP_URL}/dashboard/reports" style="background: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">View Your Reports</a>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 14px;">
            <p>Thank you for helping make Philippine roads safer! 🇵🇭</p>
            <p style="margin: 5px 0 0 0;">This is an automated message from MTS (Menace to Society)</p>
          </div>
        </div>
      </div>
    `
  })
}

// Send email function
export async function sendEmail(to: string, subject: string, html: string) {
  try {
    const transporter = createTransporter()
    
    const mailOptions = {
      from: `"${env.MAIL_FROM_NAME}" <${env.MAIL_FROM_ADDRESS}>`,
      to,
      subject,
      html,
    }
    
    const result = await transporter.sendMail(mailOptions)
    console.log('✅ Email sent successfully:', result.messageId)
    return { success: true, messageId: result.messageId }
  } catch (error) {
    console.error('❌ Error sending email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Send report status notification
export async function sendReportStatusNotification(
  userEmail: string,
  reportCode: string,
  status: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'PAID',
  reportData: {
    offenseName: string
    penaltyAmount: number
    earnings?: number
    rejectionReason?: string
    paymentReceiptUrl?: string
  }
) {
  let template
  
  switch (status) {
    case 'SUBMITTED':
      template = emailTemplates.reportSubmitted(reportCode, reportData.offenseName, reportData.penaltyAmount)
      break
    case 'APPROVED':
      template = emailTemplates.reportApproved(reportCode, reportData.offenseName, reportData.penaltyAmount, reportData.earnings || 0)
      break
    case 'REJECTED':
      template = emailTemplates.reportRejected(reportCode, reportData.offenseName, reportData.rejectionReason || 'No reason provided')
      break
    case 'PAID':
      template = emailTemplates.reportPaid(reportCode, reportData.offenseName, reportData.earnings || 0, reportData.paymentReceiptUrl)
      break
    default:
      throw new Error(`Unknown status: ${status}`)
  }
  
  return await sendEmail(userEmail, template.subject, template.html)
}
