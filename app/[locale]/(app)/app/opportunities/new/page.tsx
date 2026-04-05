import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getPipelineStages } from '@/features/opportunities/actions'
import OpportunityForm from '../opportunity-form'

export default async function NewOpportunityPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ stage?: string }>
}) {
  const { locale } = await params
  const sp = await searchParams
  const stages = await getPipelineStages()
  const t = await getTranslations('opportunities')
  const tc = await getTranslations('common')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/${locale}/app/opportunities`}>
          <Button variant="ghost" size="sm">{tc('actions.back')}</Button>
        </Link>
        <h1 className="text-2xl font-heading font-bold">{t('createOpportunity')}</h1>
      </div>
      <OpportunityForm locale={locale} stages={stages} defaultStageId={sp.stage} />
    </div>
  )
}
