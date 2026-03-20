import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canUseAI } from '@/lib/planLimits'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!canUseAI(session.workspace?.plan || 'FREE'))
    return NextResponse.json({ error: 'AI scan requires Enterprise plan. Upgrade to use this feature.' }, { status: 403 })

  try {
    const { fileUrl, fileName } = await req.json()
    if (!fileUrl) return NextResponse.json({ error: 'File URL required' }, { status: 400 })

    // Call Anthropic Claude API to extract expiry date from document
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this document and extract the following information. Return ONLY a JSON object with these fields (no markdown, no explanation):
{
  "documentName": "full name of the document type",
  "expiryDate": "YYYY-MM-DD format if found, else null",
  "issueDate": "YYYY-MM-DD format if found, else null",
  "documentNo": "document number or ID if found, else null",
  "issuedBy": "issuing authority if found, else null",
  "category": "one of: PERSONAL_ID, PASSPORT, BUSINESS_LICENSE, INSURANCE, CONTRACT, MEDICAL, CERTIFICATION, PERMIT, VEHICLE, PROPERTY, TAX, OTHER"
}

Document file: ${fileName}
Document URL: ${fileUrl}

Look for expiry/validity/expires on/valid until/renewal date fields. Parse dates carefully.`,
            }
          ],
        }],
      }),
    })

    if (!response.ok) throw new Error('AI service unavailable')
    const aiData = await response.json()
    const text = aiData.content?.[0]?.text || '{}'

    let extracted: any = {}
    try {
      extracted = JSON.parse(text.replace(/```json|```/g, '').trim())
    } catch {
      extracted = {}
    }

    return NextResponse.json({ success: true, extracted })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'AI scan failed' }, { status: 500 })
  }
}
