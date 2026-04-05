import { NextResponse } from 'next/server'
import { z } from 'zod'
import { encodeMockSession, MOCK_SESSION_COOKIE } from '@/lib/mock/session-codec'

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().optional(),
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  companyName: z.string().optional().nullable(),
})

export async function POST(req: Request) {
  const json = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid signup data' }, { status: 400 })
  }

  const { email, firstName, lastName, companyName } = parsed.data
  const res = NextResponse.json({ ok: true })
  res.cookies.set(
    MOCK_SESSION_COOKIE,
    encodeMockSession({
      email: email.trim().toLowerCase(),
      firstName: firstName ?? null,
      lastName: lastName ?? null,
      companyName: companyName?.trim() || null,
    }),
    {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30,
    }
  )
  return res
}
