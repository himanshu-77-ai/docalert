import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { differenceInDays, format, formatDistanceToNow } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getDocumentStatus(expiryDate: Date) {
  const days = differenceInDays(new Date(expiryDate), new Date())
  if (days < 0) return { status: 'EXPIRED', days, color: 'red', label: 'Expired' }
  if (days <= 30) return { status: 'URGENT', days, color: 'amber', label: 'Urgent' }
  if (days <= 90) return { status: 'EXPIRING_SOON', days, color: 'yellow', label: 'Expiring soon' }
  return { status: 'VALID', days, color: 'green', label: 'Valid' }
}

export function formatDate(date: Date | string) {
  return format(new Date(date), 'dd MMM yyyy')
}

export function formatRelative(date: Date | string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function getDaysText(days: number) {
  if (days < 0) return `Expired ${Math.abs(days)} days ago`
  if (days === 0) return 'Expires today'
  if (days === 1) return '1 day remaining'
  return `${days} days remaining`
}

export function generateSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}
