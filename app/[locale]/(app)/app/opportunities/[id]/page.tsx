import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { getOpportunityById, getPipelineStages } from '@/features/opportunities/actions'
import { formatCurrency } from '@/lib/utils'
import { Badge } from '@/components/ui/data-display'
import { Button } from '@/components/ui/button'
import OpportunityForm from '../opportunity-form'
import OpportunityStageMover from './opportunity-stage-mover'
import OpportunityAiPanel from './opportunity-ai-panel'
import { EntityTimeline } from '@/components/crm/entity-timeline'

export default async function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  const [opp, stages, t, tc] = await Promise.all([
    getOpportunityById(id),
    getPipelineStages(),
    getTranslations('opportunities'),
    getTranslations('common'),
  ])

  if (!opp) notFound()

  const daysSince =
    (Date.now() - new Date(opp.updated_at).getTime()) / (1000 * 60 * 60 * 24)
  const healthKey = daysSince > 14 ? 'stale' : daysSince > 7 ? 'atRisk' : 'healthy'

  const aiContext = {
    name: opp.name,
    value: opp.value,
    stage: opp.stage.name,
    probability: opp.probability,
    closeDate: opp.close_date,
    nextAction: opp.next_action,
    notes: opp.notes,
    company: opp.company?.name,
    contact: opp.contact ? `${opp.contact.first_name} ${opp.contact.last_name ?? ''}` : null,
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-2">
          <Link href={`/${locale}/app/opportunities`}>
            <Button variant="ghost" size="sm">{tc('actions.back')}</Button>
          </Link>
          <h1 className="text-2xl font-heading font-bold">{opp.name}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg font-semibold">{formatCurrency(opp.value)}</span>
            <Badge variant="outline">{opp.stage.name}</Badge>
            <Badge variant="secondary">{t(`health.${healthKey}`)}</Badge>
          </div>
        </div>
        <OpportunityStageMover
          locale={locale}
          opportunityId={opp.id}
          currentStageId={opp.stage_id}
          stages={stages}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">{t('editOpportunity')}</h2>
          <OpportunityForm locale={locale} stages={stages} opportunity={opp} />
        </div>
        <OpportunityAiPanel context={aiContext} />
      </div>

      <EntityTimeline entity="opportunity" entityId={id} locale={locale} />
    </div>
  )
}
