'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { moveOpportunityStage } from '@/features/opportunities/actions'
import type { OpportunityStage } from '@/types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialogs'
import { toast } from '@/hooks/use-toast'

type Pending =
  | {
      nextId: string
      target: OpportunityStage
      previous: OpportunityStage
      mode: 'lost' | 'won' | 'regression'
    }
  | null

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
  const t = useTranslations('opportunities.stageMove')
  const tc = useTranslations('common')
  const router = useRouter()
  const [pending, setPending] = useState<Pending>(null)
  const [lostReason, setLostReason] = useState('')
  const [competitor, setCompetitor] = useState('')
  const [closeNotes, setCloseNotes] = useState('')
  const [regressionReason, setRegressionReason] = useState('')
  const [loading, setLoading] = useState(false)

  function resetFields() {
    setLostReason('')
    setCompetitor('')
    setCloseNotes('')
    setRegressionReason('')
  }

  async function submitMove(
    nextId: string,
    previous: OpportunityStage,
    target: OpportunityStage,
    extra: {
      lostReason?: string | null
      competitor?: string | null
      closeNotes?: string | null
      regressionReason?: string | null
    }
  ) {
    setLoading(true)
    const res = await moveOpportunityStage({
      opportunityId,
      stageId: nextId,
      previousStageId: previous.id,
      lostReason: extra.lostReason,
      competitor: extra.competitor,
      closeNotes: extra.closeNotes,
      regressionReason: extra.regressionReason,
    })
    setLoading(false)
    setPending(null)
    resetFields()
    if (!res.success) {
      toast({ title: res.error ?? tc('errors.generic'), variant: 'destructive' })
      return
    }
    toast({ title: t('success') })
    router.refresh()
  }

  function onSelectChange(nextId: string) {
    if (nextId === currentStageId) return
    const target = stages.find((s) => s.id === nextId)
    const previous = stages.find((s) => s.id === currentStageId)
    if (!target || !previous) return

    const wasClosed = previous.is_closed_won || previous.is_closed_lost
    const movingToOpen = !target.is_closed_won && !target.is_closed_lost

    if (target.is_closed_lost || (wasClosed && movingToOpen) || target.is_closed_won) {
      const mode = target.is_closed_lost ? 'lost' : wasClosed && movingToOpen ? 'regression' : 'won'
      setPending({ nextId, target, previous, mode })
      resetFields()
      return
    }

    void submitMove(nextId, previous, target, {})
  }

  function onConfirmDialog() {
    if (!pending) return
    const { nextId, target, previous, mode } = pending
    if (mode === 'lost') {
      void submitMove(nextId, previous, target, {
        lostReason,
        competitor: competitor || null,
        closeNotes: closeNotes || null,
      })
      return
    }
    if (mode === 'regression') {
      void submitMove(nextId, previous, target, { regressionReason })
      return
    }
    void submitMove(nextId, previous, target, { closeNotes: closeNotes || null })
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <label htmlFor="opp-stage-mover" className="text-sm text-muted-foreground whitespace-nowrap">
          {t('field')}
        </label>
        <select
          id="opp-stage-mover"
          className="flex h-9 rounded-md border border-input bg-background px-3 text-sm min-w-[180px]"
          value={currentStageId}
          onChange={(e) => onSelectChange(e.target.value)}
        >
          {stages.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <Dialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pending?.mode === 'lost'
                ? t('lostTitle')
                : pending?.mode === 'regression'
                  ? t('regressionTitle')
                  : t('wonTitle')}
            </DialogTitle>
            <DialogDescription>
              {pending?.mode === 'lost'
                ? t('lostDescription')
                : pending?.mode === 'regression'
                  ? t('regressionDescription')
                  : t('wonDescription')}
            </DialogDescription>
          </DialogHeader>

          {pending?.mode === 'lost' && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">{t('lostReason')}</label>
                <textarea
                  className="w-full min-h-[72px] rounded-md border bg-background px-3 py-2 text-sm"
                  value={lostReason}
                  onChange={(e) => setLostReason(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">{t('competitor')}</label>
                <input
                  className="flex h-9 w-full rounded-md border px-3 text-sm"
                  value={competitor}
                  onChange={(e) => setCompetitor(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">{t('closeNotes')}</label>
                <textarea
                  className="w-full min-h-[56px] rounded-md border bg-background px-3 py-2 text-sm"
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                />
              </div>
            </div>
          )}

          {pending?.mode === 'regression' && (
            <div className="space-y-1">
              <label className="text-xs font-medium">{t('regressionReason')}</label>
              <textarea
                className="w-full min-h-[72px] rounded-md border bg-background px-3 py-2 text-sm"
                value={regressionReason}
                onChange={(e) => setRegressionReason(e.target.value)}
              />
            </div>
          )}

          {pending?.mode === 'won' && (
            <div className="space-y-1">
              <label className="text-xs font-medium">{t('closeNotes')}</label>
              <textarea
                className="w-full min-h-[56px] rounded-md border bg-background px-3 py-2 text-sm"
                value={closeNotes}
                onChange={(e) => setCloseNotes(e.target.value)}
              />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPending(null)}>
              {tc('actions.cancel')}
            </Button>
            <Button
              type="button"
              loading={loading}
              onClick={onConfirmDialog}
              disabled={
                pending?.mode === 'lost'
                  ? !lostReason.trim()
                  : pending?.mode === 'regression'
                    ? !regressionReason.trim()
                    : false
              }
            >
              {tc('actions.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
