import { UserRole, PlanType, DocumentStatus, NotificationChannel, NotificationStatus } from "@prisma/client"

// ─── USER & AUTH ─────────────────────────────────────────

export interface UserProfile {
  id: string
  name: string | null
  email: string
  image: string | null
  phone: string | null
  whatsappNumber: string | null
  createdAt: Date
}

export interface WorkspaceMemberWithUser {
  id: string
  role: UserRole
  joinedAt: Date
  user: UserProfile
}

// ─── WORKSPACE ───────────────────────────────────────────

export interface WorkspaceWithPlan {
  id: string
  name: string
  slug: string
  logo: string | null
  plan: PlanType
  maxDocuments: number
  maxMembers: number
  planExpiresAt: Date | null
  createdAt: Date
  _count?: {
    documents: number
    members: number
  }
}

// ─── DOCUMENT ────────────────────────────────────────────

export interface DocumentWithStatus {
  id: string
  workspaceId: string
  name: string
  category: string
  fileUrl: string | null
  fileType: string | null
  fileSizeBytes: number | null
  issueDate: Date | null
  expiryDate: Date
  notes: string | null
  tags: string[]
  status: DocumentStatus
  reminderDays: number[]
  isArchived: boolean
  createdAt: Date
  updatedAt: Date
  daysRemaining: number
}

export interface DocumentFormData {
  name: string
  category: string
  expiryDate: string
  issueDate?: string
  notes?: string
  tags?: string[]
  reminderDays?: number[]
  file?: File
}

export const DOCUMENT_CATEGORIES = [
  "Personal ID",
  "Passport / Travel",
  "Business License",
  "Insurance",
  "Contract",
  "Medical / Health",
  "Certification",
  "Permit",
  "Vehicle",
  "Property",
  "Tax",
  "Other",
] as const

export type DocumentCategory = typeof DOCUMENT_CATEGORIES[number]

export const CATEGORY_ICONS: Record<string, string> = {
  "Personal ID": "🪪",
  "Passport / Travel": "🛂",
  "Business License": "🏢",
  "Insurance": "🛡️",
  "Contract": "📝",
  "Medical / Health": "🏥",
  "Certification": "🎓",
  "Permit": "📋",
  "Vehicle": "🚗",
  "Property": "🏠",
  "Tax": "📊",
  "Other": "📄",
}

// ─── DASHBOARD STATS ─────────────────────────────────────

export interface DashboardStats {
  total: number
  expired: number
  urgent: number
  expiringSoon: number
  valid: number
  expiringThisMonth: number
  renewedThisMonth: number
}

export interface ExpiryTimelineItem {
  month: string
  expiring: number
  expired: number
}

export interface CategoryBreakdown {
  category: string
  count: number
  percentage: number
}

// ─── NOTIFICATIONS ───────────────────────────────────────

export interface NotificationItem {
  id: string
  channel: NotificationChannel
  status: NotificationStatus
  subject: string | null
  message: string
  sentAt: Date | null
  readAt: Date | null
  createdAt: Date
  document: {
    id: string
    name: string
    expiryDate: Date
  } | null
}

export interface NotificationSettingsForm {
  emailEnabled: boolean
  whatsappEnabled: boolean
  smsEnabled: boolean
  reminderDays: number[]
  dailyDigest: boolean
  digestTime: string
}

// ─── TEAM ────────────────────────────────────────────────

export interface InviteFormData {
  email: string
  role: UserRole
}

// ─── BILLING ─────────────────────────────────────────────

export interface PricingPlan {
  id: string
  name: string
  price: number
  interval: "month" | "year"
  features: string[]
  maxDocuments: number
  maxMembers: number
  plan: PlanType
  stripePriceId: string
  popular?: boolean
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "Starter",
    price: 0,
    interval: "month",
    plan: PlanType.FREE,
    maxDocuments: 10,
    maxMembers: 1,
    stripePriceId: "",
    features: [
      "1 user",
      "10 documents",
      "Email alerts",
      "Basic dashboard",
      "CSV export",
    ],
  },
  {
    id: "business",
    name: "Business",
    price: 19,
    interval: "month",
    plan: PlanType.BUSINESS,
    maxDocuments: -1,
    maxMembers: 10,
    stripePriceId: process.env.STRIPE_BUSINESS_PRICE_ID || "",
    popular: true,
    features: [
      "10 team members",
      "Unlimited documents",
      "Email + WhatsApp alerts",
      "SMS reminders",
      "Team roles & permissions",
      "Document viewer",
      "Advanced analytics",
      "CSV/PDF export",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 49,
    interval: "month",
    plan: PlanType.ENTERPRISE,
    maxDocuments: -1,
    maxMembers: -1,
    stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || "",
    features: [
      "Unlimited members",
      "Unlimited documents",
      "All notification channels",
      "AI auto-scan (OCR)",
      "White-label branding",
      "API access & webhooks",
      "Calendar sync",
      "Priority support",
      "Custom integrations",
    ],
  },
]

// ─── API RESPONSES ───────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// ─── DOCUMENT STATUS HELPERS ─────────────────────────────

export function getDaysRemaining(expiryDate: Date): number {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const exp = new Date(expiryDate)
  exp.setHours(0, 0, 0, 0)
  return Math.floor((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

export function getDocumentStatus(days: number): DocumentStatus {
  if (days < 0) return DocumentStatus.EXPIRED
  if (days <= 30) return DocumentStatus.URGENT
  if (days <= 90) return DocumentStatus.EXPIRING_SOON
  return DocumentStatus.VALID
}

export function getStatusColor(status: DocumentStatus): string {
  switch (status) {
    case DocumentStatus.EXPIRED: return "red"
    case DocumentStatus.URGENT: return "amber"
    case DocumentStatus.EXPIRING_SOON: return "yellow"
    case DocumentStatus.VALID: return "green"
  }
}

export function getStatusLabel(status: DocumentStatus): string {
  switch (status) {
    case DocumentStatus.EXPIRED: return "Expired"
    case DocumentStatus.URGENT: return "Urgent"
    case DocumentStatus.EXPIRING_SOON: return "Expiring soon"
    case DocumentStatus.VALID: return "Valid"
  }
}

export function getDaysText(days: number): string {
  if (days < 0) return `Expired ${Math.abs(days)} days ago`
  if (days === 0) return "Expires today"
  if (days === 1) return "Expires tomorrow"
  return `${days} days remaining`
}
