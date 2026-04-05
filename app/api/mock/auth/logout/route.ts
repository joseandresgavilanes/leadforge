import { NextResponse } from 'next/server'
import { MOCK_SESSION_COOKIE } from '@/lib/mock/session-codec'

export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(MOCK_SESSION_COOKIE, '', {
    httpOnly: true,
    path: '/',
    maxAge: 0,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })
  return res
}
