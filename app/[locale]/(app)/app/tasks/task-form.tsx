'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { taskSchema, type TaskInput } from '@/lib/validators/schemas'
import { createTask } from '@/features/tasks/actions'
import { Input, Label } from '@/components/ui/form-elements'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'

export default function TaskForm({ locale }: { locale: string }) {
  const t = useTranslations('tasks')
  const tc = useTranslations('common')
  const router = useRouter()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<TaskInput>({
    resolver: zodResolver(taskSchema),
    defaultValues: { priority: 'medium' },
  })

  async function onSubmit(data: TaskInput) {
    const res = await createTask(data)
    if (!res.success) {
      toast({ title: res.error ?? tc('errors.generic'), variant: 'destructive' })
      return
    }
    toast({ title: tc('toast.created', { entity: t('singular') }) })
    router.push(`/${locale}/app/tasks`)
    router.refresh()
  }

  const priorityKeys = ['low', 'medium', 'high', 'urgent'] as const

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-lg border bg-card p-6 max-w-xl">
      <div className="space-y-1.5">
        <Label htmlFor="title">{t('fields.title')}</Label>
        <Input id="title" {...register('title')} />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="priority">{t('fields.priority')}</Label>
        <select id="priority" className="flex h-10 w-full rounded-md border px-3 text-sm" {...register('priority')}>
          {priorityKeys.map((k) => (
            <option key={k} value={k}>{tc(`priority.${k}`)}</option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="dueDate">{t('fields.dueDate')}</Label>
        <Input id="dueDate" type="datetime-local" {...register('dueDate')} />
      </div>
      <Button type="submit" loading={isSubmitting}>{tc('actions.create')}</Button>
    </form>
  )
}
