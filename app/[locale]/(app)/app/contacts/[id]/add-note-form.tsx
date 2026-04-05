'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createNote } from '@/features/notes/actions'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'

export function AddContactNoteForm({ locale: _locale, contactId }: { locale: string; contactId: string }) {
  const t = useTranslations('contacts.tabs')
  const tc = useTranslations('common')
  const router = useRouter()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setLoading(true)
    const res = await createNote({ content: content.trim(), contactId })
    setLoading(false)
    if (!res.success) {
      toast({ title: res.error ?? tc('errors.generic'), variant: 'destructive' })
      return
    }
    setContent('')
    toast({ title: tc('toast.created', { entity: t('notes') }) })
    router.refresh()
  }

  return (
    <form onSubmit={submit} className="rounded-lg border bg-card p-4 space-y-2">
      <h3 className="font-medium text-sm">{t('notes')}</h3>
      <textarea
        className="w-full min-h-[80px] rounded-md border px-3 py-2 text-sm"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={tc('actions.add')}
      />
      <Button type="submit" size="sm" loading={loading}>{tc('actions.add')}</Button>
    </form>
  )
}
