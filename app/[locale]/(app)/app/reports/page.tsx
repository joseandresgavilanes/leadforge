import { getTranslations } from 'next-intl/server'
import { tryCreateClient } from '@/lib/db/server'
import { getDemoReportsRaw } from '@/lib/mock/demo-dataset'
import { requireAuth, getActiveOrganization } from '@/lib/auth/server'
import { PLAN_LIMITS } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/data-display'
import { BarChart3, Lock, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import ReportsCharts from './reports-charts'

export default async function ReportsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations('reports')
  const user = await requireAuth(locale)
  const orgData = await getActiveOrganization(user.id)
  if (!orgData) return null

  const org = orgData.organization
  const limits = PLAN_LIMITS[org.plan as keyof typeof PLAN_LIMITS]

  if (!limits.hasReports) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Lock className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-heading font-bold mb-2">{t('upgrade.title')}</h2>
        <p className="text-muted-foreground max-w-sm mb-6">{t('upgrade.description')}</p>
        <Link href={`/${locale}/app/billing`}>
          <Button>
            <ArrowUpRight className="h-4 w-4" />
            {t('upgrade.cta')}
          </Button>
        </Link>
      </div>
    )
  }

  const supabase = await tryCreateClient()

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  let leads: { source: string | null; status: string; created_at: string }[] = []
  let opportunities: {
    value: number | null
    probability: number | null
    stage_id: string
    close_date: string | null
    created_at: string
  }[] = []
  let stages: {
    id: string
    name: string
    color: string | null
    is_closed_won: boolean | null
    is_closed_lost: boolean | null
  }[] = []
  let activities: { type: string; created_by: string | null; created_at: string }[] = []

  if (supabase) {
    const [lr, or, sr, ar] = await Promise.all([
      supabase
        .from('leads')
        .select('source, status, created_at')
        .eq('organization_id', org.id)
        .gte('created_at', thirtyDaysAgo.toISOString()),
      supabase
        .from('opportunities')
        .select('value, probability, stage_id, close_date, created_at')
        .eq('organization_id', org.id),
      supabase.from('opportunity_stages').select('*').eq('organization_id', org.id).order('position'),
      supabase
        .from('activities')
        .select('type, created_by, created_at')
        .eq('organization_id', org.id)
        .gte('created_at', thirtyDaysAgo.toISOString()),
    ])
    leads = (lr.data ?? []) as typeof leads
    opportunities = (or.data ?? []) as typeof opportunities
    stages = (sr.data ?? []) as typeof stages
    activities = (ar.data ?? []) as typeof activities
  } else {
    const d = getDemoReportsRaw(org.id, thirtyDaysAgo)
    leads = d.leads
    opportunities = d.opportunities as typeof opportunities
    stages = d.stages as typeof stages
    activities = d.activities
  }

  // Aggregate leads by source
  const leadsBySource = (leads ?? []).reduce((acc: Record<string, number>, lead) => {
    const src = lead.source ?? 'other'
    acc[src] = (acc[src] ?? 0) + 1
    return acc
  }, {})

  // Aggregate pipeline by stage
  const pipelineByStage = (stages ?? []).map((stage) => {
    const stageOpps = (opportunities ?? []).filter((o) => o.stage_id === stage.id)
    return {
      name: stage.name,
      value: stageOpps.reduce((sum, o) => sum + (o.value ?? 0), 0),
      count: stageOpps.length,
      color: stage.color ?? '#64748b',
    }
  })

  // Forecast (weighted pipeline)
  const forecast = (opportunities ?? [])
    .filter((o) => {
      const stage = (stages ?? []).find((s) => s.id === o.stage_id)
      return !stage?.is_closed_won && !stage?.is_closed_lost
    })
    .reduce((sum, o) => sum + ((o.value ?? 0) * ((o.probability ?? 0) / 100)), 0)

  // Key metrics
  const totalLeads = leads?.length ?? 0
  const convertedLeads = (leads ?? []).filter((l) => l.status === 'converted').length
  const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0
  const openOpps = (opportunities ?? []).filter((o) => {
    const stage = (stages ?? []).find((s) => s.id === o.stage_id)
    return !stage?.is_closed_won && !stage?.is_closed_lost
  })
  const wonOpps = (opportunities ?? []).filter((o) => {
    const stage = (stages ?? []).find((s) => s.id === o.stage_id)
    return stage?.is_closed_won
  })
  const pipelineValue = openOpps.reduce((sum, o) => sum + (o.value ?? 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">{t('title')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t('subtitle')}</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t('metrics.totalLeads'), value: totalLeads },
          { label: t('metrics.conversionRate'), value: `${conversionRate}%` },
          { label: t('metrics.pipelineValue'), value: `$${pipelineValue.toLocaleString()}` },
          { label: t('metrics.wonDeals'), value: wonOpps.length },
        ].map((m) => (
          <Card key={m.label}>
            <CardContent className="pt-5">
              <p className="text-sm text-muted-foreground">{m.label}</p>
              <p className="text-2xl font-heading font-bold mt-1">{m.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <ReportsCharts leadsBySource={leadsBySource} pipelineByStage={pipelineByStage} forecast={forecast} />
    </div>
  )
}
