import { getTranslations } from 'next-intl/server'
import {
  getDashboardStats,
  getOverdueTasks,
  getTasksDueToday,
  getStaleOpportunities,
  getRecentActivities,
} from '@/features/analytics/dashboard'
import { formatCurrency, formatRelative } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/data-display'
import { Badge } from '@/components/ui/data-display'
import { Button } from '@/components/ui/button'
import { TrendingUp, TrendingDown, DollarSign, Target, AlertCircle, Plus, Zap, CheckSquare, Activity, CalendarClock } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations('dashboard')
  const tc = await getTranslations('common')

  const [stats, overdueTasks, dueTodayTasks, staleOpps, recentActivities] = await Promise.all([
    getDashboardStats(),
    getOverdueTasks(5),
    getTasksDueToday(6),
    getStaleOpportunities(14, 5),
    getRecentActivities(8),
  ])

  const base = `/${locale}/app`

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">{t('title')}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`${base}/leads/new`}>
            <Button size="sm">
              <Plus className="h-4 w-4" />
              {t('quickActions.newLead')}
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title={t('stats.newLeads')}
          value={stats.newLeads.toString()}
          sub={t('stats.thisMonth')}
          change={stats.newLeadsChange}
          icon={<Zap className="h-5 w-5 text-primary" />}
        />
        <StatCard
          title={t('stats.openOpportunities')}
          value={stats.openOpportunities.toString()}
          sub={t('stats.thisMonth')}
          icon={<Target className="h-5 w-5 text-primary" />}
        />
        <StatCard
          title={t('stats.pipelineValue')}
          value={formatCurrency(stats.pipelineValue)}
          sub={t('stats.thisMonth')}
          change={stats.pipelineChange}
          icon={<DollarSign className="h-5 w-5 text-primary" />}
        />
        <StatCard
          title={t('stats.monthlyForecast')}
          value={formatCurrency(stats.monthlyForecast)}
          sub={t('stats.thisMonth')}
          icon={<TrendingUp className="h-5 w-5 text-primary" />}
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Overdue Tasks */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                {t('widgets.overdueTasks')}
              </CardTitle>
              {overdueTasks.length > 0 && (
                <Badge variant="destructive">{overdueTasks.length}</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {overdueTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">{t('empty.noTasks')}</p>
            ) : (
              <ul className="space-y-2">
                {overdueTasks.map((task: any) => (
                  <li key={task.id} className="flex items-start gap-2 py-1.5 border-b last:border-0">
                    <CheckSquare className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{task.title}</p>
                      <p className="text-xs text-destructive">{tc('status.overdue')} · {formatRelative(task.due_date, locale)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <Link href={`${base}/tasks?filter=overdue`}>
              <Button variant="ghost" size="sm" className="w-full mt-3">
                {tc('actions.view')} {t('widgets.overdueTasks')}
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Due today */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-primary" />
                {t('widgets.tasksDueToday')}
              </CardTitle>
              {dueTodayTasks.length > 0 && (
                <Badge variant="secondary">{dueTodayTasks.length}</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {dueTodayTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">{t('empty.noTasksDueToday')}</p>
            ) : (
              <ul className="space-y-2">
                {dueTodayTasks.map((task: any) => (
                  <li key={task.id} className="flex items-start gap-2 py-1.5 border-b last:border-0">
                    <CheckSquare className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{task.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {task.due_date ? formatRelative(task.due_date, locale) : '—'}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <Link href={`${base}/tasks?filter=due_today`}>
              <Button variant="ghost" size="sm" className="w-full mt-3">
                {tc('actions.view')} {t('widgets.tasksDueToday')}
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Stale Deals */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-brand-warning" />
              {t('widgets.staleDeals')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {staleOpps.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">{t('empty.noStaleDeals')}</p>
            ) : (
              <ul className="space-y-2">
                {staleOpps.map((opp: any) => (
                  <li key={opp.id} className="flex items-start gap-2 py-1.5 border-b last:border-0">
                    <Target className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{opp.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(opp.value)} · {formatRelative(opp.updated_at, locale)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <Link href={`${base}/opportunities`}>
              <Button variant="ghost" size="sm" className="w-full mt-3">
                {tc('actions.view')} {t('widgets.staleDeals')}
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              {t('widgets.recentActivity')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivities.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">{t('empty.noActivity')}</p>
            ) : (
              <ul className="space-y-2">
                {recentActivities.map((act: any) => (
                  <li key={act.id} className="flex items-start gap-2 py-1.5 border-b last:border-0">
                    <Activity className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{act.subject}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {act.type} · {formatRelative(act.activity_date, locale)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <Link href={`${base}/activities`}>
              <Button variant="ghost" size="sm" className="w-full mt-3">
                {tc('actions.view')} {t('widgets.recentActivity')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('widgets.quickActions')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {[
              { label: t('quickActions.newLead'), href: `${base}/leads/new`, icon: Zap },
              { label: t('quickActions.newOpportunity'), href: `${base}/opportunities/new`, icon: Target },
              { label: t('quickActions.newTask'), href: `${base}/tasks/new`, icon: CheckSquare },
              { label: t('quickActions.newActivity'), href: `${base}/activities/new`, icon: Activity },
            ].map((action) => (
              <Link key={action.href} href={action.href}>
                <Button variant="outline" size="sm" className="gap-2">
                  <action.icon className="h-4 w-4" />
                  {action.label}
                </Button>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ title, value, sub, change, icon }: {
  title: string
  value: string
  sub: string
  change?: number
  icon: React.ReactNode
}) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-2xl font-heading font-bold mt-1">{value}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <p className="text-xs text-muted-foreground">{sub}</p>
              {change !== undefined && (
                <span className={`flex items-center text-xs font-medium ${change >= 0 ? 'text-brand-accent' : 'text-destructive'}`}>
                  {change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {Math.abs(change)}%
                </span>
              )}
            </div>
          </div>
          <div className="rounded-lg bg-primary/10 p-2.5">{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}
