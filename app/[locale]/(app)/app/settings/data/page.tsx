import { getTranslations } from 'next-intl/server'
import { requireAuth, getActiveOrganization } from '@/lib/auth/server'
import { can } from '@/lib/rbac/permissions'
import type { OrgRole } from '@/types'
import { DataHygieneClient } from './data-hygiene-client'

export default async function DataHygienePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const user = await requireAuth(locale)
  const orgData = await getActiveOrganization(user.id)
  const t = await getTranslations('dataHygiene')

  if (!orgData) return null

  const role = orgData.membership.role as OrgRole
  const canImport = can(role, 'data:import')
  const canMerge = can(role, 'data:merge')

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-heading font-bold">{t('title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('subtitle')}</p>
      </div>
      <DataHygieneClient locale={locale} canImport={canImport} canMerge={canMerge} />
    </div>
  )
}
