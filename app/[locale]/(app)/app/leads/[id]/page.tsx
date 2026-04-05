import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { getLeadById } from '@/features/leads/actions'
import { getPipelineStages } from '@/features/opportunities/actions'
import { Badge } from '@/components/ui/data-display'
import { Button } from '@/components/ui/button'
import LeadForm from '../lead-form'
import ConvertLeadForm from './convert-lead-form'

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  const [lead, stages, t, tc] = await Promise.all([
    getLeadById(id),
    getPipelineStages(),
    getTranslations('leads'),
    getTranslations('common'),
  ])

  if (!lead) notFound()

  const statuses = t.raw('statuses') as Record<string, string>
  const statusLabel = statuses[lead.status] ?? lead.status

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href={`/${locale}/app/leads`}>
            <Button variant="ghost" size="sm">{tc('actions.back')}</Button>
          </Link>
          <div>
            <h1 className="text-2xl font-heading font-bold">
              {lead.first_name} {lead.last_name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline">{statusLabel}</Badge>
              {lead.company && <span className="text-sm text-muted-foreground">{lead.company}</span>}
            </div>
          </div>
        </div>
      </div>

      <LeadForm locale={locale} lead={lead} />

      {lead.status !== 'converted' && (
        <ConvertLeadForm locale={locale} leadId={lead.id} stages={stages} />
      )}
    </div>
  )
}
