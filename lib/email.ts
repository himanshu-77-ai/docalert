import sgMail from "@sendgrid/mail"

sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

const FROM = {
  email: process.env.EMAIL_FROM || "noreply@docalert.com",
  name: process.env.EMAIL_FROM_NAME || "DocAlert",
}

// ─── EXPIRY REMINDER EMAIL ────────────────────────────────

export async function sendExpiryReminderEmail({
  to,
  userName,
  documentName,
  category,
  expiryDate,
  daysRemaining,
  workspaceName,
  documentUrl,
}: {
  to: string
  userName: string
  documentName: string
  category: string
  expiryDate: Date
  daysRemaining: number
  workspaceName: string
  documentUrl: string
}) {
  const urgencyColor = daysRemaining <= 7 ? "#E24B4A" : daysRemaining <= 30 ? "#BA7517" : "#BA7517"
  const urgencyText =
    daysRemaining < 0
      ? "EXPIRED"
      : daysRemaining === 0
      ? "EXPIRES TODAY"
      : daysRemaining === 1
      ? "EXPIRES TOMORROW"
      : `EXPIRES IN ${daysRemaining} DAYS`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document Expiry Alert</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e5e0">
    
    <!-- Header -->
    <div style="background:#0f172a;padding:28px 32px;display:flex;align-items:center;gap:12px">
      <span style="font-size:28px">📋</span>
      <div>
        <h1 style="margin:0;color:#fff;font-size:22px;font-weight:600">DocAlert</h1>
        <p style="margin:2px 0 0;color:#94a3b8;font-size:13px">${workspaceName}</p>
      </div>
    </div>

    <!-- Alert Banner -->
    <div style="background:${urgencyColor};padding:14px 32px">
      <p style="margin:0;color:#fff;font-size:13px;font-weight:700;letter-spacing:.08em">${urgencyText}</p>
    </div>

    <!-- Body -->
    <div style="padding:32px">
      <p style="margin:0 0 8px;color:#374151;font-size:16px">Hi ${userName},</p>
      <p style="margin:0 0 28px;color:#6b7280;font-size:15px;line-height:1.6">
        The following document in your workspace requires your attention:
      </p>

      <!-- Document Card -->
      <div style="background:#f8f8f5;border:1px solid #e5e5e0;border-radius:10px;padding:20px 24px;margin-bottom:28px">
        <div style="display:flex;align-items:flex-start;gap:16px">
          <div style="font-size:32px;flex-shrink:0">📄</div>
          <div style="flex:1">
            <h2 style="margin:0 0 4px;font-size:18px;color:#111827;font-weight:600">${documentName}</h2>
            <p style="margin:0 0 16px;color:#6b7280;font-size:13px">${category}</p>
            <table style="width:100%;border-collapse:collapse">
              <tr>
                <td style="padding:6px 0;color:#9ca3af;font-size:13px;width:40%">Expiry date</td>
                <td style="padding:6px 0;color:#111827;font-size:13px;font-weight:500">${new Date(expiryDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#9ca3af;font-size:13px">Status</td>
                <td style="padding:6px 0">
                  <span style="background:${urgencyColor}20;color:${urgencyColor};font-size:12px;font-weight:600;padding:3px 10px;border-radius:20px">${urgencyText}</span>
                </td>
              </tr>
            </table>
          </div>
        </div>
      </div>

      <!-- CTA Button -->
      <div style="text-align:center;margin-bottom:28px">
        <a href="${documentUrl}" style="display:inline-block;background:#0f172a;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:500">
          View Document →
        </a>
      </div>

      <p style="margin:0;color:#9ca3af;font-size:13px;line-height:1.6;border-top:1px solid #f0f0eb;padding-top:20px">
        You're receiving this because you have expiry alerts enabled for <strong>${workspaceName}</strong>.<br>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings/notifications" style="color:#0f172a">Manage notification settings</a>
      </p>
    </div>

  </div>
</body>
</html>
`

  await sgMail.send({
    to,
    from: FROM,
    subject: `⚠️ ${urgencyText}: ${documentName}`,
    html,
  })
}

// ─── TEAM INVITE EMAIL ────────────────────────────────────

export async function sendTeamInviteEmail({
  to,
  inviterName,
  workspaceName,
  role,
  inviteUrl,
}: {
  to: string
  inviterName: string
  workspaceName: string
  role: string
  inviteUrl: string
}) {
  const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e5e0">
    <div style="background:#0f172a;padding:28px 32px">
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:600">📋 DocAlert</h1>
    </div>
    <div style="padding:32px">
      <h2 style="margin:0 0 16px;font-size:20px;color:#111827">You've been invited!</h2>
      <p style="color:#6b7280;line-height:1.6;margin:0 0 28px">
        <strong>${inviterName}</strong> has invited you to join <strong>${workspaceName}</strong> on DocAlert as a <strong>${role}</strong>.
      </p>
      <div style="text-align:center;margin-bottom:28px">
        <a href="${inviteUrl}" style="display:inline-block;background:#0f172a;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:500">
          Accept Invitation →
        </a>
      </div>
      <p style="color:#9ca3af;font-size:13px">This invite expires in 7 days.</p>
    </div>
  </div>
</body>
</html>
`
  await sgMail.send({
    to,
    from: FROM,
    subject: `You're invited to ${workspaceName} on DocAlert`,
    html,
  })
}

// ─── WELCOME EMAIL ─────────────────────────────────────

export async function sendWelcomeEmail({ to, name }: { to: string; name: string }) {
  await sgMail.send({
    to,
    from: FROM,
    subject: "Welcome to DocAlert 🎉",
    html: `
<div style="max-width:600px;margin:40px auto;font-family:-apple-system,sans-serif">
  <h1 style="color:#0f172a">Welcome to DocAlert, ${name}! 👋</h1>
  <p style="color:#6b7280;line-height:1.6">Never miss a document expiry again. Start by adding your first document.</p>
  <a href="${process.env.NEXT_PUBLIC_APP_URL}/documents" style="display:inline-block;background:#0f172a;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;margin-top:16px">
    Add your first document →
  </a>
</div>`,
  })
}
