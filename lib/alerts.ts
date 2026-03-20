import { prisma } from "@/lib/prisma"
import { sendExpiryReminderEmail } from "@/lib/email"
import { sendWhatsAppAlert, sendSMSAlert } from "@/lib/whatsapp"
import { getDaysRemaining, getDocumentStatus } from "@/types"
import { DocumentStatus, NotificationChannel, NotificationStatus } from "@prisma/client"

// This runs daily via Vercel Cron or a cron endpoint
// Configure in vercel.json: { "crons": [{ "path": "/api/alerts/run", "schedule": "0 8 * * *" }] }

export async function runDailyAlerts() {
  console.log("[DocAlert Cron] Starting daily alert check...")

  // Get all non-archived documents with their workspace notification settings
  const documents = await prisma.document.findMany({
    where: { isArchived: false },
    include: {
      workspace: {
        include: {
          notifSettings: true,
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true,
                  whatsappNumber: true,
                },
              },
            },
          },
        },
      },
    },
  })

  let emailsSent = 0
  let whatsappSent = 0
  let smsSent = 0
  let errors = 0

  for (const doc of documents) {
    const daysRemaining = getDaysRemaining(doc.expiryDate)
    const settings = doc.workspace.notifSettings

    if (!settings) continue

    // Check if today matches a reminder day
    const shouldAlert =
      settings.reminderDays.includes(daysRemaining) ||
      (daysRemaining < 0 && daysRemaining >= -7) // Alert for first 7 days after expiry

    if (!shouldAlert) continue

    // Update document status
    const newStatus = getDocumentStatus(daysRemaining)
    if (doc.status !== newStatus) {
      await prisma.document.update({
        where: { id: doc.id },
        data: { status: newStatus },
      })
    }

    // Send alerts to all workspace members (admins & managers)
    const recipients = doc.workspace.members.filter(
      (m) => m.role === "ADMIN" || m.role === "MANAGER"
    )

    for (const member of recipients) {
      const { user } = member
      const docUrl = `${process.env.NEXT_PUBLIC_APP_URL}/documents/${doc.id}`

      // ── EMAIL ─────────────────────────────────────────
      if (settings.emailEnabled && user.email) {
        try {
          await sendExpiryReminderEmail({
            to: user.email,
            userName: user.name || user.email.split("@")[0],
            documentName: doc.name,
            category: doc.category,
            expiryDate: doc.expiryDate,
            daysRemaining,
            workspaceName: doc.workspace.name,
            documentUrl: docUrl,
          })

          await prisma.notification.create({
            data: {
              userId: user.id,
              documentId: doc.id,
              workspaceId: doc.workspaceId,
              channel: NotificationChannel.EMAIL,
              status: NotificationStatus.SENT,
              subject: `Document expiry: ${doc.name}`,
              message: `${doc.name} expires in ${daysRemaining} days`,
              sentAt: new Date(),
            },
          })
          emailsSent++
        } catch (e) {
          console.error(`[Email] Failed for ${user.email}:`, e)
          errors++
        }
      }

      // ── WHATSAPP ──────────────────────────────────────
      if (settings.whatsappEnabled && user.whatsappNumber) {
        try {
          await sendWhatsAppAlert({
            to: user.whatsappNumber,
            documentName: doc.name,
            daysRemaining,
            expiryDate: doc.expiryDate,
            workspaceName: doc.workspace.name,
            documentUrl: docUrl,
          })

          await prisma.notification.create({
            data: {
              userId: user.id,
              documentId: doc.id,
              workspaceId: doc.workspaceId,
              channel: NotificationChannel.WHATSAPP,
              status: NotificationStatus.SENT,
              message: `WhatsApp sent for ${doc.name}`,
              sentAt: new Date(),
            },
          })
          whatsappSent++
        } catch (e) {
          console.error(`[WhatsApp] Failed for ${user.whatsappNumber}:`, e)
          errors++
        }
      }

      // ── SMS ───────────────────────────────────────────
      if (settings.smsEnabled && user.phone) {
        try {
          await sendSMSAlert({
            to: user.phone,
            documentName: doc.name,
            daysRemaining,
            documentUrl: docUrl,
          })

          await prisma.notification.create({
            data: {
              userId: user.id,
              documentId: doc.id,
              workspaceId: doc.workspaceId,
              channel: NotificationChannel.SMS,
              status: NotificationStatus.SENT,
              message: `SMS sent for ${doc.name}`,
              sentAt: new Date(),
            },
          })
          smsSent++
        } catch (e) {
          console.error(`[SMS] Failed for ${user.phone}:`, e)
          errors++
        }
      }

      // ── IN-APP NOTIFICATION ───────────────────────────
      await prisma.notification.create({
        data: {
          userId: user.id,
          documentId: doc.id,
          workspaceId: doc.workspaceId,
          channel: NotificationChannel.IN_APP,
          status: NotificationStatus.SENT,
          subject: `${doc.name} — ${daysRemaining < 0 ? "Expired" : `${daysRemaining} days left`}`,
          message: `${doc.name} (${doc.category}) expires on ${doc.expiryDate.toLocaleDateString()}`,
          sentAt: new Date(),
        },
      })
    }
  }

  const summary = { emailsSent, whatsappSent, smsSent, errors, documentsChecked: documents.length }
  console.log("[DocAlert Cron] Completed:", summary)
  return summary
}
