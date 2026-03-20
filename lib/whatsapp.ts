import twilio from "twilio"

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

// ─── WHATSAPP ALERT ───────────────────────────────────────

export async function sendWhatsAppAlert({
  to,
  documentName,
  daysRemaining,
  expiryDate,
  workspaceName,
  documentUrl,
}: {
  to: string
  documentName: string
  daysRemaining: number
  expiryDate: Date
  workspaceName: string
  documentUrl: string
}) {
  // Format phone: ensure it has country code
  const phone = to.startsWith("+") ? to : `+${to}`

  const urgency =
    daysRemaining < 0
      ? "🔴 EXPIRED"
      : daysRemaining === 0
      ? "🔴 EXPIRES TODAY"
      : daysRemaining <= 7
      ? `🔴 EXPIRES IN ${daysRemaining} DAYS`
      : daysRemaining <= 30
      ? `🟠 EXPIRES IN ${daysRemaining} DAYS`
      : `🟡 EXPIRES IN ${daysRemaining} DAYS`

  const formattedDate = new Date(expiryDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  const message = `*DocAlert — ${workspaceName}*

${urgency}

📄 *Document:* ${documentName}
📅 *Expiry:* ${formattedDate}

Take action before it's too late.

🔗 View: ${documentUrl}

_Reply STOP to unsubscribe from alerts._`

  await client.messages.create({
    from: process.env.TWILIO_WHATSAPP_FROM,
    to: `whatsapp:${phone}`,
    body: message,
  })
}

// ─── SMS ALERT ────────────────────────────────────────────

export async function sendSMSAlert({
  to,
  documentName,
  daysRemaining,
  documentUrl,
}: {
  to: string
  documentName: string
  daysRemaining: number
  documentUrl: string
}) {
  const phone = to.startsWith("+") ? to : `+${to}`

  const statusText =
    daysRemaining < 0
      ? "EXPIRED"
      : daysRemaining === 0
      ? "expires TODAY"
      : `expires in ${daysRemaining} day${daysRemaining !== 1 ? "s" : ""}`

  const message = `DocAlert: "${documentName}" ${statusText}. View: ${documentUrl}`

  await client.messages.create({
    from: process.env.TWILIO_SMS_FROM,
    to: phone,
    body: message,
  })
}

// ─── BULK ALERT SENDER ────────────────────────────────────

export async function sendBulkWhatsAppAlerts(
  alerts: Array<{
    phone: string
    documentName: string
    daysRemaining: number
    expiryDate: Date
    workspaceName: string
    documentUrl: string
  }>
) {
  const results = await Promise.allSettled(
    alerts.map((a) =>
      sendWhatsAppAlert({
        to: a.phone,
        documentName: a.documentName,
        daysRemaining: a.daysRemaining,
        expiryDate: a.expiryDate,
        workspaceName: a.workspaceName,
        documentUrl: a.documentUrl,
      })
    )
  )

  const succeeded = results.filter((r) => r.status === "fulfilled").length
  const failed = results.filter((r) => r.status === "rejected").length

  return { succeeded, failed, total: alerts.length }
}
