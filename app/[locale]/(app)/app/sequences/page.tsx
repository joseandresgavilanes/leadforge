import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { requireAuth, getActiveOrganization } from '@/lib/auth/server'
import { listSequences } from '@/features/sequences/actions'
import { can } from '@/lib/rbac/permissions'
import type { OrgRole } from '@/types'
import { Button } from '@/components/ui/button'
import { ListOrdered, Plus } from 'lucide-react'

export default async function SequencesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations('workspace.sequences')
  const tc = await getTranslations('common')
  const user = await requireAuth(locale)
  const orgData = await getActiveOrganization(user.id)
  if (!orgData) return null

  const canManage = can(orgData.membership.role as OrgRole, 'sequences:manage')
  let sequences: Awaited<ReturnType<typeof listSequences>> = []
  try {
    sequences = await listSequences()
  } catch {
    sequences = []
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
          <Link href={`${base}/sequences/new`}>
            <Button>
              <Plus className="h-4 w-4" />
              {t('new')}
            </Button>
          </Link>
        )}
      </div>

      <div className="rounded-lg border bg-card">
        {sequences.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">{t('emptyList')}</p>
        ) : (
          <ul className="divide-y">
            {sequences.map((seq) => (
              <li key={seq.id}>
                <Link
                  href={`${base}/sequences/${seq.id}`}
                  className="flex items-start gap-3 p-4 transition-colors hover:bg-muted/40"
                >
                  <ListOrdered className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{seq.name}</p>
                    {seq.description && <p className="text-sm text-muted-foreground">{seq.description}</p>}
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
