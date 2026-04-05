'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { enrollInSequence } from '@/features/sequences/actions'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'

export function EnrollSequenceForm({ sequenceId }: { sequenceId: string }) {
  const t = useTranslations('workspace.sequences')
  const ti = useTranslations('workspace.inbox')
  const tc = useTranslations('common')
  const router = useRouter()
  const [pending, start] = useTransition()
  const [recordType, setRecordType] = useState<'lead' | 'contact' | 'opportunity'>('lead')

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const id = String(fd.get('recordId') ?? '').trim()
    if (!id) return
    start(async () => {
      const res = await enrollInSequence({
        sequenceId,
        leadId: recordType === 'lead' ? id : undefined,
        contactId: recordType === 'contact' ? id : undefined,
        opportunityId: recordType === 'opportunity' ? id : undefined,
      })
      if (!res.success) {
        toast({ title: res.error ?? tc('errors.generic'), variant: 'destructive' })
        return
      }
      toast({ title: t('enrolledToast') })
      e.currentTarget.reset()
      router.refresh()
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-lg border bg-muted/20 p-4">
      <p className="text-sm font-semibold">{t('enroll')}</p>
      <input type="hidden" name="sequenceId" value={sequenceId} />
      <select
        value={recordType}
        onChange={(e) => setRecordType(e.target.value as typeof recordType)}
        className="flex h-9 w-full rounded-md border px-2 text-sm md:max-w-xs"
      >
        <option value="lead">{ti('leadId')}</option>
        <option value="contact">{ti('contactId')}</option>
        <option value="opportunity">{ti('opportunityId')}</option>
      </select>
      <input
        name="recordId"
        required
        className="flex h-9 w-full rounded-md border px-3 font-mono text-sm md:max-w-md"
        placeholder="00000000-0000-0000-0000-000000000000"
      />
      <Button type="submit" size="sm" loading={pending}>
        {t('enroll')}
      </Button>
    </form>
  )
}
