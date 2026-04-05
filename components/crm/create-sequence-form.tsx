'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createSequence } from '@/features/sequences/actions'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'

export function CreateSequenceForm({ locale }: { locale: string }) {
  const t = useTranslations('workspace.sequences')
  const tc = useTranslations('common')
  const router = useRouter()
  const [pending, start] = useTransition()

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const name = String(fd.get('name') ?? '').trim()
    const description = String(fd.get('description') ?? '').trim() || null
    if (!name) return
    start(async () => {
      const res = await createSequence({ name, description })
      if (!res.success) {
        toast({ title: res.error ?? tc('errors.generic'), variant: 'destructive' })
        return
      }
      router.push(`/${locale}/app/sequences/${res.data!.id}`)
      router.refresh()
    })
  }

  return (
    <form onSubmit={onSubmit} className="max-w-lg space-y-4">
      <div>
        <label className="text-xs font-medium">{t('name')}</label>
        <input name="name" required className="mt-1 flex h-9 w-full rounded-md border px-3 text-sm" />
      </div>
      <div>
        <label className="text-xs font-medium">{t('description')}</label>
        <textarea name="description" rows={3} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" />
      </div>
      <Button type="submit" loading={pending}>
        {t('new')}
      </Button>
    </form>
  )
}
