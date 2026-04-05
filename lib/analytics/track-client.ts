import type { AnalyticsEventName } from '@/types'

/** Safe for Client Components — uses fetch only (no server modules). */
export function trackClientEvent(
  event: AnalyticsEventName,
  properties?: Record<string, unknown>
): void {
  fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event, properties }),
  }).catch(() => {})
}
