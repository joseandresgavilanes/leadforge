'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { activitySchema, type ActivityInput } from '@/lib/validators/schemas'
import { createActivity } from '@/features/tasks/actions'
import { Input, Label } from '@/components/ui/form-elements'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'

export default function ActivityForm({ locale }: { locale: string }) {
  const t = useTranslations('activities')
  const tc = useTranslations('common')
  const router = useRouter()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ActivityInput>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      type: 'call',
      activityDate: new Date().toISOString().slice(0, 16),
    },
  })

  async function onSubmit(data: ActivityInput) {
    const res = await createActivity(data)
    if (!res.success) {
      toast({ title: res.error ?? tc('errors.generic'), variant: 'destructive' })
      return
    }
    toast({ title: tc('toast.created', { entity: t('singular') }) })
    router.push(`/${locale}/app/activities`)
    router.refresh()
  }

  const types = t.raw('types') as Record<string, string>

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-lg border bg-card p-6 max-w-xl">
      <div className="space-y-1.5">
        <Label htmlFor="type">{t('fields.type')}</Label>
        <select id="type" className="flex h-10 w-full rounded-md border px-3 text-sm" {...register('type')}>
          {Object.entries(types).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="subject">{t('fields.subject')}</Label>
        <Input id="subject" {...register('subject')} />
        {errors.subject && <p className="text-xs text-destructive">{errors.subject.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="description">{t('fields.description')}</Label>
        <textarea id="description" className="w-full min-h-[80px] rounded-md border px-3 py-2 text-sm" {...register('description')} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="activityDate">{t('fields.date')}</Label>
        <Input id="activityDate" type="datetime-local" {...register('activityDate')} />
      </div>
      <Button type="submit" loading={isSubmitting}>{tc('actions.create')}</Button>
    </form>
  )
}
