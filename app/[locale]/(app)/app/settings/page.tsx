import { getTranslations } from 'next-intl/server'
import { requireAuth, getActiveOrganization } from '@/lib/auth/server'
import { getPipelineStages } from '@/features/opportunities/actions'
import { can } from '@/lib/rbac/permissions'
import type { OrgRole } from '@/types'
import { OrgSettingsForm } from '@/components/settings/org-settings-form'
import { AddPipelineStageForm } from '@/components/settings/add-pipeline-stage-form'

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const user = await requireAuth(locale)
  const orgData = await getActiveOrganization(user.id)
  const t = await getTranslations('settings')
  if (!orgData) return null

  const stages = await getPipelineStages()
  const role = orgData.membership.role as OrgRole
  const showPipeline = can(role, 'pipeline:configure')

  return (
    <div className="space-y-10 max-w-4xl">
      <h1 className="text-2xl font-heading font-bold">{t('title')}</h1>
      <OrgSettingsForm organization={orgData.organization} />

      <div className="space-y-4">
        <h2 className="font-heading font-semibold text-lg">{t('sections.pipeline')}</h2>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          {stages.map((s) => (
            <li key={s.id} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
              {s.name} — {s.probability}%
            </li>
          ))}
        </ol>
        {showPipeline && <AddPipelineStageForm nextPosition={stages.length} />}
      </div>
    </div>
  )
}
