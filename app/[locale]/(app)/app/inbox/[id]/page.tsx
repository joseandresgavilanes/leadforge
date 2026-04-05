import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { getThread, listEmailTemplates } from '@/features/inbox/actions'
import { requireAuth, getActiveOrganization } from '@/lib/auth/server'
import { can } from '@/lib/rbac/permissions'
import type { OrgRole } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/data-display'
import { formatRelative } from '@/lib/utils'
import { LogThreadMessageForm } from '@/components/crm/log-thread-message-form'

export default async function InboxThreadPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  const [t, tc] = await Promise.all([getTranslations('workspace.inbox'), getTranslations('common')])
  const user = await requireAuth(locale)
  const orgData = await getActiveOrganization(user.id)
  if (!orgData) return null

  const canManage = can(orgData.membership.role as OrgRole, 'communications:manage')
  let data: Awaited<ReturnType<typeof getThread>> = null
  let templates: Awaited<ReturnType<typeof listEmailTemplates>> = []
  try {
    ;[data, templates] = await Promise.all([getThread(id), listEmailTemplates()])
  } catch {
    data = null
  }

  if (!data) notFound()

  const { thread, messages } = data
  const base = `/${locale}/app`

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href={`${base}/inbox`}>
            <Button variant="ghost" size="sm">
              {tc('actions.back')}
            </Button>
          </Link>
          <h1 className="mt-1 text-2xl font-heading font-bold">{thread.subject}</h1>
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
            {thread.lead_id && (
              <Link href={`${base}/leads/${thread.lead_id}`} className="underline-offset-2 hover:underline">
                {t('leadId')}: {thread.lead_id.slice(0, 8)}…
              </Link>
            )}
            {thread.contact_id && (
              <Link href={`${base}/contacts/${thread.contact_id}`} className="underline-offset-2 hover:underline">
                {t('contactId')}: {thread.contact_id.slice(0, 8)}…
              </Link>
            )}
            {thread.company_id && (
              <Link href={`${base}/companies/${thread.company_id}`} className="underline-offset-2 hover:underline">
                {t('companyId')}: {thread.company_id.slice(0, 8)}…
              </Link>
            )}
            {thread.opportunity_id && (
              <Link href={`${base}/opportunities/${thread.opportunity_id}`} className="underline-offset-2 hover:underline">
                {t('opportunityId')}: {thread.opportunity_id.slice(0, 8)}…
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('empty')}</p>
        ) : (
          <ul className="space-y-3">
            {messages.map((m) => (
              <li key={m.id} className="rounded-lg border bg-card p-4">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{m.direction}</Badge>
                  <Badge variant="secondary">{m.channel}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatRelative(m.logged_at, locale)}
                  </span>
                </div>
                {m.subject && <p className="text-sm font-medium">{m.subject}</p>}
                <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{m.body}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {canManage && <LogThreadMessageForm threadId={id} templates={templates} />}
    </div>
  )
}
