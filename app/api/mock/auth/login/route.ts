import { NextResponse } from 'next/server'
import { z } from 'zod'
import { encodeMockSession, MOCK_SESSION_COOKIE } from '@/lib/mock/session-codec'

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().optional(),
})

export async function POST(req: Request) {
  const json = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 400 })
  }

  const email = parsed.data.email.trim().toLowerCase()
  const res = NextResponse.json({ ok: true })
  res.cookies.set(MOCK_SESSION_COOKIE, encodeMockSession({ email }), {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30,
  })
  return res
}
