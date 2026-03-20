import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: Number(process.env.EMAIL_SERVER_PORT || 587),
  secure: false,
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
})

function baseTemplate(content: string) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <style>body{margin:0;padding:0;background:#f8f7f4;font-family:-apple-system,sans-serif}
  .wrap{max-width:520px;margin:40px auto;background:#fff;border-radius:16px;border:1px solid #e8e6e0;overflow:hidden}
  .header{background:#1a1917;padding:24px 32px;display:flex;align-items:center;gap:10px}
  .logo{width:32px;height:32px;background:#fff;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:700;color:#1a1917;font-size:14px}
  .logo-text{color:#fff;font-weight:600;font-size:16px}
  .body{padding:32px}
  .title{font-size:22px;font-weight:700;color:#1a1917;margin-bottom:12px}
  .text{font-size:15px;color:#4b4a47;line-height:1.6;margin-bottom:16px}
  .btn{display:inline-block;background:#1a1917;color:#fff;padding:13px 28px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;margin:8px 0 20px}
  .divider{height:1px;background:#f0ede8;margin:20px 0}
  .footer{font-size:12px;color:#9ca3af;line-height:1.6}
  .code{font-size:32px;font-weight:700;letter-spacing:6px;color:#1a1917;background:#f8f7f4;border-radius:10px;padding:16px 24px;text-align:center;margin:20px 0}
  </style></head><body>
  <div class="wrap">
    <div class="header">
      <div class="logo">D</div>
      <span class="logo-text">DocAlert</span>
    </div>
    <div class="body">${content}</div>
  </div></body></html>`
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}`
  await transporter.sendMail({
    from: `"DocAlert" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: 'Reset your DocAlert password',
    html: baseTemplate(`
      <div class="title">Reset your password</div>
      <div class="text">We received a request to reset your password. Click the button below to create a new password. This link expires in 1 hour.</div>
      <a href="${resetUrl}" class="btn">Reset password →</a>
      <div class="divider"></div>
      <div class="footer">If you didn't request this, you can safely ignore this email. Your password won't change.<br><br>
      Or copy this link: ${resetUrl}</div>
    `)
  })
}

export async function sendVerificationEmail(email: string, token: string, name: string) {
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?token=${token}`
  await transporter.sendMail({
    from: `"DocAlert" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: 'Verify your DocAlert email',
    html: baseTemplate(`
      <div class="title">Welcome to DocAlert, ${name}! 👋</div>
      <div class="text">Thanks for signing up. Please verify your email address to get started.</div>
      <a href="${verifyUrl}" class="btn">Verify email →</a>
      <div class="divider"></div>
      <div class="footer">Link expires in 24 hours. If you didn't create an account, you can safely ignore this email.</div>
    `)
  })
}

export async function sendWelcomeEmail(email: string, name: string, workspaceName: string) {
  await transporter.sendMail({
    from: `"DocAlert" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: 'Welcome to DocAlert — start tracking documents',
    html: baseTemplate(`
      <div class="title">You're all set, ${name}! 🎉</div>
      <div class="text">Your workspace "<strong>${workspaceName}</strong>" is ready. Start adding documents and set up alerts so you never miss an expiry.</div>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="btn">Open dashboard →</a>
      <div class="divider"></div>
      <div class="text" style="font-size:13px">Quick start:<br>
      1. Add your first document<br>
      2. Set up email or WhatsApp alerts<br>
      3. Invite your team members</div>
    `)
  })
}

export async function sendTeamInviteEmail(email: string, inviterName: string, workspaceName: string) {
  await transporter.sendMail({
    from: `"DocAlert" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: `${inviterName} invited you to ${workspaceName} on DocAlert`,
    html: baseTemplate(`
      <div class="title">You've been invited! 🎉</div>
      <div class="text"><strong>${inviterName}</strong> has added you to <strong>${workspaceName}</strong> on DocAlert — a document expiry tracker.</div>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/auth/login" class="btn">Accept invite →</a>
      <div class="divider"></div>
      <div class="footer">If you don't have a DocAlert account yet, register with this email address first.</div>
    `)
  })
}
