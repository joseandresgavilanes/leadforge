import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CreateSequenceForm } from '@/components/crm/create-sequence-form'

export default async function NewSequencePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations('workspace.sequences')
  const tc = await getTranslations('common')

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/${locale}/app/sequences`}>
          <Button variant="ghost" size="sm">
            {tc('actions.back')}
          </Button>
        </Link>
        <h1 className="text-2xl font-heading font-bold">{t('new')}</h1>
      </div>
      <CreateSequenceForm locale={locale} />
    </div>
  )
}
