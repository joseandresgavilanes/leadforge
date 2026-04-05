import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CreateThreadForm } from '@/components/crm/create-thread-form'

export default async function NewInboxThreadPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations('workspace.inbox')
  const tc = await getTranslations('common')

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/${locale}/app/inbox`}>
          <Button variant="ghost" size="sm">
            {tc('actions.back')}
          </Button>
        </Link>
        <h1 className="text-2xl font-heading font-bold">{t('newThread')}</h1>
      </div>
      <CreateThreadForm locale={locale} />
    </div>
  )
}
