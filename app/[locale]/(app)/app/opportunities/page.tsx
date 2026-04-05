import { getTranslations } from 'next-intl/server'
import { getOpportunities, getPipelineStages } from '@/features/opportunities/actions'
import { formatCurrency, formatRelative } from '@/lib/utils'
import { Badge } from '@/components/ui/data-display'
import { Button } from '@/components/ui/button'
import { Plus, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import type { OpportunityWithStage, OpportunityStage } from '@/types'

export default async function OpportunitiesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ view?: string; stage?: string; search?: string }>
}) {
  const { locale } = await params
  const sp = await searchParams
  const t = await getTranslations('opportunities')
  const tc = await getTranslations('common')

  const view = sp.view ?? 'kanban'
  const [{ data: opportunities }, stages] = await Promise.all([
    getOpportunities({ stageId: sp.stage, search: sp.search }),
    getPipelineStages(),
  ])

  const base = `/${locale}/app`

  const pipelineTotal = opportunities
    .filter((o) => !o.stage.is_closed_won && !o.stage.is_closed_lost)
    .reduce((sum, o) => sum + o.value, 0)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold">{t('title')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t('fields.value')}: <span className="font-semibold text-foreground">{formatCurrency(pipelineTotal)}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center border rounded-md overflow-hidden">
            <Link href={`${base}/opportunities?view=kanban`}>
              <button className={`px-3 py-1.5 text-sm transition-colors ${view === 'kanban' ? 'bg-primary text-white' : 'hover:bg-muted text-muted-foreground'}`}>
                {t('views.kanban')}
              </button>
            </Link>
            <Link href={`${base}/opportunities?view=table`}>
              <button className={`px-3 py-1.5 text-sm transition-colors ${view === 'table' ? 'bg-primary text-white' : 'hover:bg-muted text-muted-foreground'}`}>
                {t('views.table')}
              </button>
            </Link>
          </div>
          <Link href={`${base}/opportunities/new`}>
            <Button>
              <Plus className="h-4 w-4" />
              {t('createOpportunity')}
            </Button>
          </Link>
        </div>
      </div>

      {view === 'kanban' ? (
        <KanbanView opportunities={opportunities} stages={stages} locale={locale} t={t} tc={tc} base={base} />
      ) : (
        <TableView opportunities={opportunities} locale={locale} t={t} tc={tc} base={base} />
      )}
    </div>
  )
}

function KanbanView({ opportunities, stages, locale, t, tc, base }: {
  opportunities: OpportunityWithStage[]
  stages: OpportunityStage[]
  locale: string
  t: any
  tc: any
  base: string
}) {
  const oppsByStage = stages.reduce((acc, stage) => {
    acc[stage.id] = opportunities.filter((o) => o.stage_id === stage.id)
    return acc
  }, {} as Record<string, OpportunityWithStage[]>)

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {stages.map((stage) => {
        const stageOpps = oppsByStage[stage.id] ?? []
        const stageTotal = stageOpps.reduce((sum, o) => sum + o.value, 0)
        return (
          <div key={stage.id} className="flex-shrink-0 w-72">
            {/* Stage header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                <span className="text-sm font-semibold">{stage.name}</span>
                <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                  {stageOpps.length}
                </span>
              </div>
              <span className="text-xs text-muted-foreground font-medium">{formatCurrency(stageTotal)}</span>
            </div>

            {/* Cards */}
            <div className="space-y-2.5">
              {stageOpps.length === 0 ? (
                <div className="rounded-lg border-2 border-dashed border-border p-4 text-center">
                  <p className="text-xs text-muted-foreground">{t('empty.noStageDeals')}</p>
                </div>
              ) : (
                stageOpps.map((opp) => (
                  <Link key={opp.id} href={`${base}/opportunities/${opp.id}`}>
                    <div className="rounded-lg border bg-card p-3.5 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-sm font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                          {opp.name}
                        </p>
                        <Badge variant="outline" className="shrink-0 text-xs">
                          {opp.probability}%
                        </Badge>
                      </div>
                      <p className="text-base font-bold text-foreground">{formatCurrency(opp.value)}</p>
                      {opp.company && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">{opp.company.name}</p>
                      )}
                      {opp.close_date && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Close: {new Date(opp.close_date).toLocaleDateString(locale)}
                        </p>
                      )}
                      {opp.next_action && (
                        <p className="text-xs text-brand-accent mt-1.5 truncate">→ {opp.next_action}</p>
                      )}
                    </div>
                  </Link>
                ))
              )}
              <Link href={`${base}/opportunities/new?stage=${stage.id}`}>
                <button className="w-full rounded-lg border-2 border-dashed border-border/60 p-2 text-xs text-muted-foreground hover:border-primary/40 hover:text-primary transition-all flex items-center justify-center gap-1.5">
                  <Plus className="h-3 w-3" />
                  {t('createOpportunity')}
                </button>
              </Link>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function TableView({ opportunities, locale, t, tc, base }: {
  opportunities: OpportunityWithStage[]
  locale: string
  t: any
  tc: any
  base: string
}) {
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('fields.name')}</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('fields.stage')}</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">{t('fields.value')}</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">{t('fields.closeDate')}</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">{t('fields.probability')}</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">{tc('actions.view')}</th>
            </tr>
          </thead>
          <tbody>
            {opportunities.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-muted-foreground">
                  {t('empty.title')}
                </td>
              </tr>
            ) : (
              opportunities.map((opp) => (
                <tr key={opp.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium">{opp.name}</p>
                    {opp.company && <p className="text-xs text-muted-foreground">{opp.company.name}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: opp.stage.color }} />
                      <span className="text-sm">{opp.stage.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">{formatCurrency(opp.value)}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground text-xs">
                    {opp.close_date ? new Date(opp.close_date).toLocaleDateString(locale) : '—'}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${opp.probability}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{opp.probability}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`${base}/opportunities/${opp.id}`}>
                      <Button variant="ghost" size="sm">{tc('actions.view')}</Button>
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
