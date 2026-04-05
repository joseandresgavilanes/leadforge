'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { moveOpportunityStage } from '@/features/opportunities/actions'
import type { OpportunityStage } from '@/types'

export default function OpportunityStageMover({
  locale: _locale,
  opportunityId,
  currentStageId,
  stages,
}: {
  locale: string
  opportunityId: string
  currentStageId: string
  stages: OpportunityStage[]
}) {
  const t = useTranslations('opportunities')
  const router = useRouter()

  async function onChange(stageId: string) {
    if (stageId === currentStageId) return
    await moveOpportunityStage(opportunityId, stageId, currentStageId)
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="opp-stage-mover" className="text-sm text-muted-foreground whitespace-nowrap">
        {t('fields.stage')}
      </label>
      <select
        id="opp-stage-mover"
        className="flex h-9 rounded-md border border-input bg-background px-3 text-sm min-w-[180px]"
        value={currentStageId}
        onChange={(e) => onChange(e.target.value)}
      >
        {stages.map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
    </div>
  )
}
