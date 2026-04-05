import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { getActivities } from '@/features/tasks/actions'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { formatRelative } from '@/lib/utils'

export default async function ActivitiesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations('activities')
  const tc = await getTranslations('common')
  const list = await getActivities({ limit: 100 })
  const base = `/${locale}/app`
  const types = t.raw('types') as Record<string, string>

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-heading font-bold">{t('title')}</h1>
        <Link href={`${base}/activities/new`}>
          <Button><Plus className="h-4 w-4" />{t('logActivity')}</Button>
        </Link>
      </div>
      <div className="rounded-lg border bg-card divide-y">
        {list.length === 0 ? (
          <p className="p-8 text-center text-muted-foreground">{t('empty.title')}</p>
        ) : (
          (list as any[]).map((a) => (
            <div key={a.id} className="px-4 py-3">
              <p className="font-medium text-sm">{a.subject}</p>
              <p className="text-xs text-muted-foreground">
                {types[a.type] ?? a.type} · {formatRelative(a.activity_date, locale)}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
