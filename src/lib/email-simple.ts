import nodemailer from 'nodemailer'
import { env } from './env'

// Create email transporter
const createTransporter = () => {
  if (!env.MAIL_USERNAME || !env.MAIL_PASSWORD) {
    throw new Error('Email credentials are missing. Please check MAIL_USERNAME and MAIL_PASSWORD environment variables.')
  }

  return nodemailer.createTransport({
    host: env.MAIL_HOST,
    port: parseInt(env.MAIL_PORT),
    secure: false, // true for 465, false for other ports
    auth: {
      user: env.MAIL_USERNAME,
      pass: env.MAIL_PASSWORD,
    },
    // Minimal timeout settings for faster processing
    connectionTimeout: 5000, // 5 seconds
    greetingTimeout: 3000,  // 3 seconds
    socketTimeout: 5000,   // 5 seconds
  })
}

// Simple email templates for faster processing
export const simpleEmailTemplates = {
  reportSubmitted: (reportCode: string, offenseName: string, penaltyAmount: number) => ({
    subject: `Report #${reportCode} Submitted Successfully - MTS`,
    html: `
      <h2>MTS Report Submitted</h2>
      <p><strong>Report Code:</strong> #${reportCode}</p>
      <p><strong>Offense:</strong> ${offenseName}</p>
      <p><strong>Penalty Amount:</strong> ₱${penaltyAmount.toLocaleString()}</p>
      <p><strong>Status:</strong> PENDING REVIEW</p>
      <p>Your report is now under admin review. You'll receive an email when the status changes.</p>
      <p>If approved, you'll earn 5% of the penalty amount.</p>
      <p>Thank you for helping make Philippine roads safer! 🇵🇭</p>
    `
  }),

  reportApproved: (reportCode: string, offenseName: string, penaltyAmount: number, earnings: number) => ({
    subject: `Report #${reportCode} Approved - You Earned ₱${earnings.toLocaleString()}!`,
    html: `
      <h2>Report Approved!</h2>
      <p><strong>Report Code:</strong> #${reportCode}</p>
      <p><strong>Offense:</strong> ${offenseName}</p>
      <p><strong>Penalty Amount:</strong> ₱${penaltyAmount.toLocaleString()}</p>
      <p><strong>Your Earnings:</strong> ₱${earnings.toLocaleString()}</p>
      <p>Your earnings will be added to your account. You'll receive payment once the report is marked as paid.</p>
      <p>Thank you for helping make Philippine roads safer! 🇵🇭</p>
    `
  }),

  reportRejected: (reportCode: string, offenseName: string, rejectionReason: string) => ({
    subject: `Report #${reportCode} Rejected - MTS`,
    html: `
      <h2>Report Rejected</h2>
      <p><strong>Report Code:</strong> #${reportCode}</p>
      <p><strong>Offense:</strong> ${offenseName}</p>
      <p><strong>Rejection Reason:</strong> ${rejectionReason}</p>
      <p>Please ensure clear, high-quality photos/videos and accurate location information for better reports.</p>
      <p>Thank you for helping make Philippine roads safer! 🇵🇭</p>
    `
  }),

  reportPaid: (reportCode: string, offenseName: string, earnings: number) => ({
    subject: `Report #${reportCode} Payment Processed - ₱${earnings.toLocaleString()} Sent!`,
    html: `
      <h2>Payment Processed!</h2>
      <p><strong>Report Code:</strong> #${reportCode}</p>
      <p><strong>Offense:</strong> ${offenseName}</p>
      <p><strong>Payment Amount:</strong> ₱${earnings.toLocaleString()}</p>
      <p>Your earnings have been sent to your GCash account. Check your GCash for the payment.</p>
      <p>Thank you for helping make Philippine roads safer! 🇵🇭</p>
    `
  })
}

// Fast email sending function
export async function sendSimpleEmail(to: string, subject: string, html: string) {
  try {
    const transporter = createTransporter()
    
    const mailOptions = {
      from: `"${env.MAIL_FROM_NAME}" <${env.MAIL_FROM_ADDRESS}>`,
      to,
      subject,
      html,
    }
    
    const result = await transporter.sendMail(mailOptions)
    console.log('✅ Simple email sent successfully:', result.messageId)
    return { success: true, messageId: result.messageId }
  } catch (error) {
    console.error('❌ Error sending simple email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Send report status notification with simple templates
export async function sendSimpleReportStatusNotification(
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
      template = simpleEmailTemplates.reportSubmitted(reportCode, reportData.offenseName, reportData.penaltyAmount)
      break
    case 'APPROVED':
      template = simpleEmailTemplates.reportApproved(reportCode, reportData.offenseName, reportData.penaltyAmount, reportData.earnings || 0)
      break
    case 'REJECTED':
      template = simpleEmailTemplates.reportRejected(reportCode, reportData.offenseName, reportData.rejectionReason || 'No reason provided')
      break
    case 'PAID':
      template = simpleEmailTemplates.reportPaid(reportCode, reportData.offenseName, reportData.earnings || 0)
      break
    default:
      throw new Error(`Unknown status: ${status}`)
  }
  
  return await sendSimpleEmail(userEmail, template.subject, template.html)
}
