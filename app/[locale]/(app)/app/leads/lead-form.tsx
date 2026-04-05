'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { leadSchema, type LeadInput } from '@/lib/validators/schemas'
import { createLead, updateLead } from '@/features/leads/actions'
import { Input, Label } from '@/components/ui/form-elements'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import type { LeadWithOwner } from '@/types'

export default function LeadForm({
  locale,
  lead,
}: {
  locale: string
  lead?: LeadWithOwner
}) {
  const t = useTranslations('leads')
  const tc = useTranslations('common')
  const router = useRouter()
  const isEdit = Boolean(lead)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LeadInput>({
    resolver: zodResolver(leadSchema),
    defaultValues: lead
      ? {
          firstName: lead.first_name,
          lastName: lead.last_name ?? '',
          email: lead.email ?? '',
          phone: lead.phone ?? '',
          company: lead.company ?? '',
          jobTitle: lead.job_title ?? '',
          source: lead.source ?? '',
          status: lead.status as LeadInput['status'],
          score: lead.score,
          tags: lead.tags ?? [],
          notes: lead.notes ?? '',
          website: lead.website ?? '',
          industry: lead.industry ?? '',
          budget: lead.budget ?? undefined,
        }
      : { status: 'new', score: 50, tags: [] },
  })

  async function onSubmit(data: LeadInput) {
    if (isEdit && lead) {
      const res = await updateLead(lead.id, data)
      if (!res.success) {
        toast({ title: res.error ?? tc('errors.generic'), variant: 'destructive' })
        return
      }
      toast({ title: tc('toast.updated', { entity: t('singular') }) })
      router.refresh()
      return
    }

    const res = await createLead(data)
    if (!res.success) {
      toast({ title: res.error ?? tc('errors.generic'), variant: 'destructive' })
      return
    }
    if (!res.data) {
      toast({ title: tc('errors.generic'), variant: 'destructive' })
      return
    }
    toast({ title: tc('toast.created', { entity: t('singular') }) })
    router.push(`/${locale}/app/leads/${res.data.id}`)
    router.refresh()
  }

  const sources = t.raw('sources') as Record<string, string>
  const statuses = t.raw('statuses') as Record<string, string>

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-lg border bg-card p-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="firstName">{t('fields.firstName')}</Label>
          <Input id="firstName" {...register('firstName')} />
          {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lastName">{t('fields.lastName')}</Label>
          <Input id="lastName" {...register('lastName')} />
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">{t('fields.email')}</Label>
          <Input id="email" type="email" {...register('email')} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">{t('fields.phone')}</Label>
          <Input id="phone" {...register('phone')} />
        </div>
      </div>
      {errors.email?.message && (
        <p className="text-xs text-destructive">
          {errors.email.message === 'emailOrPhone' ? t('validation.emailOrPhone') : errors.email.message}
        </p>
      )}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="company">{t('fields.company')}</Label>
          <Input id="company" {...register('company')} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="jobTitle">{t('fields.jobTitle')}</Label>
          <Input id="jobTitle" {...register('jobTitle')} />
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="source">{t('fields.source')}</Label>
          <select id="source" className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" {...register('source')}>
            <option value="">—</option>
            {Object.entries(sources).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="status">{t('fields.status')}</Label>
          <select id="status" className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" {...register('status')}>
            {Object.entries(statuses).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="score">{t('fields.score')}</Label>
          <Input id="score" type="number" min={0} max={100} {...register('score', { valueAsNumber: true })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="website">{t('fields.website')}</Label>
          <Input id="website" {...register('website')} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="notes">{t('fields.notes')}</Label>
        <textarea id="notes" className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...register('notes')} />
      </div>
      <Button type="submit" loading={isSubmitting}>{isEdit ? tc('actions.update') : tc('actions.create')}</Button>
    </form>
  )
}
