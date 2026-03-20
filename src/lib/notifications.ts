import nodemailer from 'nodemailer'
import twilio from 'twilio'

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: Number(process.env.EMAIL_SERVER_PORT),
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
})

export async function sendEmailAlert({
  to, name, documentName, daysLeft, expiryDate
}: {
  to: string; name: string; documentName: string
  daysLeft: number; expiryDate: string
}) {
  const subject = daysLeft <= 0
    ? `🔴 Document Expired: ${documentName}`
    : `⚠️ Document Expiring in ${daysLeft} days: ${documentName}`

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><style>
      body { font-family: -apple-system, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
      .card { background: white; border-radius: 12px; padding: 32px; max-width: 500px; margin: 0 auto; }
      .logo { font-size: 20px; font-weight: 700; color: #1a1a2e; margin-bottom: 24px; }
      .status { padding: 8px 16px; border-radius: 20px; display: inline-block; font-size: 14px; font-weight: 600; margin-bottom: 16px; background: ${daysLeft <= 0 ? '#fee2e2' : daysLeft <= 30 ? '#fef3c7' : '#dcfce7'}; color: ${daysLeft <= 0 ? '#dc2626' : daysLeft <= 30 ? '#d97706' : '#16a34a'}; }
      .doc-name { font-size: 22px; font-weight: 700; color: #1a1a2e; margin-bottom: 8px; }
      .expiry { font-size: 15px; color: #6b7280; margin-bottom: 24px; }
      .cta { background: #1a1a2e; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block; }
      .footer { margin-top: 24px; font-size: 12px; color: #9ca3af; }
    </style></head>
    <body>
      <div class="card">
        <div class="logo">📋 DocAlert</div>
        <p style="color:#6b7280;margin-bottom:16px">Hi ${name},</p>
        <div class="status">${daysLeft <= 0 ? 'Expired' : `Expires in ${daysLeft} days`}</div>
        <div class="doc-name">${documentName}</div>
        <div class="expiry">Expiry date: ${expiryDate}</div>
        <p style="color:#374151;margin-bottom:24px">
          ${daysLeft <= 0
            ? 'This document has already expired. Please renew it immediately to avoid any issues.'
            : `This document will expire soon. Please take action to renew it before it expires.`}
        </p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/documents" class="cta">View Document →</a>
        <div class="footer">You're receiving this because you have alerts enabled in DocAlert.</div>
      </div>
    </body>
    </html>
  `

  await transporter.sendMail({
    from: `"DocAlert" <${process.env.EMAIL_FROM}>`,
    to,
    subject,
    html,
  })
}

export async function sendWhatsAppAlert({
  to, documentName, daysLeft, expiryDate
}: {
  to: string; documentName: string; daysLeft: number; expiryDate: string
}) {
  const message = daysLeft <= 0
    ? `🔴 *DocAlert* - Document Expired!\n\n📄 *${documentName}*\nExpired on: ${expiryDate}\n\nPlease renew immediately.\n👉 ${process.env.NEXT_PUBLIC_APP_URL}/documents`
    : `⚠️ *DocAlert* - Document Expiring Soon!\n\n📄 *${documentName}*\nExpires on: ${expiryDate}\nOnly *${daysLeft} days* remaining!\n\nTake action now 👇\n${process.env.NEXT_PUBLIC_APP_URL}/documents`

  await twilioClient.messages.create({
    from: process.env.TWILIO_WHATSAPP_FROM,
    to: `whatsapp:${to}`,
    body: message,
  })
}

export async function sendSMSAlert({
  to, documentName, daysLeft
}: {
  to: string; documentName: string; daysLeft: number
}) {
  const message = daysLeft <= 0
    ? `[DocAlert] EXPIRED: ${documentName} has expired. Renew now: ${process.env.NEXT_PUBLIC_APP_URL}`
    : `[DocAlert] ${documentName} expires in ${daysLeft} days. Act now: ${process.env.NEXT_PUBLIC_APP_URL}`

  await twilioClient.messages.create({
    from: process.env.TWILIO_SMS_FROM,
    to,
    body: message,
  })
}
