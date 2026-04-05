import { type NextRequest, NextResponse } from 'next/server'
import { sendDemoConfirmationEmail } from '@/lib/resend/emails'

export async function POST(request: NextRequest) {
  try {
    const { firstName, email, locale } = await request.json()
    await sendDemoConfirmationEmail({ to: email, firstName, locale })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
