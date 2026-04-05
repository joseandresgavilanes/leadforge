import { getTranslations } from 'next-intl/server'
import { getLeads } from '@/features/leads/actions'
import { formatRelative, formatCurrency } from '@/lib/utils'
import { scoreToLabel } from '@/lib/utils'
import { Badge } from '@/components/ui/data-display'
import { Button } from '@/components/ui/button'
import { Plus, Search } from 'lucide-react'
import Link from 'next/link'

export default async function LeadsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ status?: string; source?: string; search?: string; page?: string }>
}) {
  const { locale } = await params
  const sp = await searchParams
  const t = await getTranslations('leads')
  const tc = await getTranslations('common')

  const page = parseInt(sp.page ?? '1', 10)
  const { data: leads, total, totalPages } = await getLeads(
    { status: sp.status as any, source: sp.source, search: sp.search },
    page
  )

  const base = `/${locale}/app`

  const statusColors: Record<string, any> = {
    new: 'info',
    contacted: 'warning',
    qualified: 'success',
    unqualified: 'secondary',
    converted: 'default',
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold">{t('title')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {total} {total === 1 ? t('singular') : t('plural')}
          </p>
        </div>
        <Link href={`${base}/leads/new`}>
          <Button>
            <Plus className="h-4 w-4" />
            {t('createLead')}
          </Button>
        </Link>
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-2">
        <form method="get" className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              name="search"
              defaultValue={sp.search}
              placeholder={tc('actions.search') + '...'}
              className="h-9 pl-9 pr-3 text-sm border rounded-md bg-background w-48 focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <select
            name="status"
            defaultValue={sp.status ?? ''}
            className="h-9 px-3 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">{t('filters.allStatuses')}</option>
            {Object.entries(t.raw('statuses') as Record<string, string>).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select
            name="source"
            defaultValue={sp.source ?? ''}
            className="h-9 px-3 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">{t('filters.allSources')}</option>
            {Object.entries(t.raw('sources') as Record<string, string>).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <Button type="submit" variant="secondary" size="sm">{tc('actions.filter')}</Button>
          {(sp.search || sp.status || sp.source) && (
            <Link href={`${base}/leads`}>
              <Button variant="ghost" size="sm">{tc('actions.clear')}</Button>
            </Link>
          )}
        </form>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('fields.firstName')} / {t('fields.company')}</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">{t('fields.source')}</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('fields.status')}</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">{t('fields.score')}</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden xl:table-cell">{t('fields.createdAt')}</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">{tc('actions.view')}</th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted-foreground">
                    {t('empty.title')}
                    <br />
                    <span className="text-xs">{t('empty.description')}</span>
                  </td>
                </tr>
              ) : (
                leads.map((lead) => {
                  const scoreLabel = scoreToLabel(lead.score)
                  const scoreVariant = { hot: 'hot', warm: 'warm', cold: 'cold' }[scoreLabel] as any
                  return (
                    <tr key={lead.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{lead.first_name} {lead.last_name}</p>
                          {lead.company && <p className="text-xs text-muted-foreground">{lead.company}</p>}
                          {lead.email && <p className="text-xs text-muted-foreground">{lead.email}</p>}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {lead.source ? (
                          <span className="text-sm text-muted-foreground capitalize">{lead.source.replace('_', ' ')}</span>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusColors[lead.status] ?? 'secondary'} className="capitalize">
                          {lead.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full ${scoreLabel === 'hot' ? 'bg-red-500' : scoreLabel === 'warm' ? 'bg-orange-400' : 'bg-blue-400'}`}
                              style={{ width: `${lead.score}%` }}
                            />
                          </div>
                          <Badge variant={scoreVariant} className="text-xs">{lead.score}</Badge>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell text-muted-foreground text-xs">
                        {formatRelative(lead.created_at, locale)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`${base}/leads/${lead.id}`}>
                          <Button variant="ghost" size="sm">{tc('actions.view')}</Button>
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages} · {total} total
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link href={`${base}/leads?page=${page - 1}&${new URLSearchParams({ ...sp, page: '' })}`}>
                  <Button variant="outline" size="sm">{tc('actions.previous')}</Button>
                </Link>
              )}
              {page < totalPages && (
                <Link href={`${base}/leads?page=${page + 1}&${new URLSearchParams({ ...sp, page: '' })}`}>
                  <Button variant="outline" size="sm">{tc('actions.next')}</Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
