import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { getOpportunityById, getPipelineStages } from '@/features/opportunities/actions'
import { formatCurrency } from '@/lib/utils'
import { computeDealHealth } from '@/lib/crm/deal-health'
import { Badge } from '@/components/ui/data-display'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/data-display'
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
  const [opp, stages, t, tc, tw] = await Promise.all([
    getOpportunityById(id),
    getPipelineStages(),
    getTranslations('opportunities'),
    getTranslations('common'),
    getTranslations('workspace'),
  ])

  if (!opp) notFound()

  const stageEnteredAt = opp.stage_entered_at ?? opp.created_at ?? opp.updated_at
  const dealHealth = computeDealHealth({
    updatedAt: opp.updated_at,
    stageEnteredAt,
    closeDate: opp.close_date,
    nextAction: opp.next_action,
    value: opp.value ?? 0,
    stage: opp.stage,
  })
  const healthVariant =
    dealHealth.level === 'critical' ? 'destructive' : dealHealth.level === 'at_risk' ? 'warning' : 'success'

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
            <Badge variant={healthVariant}>{tw(`governance.levels.${dealHealth.level}`)}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">{tw('governance.daysInStage', { days: dealHealth.daysInStage })}</p>
        </div>
        <OpportunityStageMover
          locale={locale}
          opportunityId={opp.id}
          currentStageId={opp.stage_id}
          stages={stages}
        />
      </div>

      {!opp.stage.is_closed_won && !opp.stage.is_closed_lost && dealHealth.reasons.length > 0 && (
        <Card className="border-brand-warning/40 bg-brand-warning/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{tw('governance.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {dealHealth.reasons.map((r) => (
                <li key={r}>
                  {tw(`governance.reasons.${r as 'closeDatePast' | 'missingNextStep' | 'longStage' | 'staleTouch' | 'highValueStale'}`)}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

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
