'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { logMessage } from '@/features/inbox/actions'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import type { EmailTemplatesRow } from '@/types/supabase'

export function LogThreadMessageForm({
  threadId,
  templates,
}: {
  threadId: string
  templates: Pick<EmailTemplatesRow, 'id' | 'name' | 'subject' | 'body'>[]
}) {
  const t = useTranslations('workspace.inbox')
  const tc = useTranslations('common')
  const router = useRouter()
  const [pending, start] = useTransition()

  function applyTemplate(id: string) {
    const tpl = templates.find((x) => x.id === id)
    if (!tpl) return
    const subj = document.getElementById('comm-subject') as HTMLInputElement | null
    const body = document.getElementById('comm-body') as HTMLTextAreaElement | null
    if (subj) subj.value = tpl.subject
    if (body) body.value = tpl.body
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const direction = fd.get('direction') as 'inbound' | 'outbound'
    const channel = fd.get('channel') as 'email' | 'call' | 'meeting' | 'demo' | 'note'
    const subject = (fd.get('subject') as string) || null
    const body = (fd.get('body') as string) || ''
    start(async () => {
      const res = await logMessage({ threadId, direction, channel, subject, body })
      if (!res.success) {
        toast({ title: res.error ?? tc('errors.generic'), variant: 'destructive' })
        return
      }
      toast({ title: t('messageLogged') })
      e.currentTarget.reset()
      router.refresh()
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-lg border bg-card p-4">
      <p className="text-sm font-semibold">{t('logMessage')}</p>
      {templates.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">{t('templates')}:</span>
          <select
            className="h-8 rounded-md border px-2 text-xs bg-background"
            defaultValue=""
            onChange={(e) => e.target.value && applyTemplate(e.target.value)}
          >
            <option value="">{t('pickTemplate')}</option>
            {templates.map((tpl) => (
              <option key={tpl.id} value={tpl.id}>
                {tpl.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium">{t('direction')}</label>
          <select name="direction" className="mt-1 flex h-9 w-full rounded-md border px-2 text-sm" required>
            <option value="outbound">{t('outbound')}</option>
            <option value="inbound">{t('inbound')}</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium">{t('channel')}</label>
          <select name="channel" className="mt-1 flex h-9 w-full rounded-md border px-2 text-sm" required>
            <option value="email">{t('channels.email')}</option>
            <option value="call">{t('channels.call')}</option>
            <option value="meeting">{t('channels.meeting')}</option>
            <option value="demo">{t('channels.demo')}</option>
            <option value="note">{t('channels.note')}</option>
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs font-medium">{t('subject')}</label>
        <input id="comm-subject" name="subject" className="mt-1 flex h-9 w-full rounded-md border px-3 text-sm" />
      </div>
      <div>
        <label className="text-xs font-medium">{t('body')}</label>
        <textarea id="comm-body" name="body" required rows={4} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" />
      </div>
      <Button type="submit" loading={pending} size="sm">
        {t('logMessage')}
      </Button>
    </form>
  )
}
