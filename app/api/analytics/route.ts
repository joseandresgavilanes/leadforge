import { type NextRequest, NextResponse } from 'next/server'
import { tryCreateClient } from '@/lib/db/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { event, organizationId, userId, properties } = body

    if (!event) return NextResponse.json({ error: 'Missing event' }, { status: 400 })

    const supabase = await tryCreateClient()
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from('analytics_events').insert({
        event,
        organization_id: organizationId ?? null,
        user_id: userId ?? user?.id ?? null,
        properties: properties ?? {},
      })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true }) // Never fail analytics
  }
}
