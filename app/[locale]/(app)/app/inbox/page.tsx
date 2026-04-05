import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { requireAuth, getActiveOrganization } from '@/lib/auth/server'
import { listThreads } from '@/features/inbox/actions'
import { can } from '@/lib/rbac/permissions'
import type { OrgRole } from '@/types'
import { Button } from '@/components/ui/button'
import { formatRelative } from '@/lib/utils'
import { Mail, Plus } from 'lucide-react'

export default async function InboxPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const [t, tc] = await Promise.all([getTranslations('workspace.inbox'), getTranslations('common')])
  const user = await requireAuth(locale)
  const orgData = await getActiveOrganization(user.id)
  if (!orgData) return null

  const canManage = can(orgData.membership.role as OrgRole, 'communications:manage')
  let threads: Awaited<ReturnType<typeof listThreads>> = []
  try {
    threads = await listThreads(60)
  } catch {
    threads = []
  }

  const base = `/${locale}/app`

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>
        {canManage && (
          <Link href={`${base}/inbox/new`}>
            <Button>
              <Plus className="h-4 w-4" />
              {t('newThread')}
            </Button>
          </Link>
        )}
      </div>

      <div className="rounded-lg border bg-card">
        {threads.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">{t('empty')}</p>
        ) : (
          <ul className="divide-y">
            {threads.map((th) => (
              <li key={th.id}>
                <Link
                  href={`${base}/inbox/${th.id}`}
                  className="flex items-start gap-3 p-4 transition-colors hover:bg-muted/40"
                >
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{th.subject}</p>
                    <p className="text-xs text-muted-foreground">
                      {th.last_message_at ? formatRelative(th.last_message_at, locale) : '—'}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">{tc('actions.view')}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
