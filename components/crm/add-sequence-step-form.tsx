'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { addSequenceStep } from '@/features/sequences/actions'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'

export function AddSequenceStepForm({
  sequenceId,
  position,
}: {
  sequenceId: string
  position: number
}) {
  const t = useTranslations('workspace.sequences')
  const tc = useTranslations('common')
  const router = useRouter()
  const [pending, start] = useTransition()
  const [stepType, setStepType] = useState<'email' | 'task' | 'wait'>('task')

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    start(async () => {
      const base = { sequenceId, position, stepType }
      let res
      if (stepType === 'email') {
        res = await addSequenceStep({
          ...base,
          emailSubject: String(fd.get('emailSubject') ?? '').trim() || null,
          emailBody: String(fd.get('emailBody') ?? '').trim() || null,
        })
      } else if (stepType === 'task') {
        res = await addSequenceStep({
          ...base,
          taskTitle: String(fd.get('taskTitle') ?? '').trim() || null,
          taskDueDays: Number(fd.get('taskDueDays') ?? 1) || 1,
        })
      } else {
        res = await addSequenceStep({
          ...base,
          waitHours: Math.max(1, Number(fd.get('waitHours') ?? 24) || 24),
        })
      }
      if (!res.success) {
        toast({ title: res.error ?? tc('errors.generic'), variant: 'destructive' })
        return
      }
      toast({ title: tc('toast.created', { entity: t('steps') }) })
      e.currentTarget.reset()
      router.refresh()
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-lg border bg-muted/20 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold">{t('addStep')}</span>
        <select
          value={stepType}
          onChange={(e) => setStepType(e.target.value as typeof stepType)}
          className="h-8 rounded-md border px-2 text-xs"
        >
          <option value="email">{t('email')}</option>
          <option value="task">{t('task')}</option>
          <option value="wait">{t('wait')}</option>
        </select>
      </div>
      {stepType === 'email' && (
        <>
          <input name="emailSubject" placeholder={t('emailSubject')} className="flex h-9 w-full rounded-md border px-3 text-sm" />
          <textarea name="emailBody" placeholder={t('emailBody')} rows={3} className="w-full rounded-md border px-3 py-2 text-sm" />
        </>
      )}
      {stepType === 'task' && (
        <>
          <input name="taskTitle" required placeholder={t('taskTitle')} className="flex h-9 w-full rounded-md border px-3 text-sm" />
          <input
            name="taskDueDays"
            type="number"
            min={0}
            defaultValue={1}
            className="flex h-9 max-w-[10rem] rounded-md border px-3 text-sm"
          />
          <p className="text-xs text-muted-foreground">{t('taskDueDays')}</p>
        </>
      )}
      {stepType === 'wait' && (
        <>
          <input name="waitHours" type="number" min={1} defaultValue={24} className="flex h-9 max-w-[10rem] rounded-md border px-3 text-sm" />
          <p className="text-xs text-muted-foreground">{t('waitHours')}</p>
        </>
      )}
      <Button type="submit" size="sm" loading={pending}>
        {t('addStep')}
      </Button>
    </form>
  )
}
