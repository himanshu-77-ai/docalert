// File storage — supports Supabase Storage (default) or AWS S3
// Switch via STORAGE_TYPE env var: "supabase" | "s3"

export async function uploadFile(file: Buffer, fileName: string, mimeType: string): Promise<string> {
  const storageType = process.env.STORAGE_TYPE || 'supabase'

  if (storageType === 's3') {
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3')
    const client = new S3Client({
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    })
    const key = `documents/${Date.now()}-${fileName}`
    await client.send(new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: key,
      Body: file,
      ContentType: mimeType,
    }))
    return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
  }

  // Supabase Storage (default)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY!
  const path = `documents/${Date.now()}-${fileName}`

  const res = await fetch(`${supabaseUrl}/storage/v1/object/docalert-files/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${supabaseKey}`,
      'Content-Type': mimeType,
      'x-upsert': 'true',
    },
    body: file,
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Upload failed: ${err}`)
  }

  return `${supabaseUrl}/storage/v1/object/public/docalert-files/${path}`
}

export async function deleteFile(fileUrl: string): Promise<void> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY!
    const path = fileUrl.split('/docalert-files/')[1]
    if (!path) return
    await fetch(`${supabaseUrl}/storage/v1/object/docalert-files/${path}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${supabaseKey}` },
    })
  } catch {}
}

export function getFileType(mimeType: string): 'pdf' | 'image' | 'other' {
  if (mimeType === 'application/pdf') return 'pdf'
  if (mimeType.startsWith('image/')) return 'image'
  return 'other'
}

export const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/jpg']
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
