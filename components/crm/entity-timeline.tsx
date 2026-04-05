import { getTranslations } from 'next-intl/server'
import { getEntityTimeline, type TimelineEntity } from '@/features/timeline/actions'
import { formatRelative } from '@/lib/utils'

export async function EntityTimeline({
  entity,
  entityId,
  locale,
}: {
  entity: TimelineEntity
  entityId: string
  locale: string
}) {
  const [events, t] = await Promise.all([
    getEntityTimeline(entity, entityId),
    getTranslations('timeline'),
  ])

  if (events.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">{t('empty')}</div>
    )
  }

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b bg-muted/30">
        <h2 className="font-heading font-semibold text-sm">{t('title')}</h2>
      </div>
      <ul className="divide-y max-h-[480px] overflow-y-auto">
        {events.map((ev) => (
          <li key={ev.id} className="px-4 py-3 text-sm space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] uppercase tracking-wide font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                {t(`kinds.${ev.kind}`)}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatRelative(ev.occurredAt, locale)}
                {ev.actorName ? ` · ${ev.actorName}` : ''}
              </span>
            </div>
            <p className="font-medium leading-snug">{ev.title}</p>
            {ev.subtitle ? (
              <p className="text-xs text-muted-foreground line-clamp-2">{ev.subtitle}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  )
}
