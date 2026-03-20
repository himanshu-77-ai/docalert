import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { differenceInDays, format } from 'date-fns'
import { sendEmailAlert, sendWhatsAppAlert, sendSMSAlert } from '@/lib/notifications'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const docs = await prisma.document.findMany({
    where: { expiryDate: { gte: new Date() } },
    include: { workspace: { include: { members: { include: { user: true } }, alertRules: true } } },
  })
  const ALERT_DAYS = [90, 30, 7, 1]
  let alertsSent = 0
  for (const doc of docs) {
    const daysLeft = differenceInDays(doc.expiryDate, new Date())
    if (!ALERT_DAYS.includes(daysLeft)) continue
    const channels = doc.workspace.alertRules.filter(r => r.isActive && r.daysBeforeExpiry === daysLeft).flatMap(r => r.channels)
    const expiryFormatted = format(doc.expiryDate, 'dd MMM yyyy')
    for (const member of doc.workspace.members) {
      const { user } = member
      if (channels.includes('EMAIL') && user.email) {
        try { await sendEmailAlert({ to: user.email, name: user.name || 'User', documentName: doc.name, daysLeft, expiryDate: expiryFormatted }); alertsSent++ } catch {}
      }
      if (channels.includes('WHATSAPP') && user.whatsapp) {
        try { await sendWhatsAppAlert({ to: user.whatsapp, documentName: doc.name, daysLeft, expiryDate: expiryFormatted }); alertsSent++ } catch {}
      }
      if (channels.includes('SMS') && user.phone) {
        try { await sendSMSAlert({ to: user.phone, documentName: doc.name, daysLeft }); alertsSent++ } catch {}
      }
      if (channels.includes('IN_APP')) {
        await prisma.notification.create({ data: { userId: user.id, documentId: doc.id, type: 'EXPIRY_REMINDER', channel: 'IN_APP', title: `${doc.name} expires in ${daysLeft} days`, message: `Document expires on ${expiryFormatted}.` } })
      }
    }
    await prisma.document.update({ where: { id: doc.id }, data: { lastReminderAt: new Date(), remindersSent: { increment: 1 } } })
  }
  return NextResponse.json({ success: true, alertsSent, docsChecked: docs.length })
}
