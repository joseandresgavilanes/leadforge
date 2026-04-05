import { cookies } from 'next/headers'
import { type NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { tryCreateClient } from '@/lib/db/server'
import { decodeMockSession, MOCK_SESSION_COOKIE } from '@/lib/mock/session-codec'

function getOpenAI() {
  const key = process.env.OPENAI_API_KEY
  if (!key) return null
  return new OpenAI({ apiKey: key })
}

export async function POST(request: NextRequest) {
  try {
    const openai = getOpenAI()
    if (!openai) {
      return NextResponse.json({ error: 'AI is not configured' }, { status: 503 })
    }

    const supabase = await tryCreateClient()
    let authed = false
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser()
      authed = !!user
    } else {
      const jar = await cookies()
      const raw = jar.get(MOCK_SESSION_COOKIE)?.value
      authed = !!(raw && decodeMockSession(raw))
    }
    if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { type, context } = await request.json()

    let prompt = ''
    switch (type) {
      case 'opportunity_summary':
        prompt = `You are a CRM assistant. Summarize this sales opportunity concisely in 2-3 sentences, highlighting key points and status:\n\n${JSON.stringify(context, null, 2)}`
        break
      case 'next_step':
        prompt = `You are a sales coach. Based on this opportunity data, suggest ONE specific, actionable next step the sales rep should take:\n\n${JSON.stringify(context, null, 2)}\n\nRespond with just the suggested action in 1-2 sentences.`
        break
      case 'follow_up_email':
        prompt = `You are a professional sales writer. Write a short, personalized follow-up email draft based on this opportunity context. Be concise, professional, and include a clear CTA:\n\n${JSON.stringify(context, null, 2)}\n\nWrite only the email body (no subject line).`
        break
      case 'meeting_summary':
        prompt = `You are a sales assistant. Summarize these meeting notes into a structured summary with: Key Points, Next Steps, and Commitments Made:\n\n${context}`
        break
      default:
        return NextResponse.json({ error: 'Unknown AI type' }, { status: 400 })
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.7,
    })

    const result = completion.choices[0]?.message?.content ?? ''
    return NextResponse.json({ result })
  } catch (err) {
    console.error('AI route error:', err)
    return NextResponse.json({ error: 'AI request failed' }, { status: 500 })
  }
}
