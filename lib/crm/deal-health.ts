import type { OpportunityStage } from '@/types'

export type DealHealthLevel = 'healthy' | 'at_risk' | 'critical'

export type DealHealthInsight = {
  level: DealHealthLevel
  reasons: string[]
  daysInStage: number
  closeDatePast: boolean
  missingNextStep: boolean
  staleActivity: boolean
}

const DAY = 86400000

export function computeDealHealth(input: {
  updatedAt: string
  stageEnteredAt: string
  closeDate: string | null
  nextAction: string | null
  value: number
  stage: Pick<OpportunityStage, 'is_closed_won' | 'is_closed_lost'>
}): DealHealthInsight {
  if (input.stage.is_closed_won || input.stage.is_closed_lost) {
    return {
      level: 'healthy',
      reasons: [],
      daysInStage: 0,
      closeDatePast: false,
      missingNextStep: false,
      staleActivity: false,
    }
  }

  const now = Date.now()
  const stageEntered = new Date(input.stageEnteredAt).getTime()
  const daysInStage = Math.floor((now - stageEntered) / DAY)
  const lastTouch = new Date(input.updatedAt).getTime()
  const daysSinceTouch = Math.floor((now - lastTouch) / DAY)

  const closeDatePast = input.closeDate
    ? new Date(input.closeDate).getTime() < now
    : false

  const missingNextStep = !input.nextAction?.trim()

  const staleActivity = daysSinceTouch > 10 || daysInStage > 21

  const reasons: string[] = []
  if (closeDatePast) reasons.push('closeDatePast')
  if (missingNextStep) reasons.push('missingNextStep')
  if (daysInStage > 21) reasons.push('longStage')
  if (daysSinceTouch > 10) reasons.push('staleTouch')
  if (input.value >= 50000 && daysSinceTouch > 7) reasons.push('highValueStale')

  let level: DealHealthLevel = 'healthy'
  if (reasons.length >= 2 || closeDatePast || (missingNextStep && daysSinceTouch > 7)) {
    level = 'critical'
  } else if (reasons.length >= 1) {
    level = 'at_risk'
  }

  return {
    level,
    reasons,
    daysInStage,
    closeDatePast,
    missingNextStep,
    staleActivity,
  }
}
