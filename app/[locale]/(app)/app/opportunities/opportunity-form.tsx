'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { opportunitySchema, type OpportunityInput } from '@/lib/validators/schemas'
import { createOpportunity, updateOpportunity } from '@/features/opportunities/actions'
import { Input, Label } from '@/components/ui/form-elements'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import type { OpportunityStage, OpportunityWithStage } from '@/types'

export default function OpportunityForm({
  locale,
  stages,
  opportunity,
  defaultStageId,
}: {
  locale: string
  stages: OpportunityStage[]
  opportunity?: OpportunityWithStage | null
  defaultStageId?: string
}) {
  const t = useTranslations('opportunities')
  const tc = useTranslations('common')
  const router = useRouter()
  const isEdit = Boolean(opportunity)

  const firstOpen =
    stages.find((s) => !s.is_closed_won && !s.is_closed_lost)?.id ?? stages[0]?.id

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<OpportunityInput>({
    resolver: zodResolver(opportunitySchema),
    defaultValues: opportunity
      ? {
          name: opportunity.name,
          value: opportunity.value,
          stageId: opportunity.stage_id,
          probability: opportunity.probability,
          closeDate: opportunity.close_date ?? undefined,
          contactId: opportunity.contact_id ?? undefined,
          companyId: opportunity.company_id ?? undefined,
          source: opportunity.source ?? '',
          nextAction: opportunity.next_action ?? '',
          notes: opportunity.notes ?? '',
        }
      : {
          name: '',
          value: 0,
          stageId: defaultStageId ?? firstOpen ?? '',
          probability: 50,
        },
  })

  async function onSubmit(data: OpportunityInput) {
    if (isEdit && opportunity) {
      const res = await updateOpportunity(opportunity.id, data)
      if (!res.success) {
        toast({ title: res.error ?? tc('errors.generic'), variant: 'destructive' })
        return
      }
      toast({ title: tc('toast.updated', { entity: t('singular') }) })
      router.refresh()
      return
    }
    const res = await createOpportunity(data)
    if (!res.success) {
      toast({ title: res.error ?? tc('errors.generic'), variant: 'destructive' })
      return
    }
    if (!res.data) {
      toast({ title: tc('errors.generic'), variant: 'destructive' })
      return
    }
    toast({ title: tc('toast.created', { entity: t('singular') }) })
    router.push(`/${locale}/app/opportunities/${res.data.id}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-lg border bg-card p-6 max-w-xl">
      <div className="space-y-1.5">
        <Label htmlFor="name">{t('fields.name')}</Label>
        <Input id="name" {...register('name')} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="value">{t('fields.value')}</Label>
          <Input id="value" type="number" step="0.01" {...register('value', { valueAsNumber: true })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="probability">{t('fields.probability')}</Label>
          <Input id="probability" type="number" min={0} max={100} {...register('probability', { valueAsNumber: true })} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="stageId">{t('fields.stage')}</Label>
        <select id="stageId" className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" {...register('stageId')}>
          {stages.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="closeDate">{t('fields.closeDate')}</Label>
        <Input id="closeDate" type="date" {...register('closeDate')} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="nextAction">{t('fields.nextAction')}</Label>
        <Input id="nextAction" {...register('nextAction')} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="notes">{t('fields.notes')}</Label>
        <textarea id="notes" className="flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm" {...register('notes')} />
      </div>
      <Button type="submit" loading={isSubmitting}>{isEdit ? tc('actions.update') : tc('actions.create')}</Button>
    </form>
  )
}
