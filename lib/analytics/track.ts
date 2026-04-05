import type { AnalyticsEventName } from '@/types'
import type { Json } from '@/types/supabase'

interface TrackEventOptions {
  organizationId?: string
  userId?: string
  properties?: Record<string, unknown>
}

export async function trackEvent(
  event: AnalyticsEventName,
  options: TrackEventOptions = {}
): Promise<void> {
  try {
    // Server-side: store in DB
    if (typeof window === 'undefined') {
      const { tryCreateClient } = await import('@/lib/db/server')
      const supabase = await tryCreateClient()
      if (!supabase) return
      await supabase.from('analytics_events').insert({
        event,
        organization_id: options.organizationId ?? null,
        user_id: options.userId ?? null,
        properties: (options.properties ?? {}) as Json,
      })
    } else {
      const { trackClientEvent } = await import('@/lib/analytics/track-client')
      trackClientEvent(event, options.properties)
    }
  } catch {
    // Analytics should never break the app
  }
}
