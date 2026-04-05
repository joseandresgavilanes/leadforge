import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import ActivityForm from '../activity-form'

export default async function NewActivityPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations('activities')
  const tc = await getTranslations('common')

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href={`/${locale}/app/activities`}>
          <Button variant="ghost" size="sm">{tc('actions.back')}</Button>
        </Link>
        <h1 className="text-2xl font-heading font-bold">{t('logActivity')}</h1>
      </div>
      <ActivityForm locale={locale} />
    </div>
  )
}
