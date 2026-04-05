'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createThread } from '@/features/inbox/actions'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'

export function CreateThreadForm({ locale }: { locale: string }) {
  const t = useTranslations('workspace.inbox')
  const tc = useTranslations('common')
  const router = useRouter()
  const [pending, start] = useTransition()
  const [recordType, setRecordType] = useState<'lead' | 'contact' | 'company' | 'opportunity'>('lead')

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const subject = String(fd.get('subject') ?? '').trim()
    const id = String(fd.get('recordId') ?? '').trim()
    if (!subject || !id) {
      toast({ title: tc('errors.generic'), variant: 'destructive' })
      return
    }
    const payload = {
      subject,
      leadId: recordType === 'lead' ? id : undefined,
      contactId: recordType === 'contact' ? id : undefined,
      companyId: recordType === 'company' ? id : undefined,
      opportunityId: recordType === 'opportunity' ? id : undefined,
    }
    start(async () => {
      const res = await createThread(payload)
      if (!res.success) {
        toast({ title: res.error ?? tc('errors.generic'), variant: 'destructive' })
        return
      }
      router.push(`/${locale}/app/inbox/${res.data!.id}`)
      router.refresh()
    })
  }

  return (
    <form onSubmit={onSubmit} className="max-w-lg space-y-4">
      <div>
        <label className="text-xs font-medium">{t('subject')}</label>
        <input name="subject" required className="mt-1 flex h-9 w-full rounded-md border px-3 text-sm" />
      </div>
      <div>
        <label className="text-xs font-medium">{t('linkRecord')}</label>
        <select
          value={recordType}
          onChange={(e) => setRecordType(e.target.value as typeof recordType)}
          className="mt-1 flex h-9 w-full rounded-md border px-2 text-sm"
        >
          <option value="lead">{t('leadId')}</option>
          <option value="contact">{t('contactId')}</option>
          <option value="company">{t('companyId')}</option>
          <option value="opportunity">{t('opportunityId')}</option>
        </select>
      </div>
      <div>
        <label className="text-xs font-medium">{t('recordId')}</label>
        <input name="recordId" required className="mt-1 flex h-9 w-full rounded-md border px-3 font-mono text-sm" placeholder="00000000-0000-0000-0000-000000000000" />
      </div>
      <Button type="submit" loading={pending}>
        {t('create')}
      </Button>
    </form>
  )
}
