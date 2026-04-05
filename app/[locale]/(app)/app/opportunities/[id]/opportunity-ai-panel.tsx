'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'

type AiType = 'opportunity_summary' | 'next_step' | 'follow_up_email'

export default function OpportunityAiPanel({
  context,
}: {
  context: Record<string, unknown>
}) {
  const t = useTranslations('opportunities.ai')
  const tc = useTranslations('common')
  const [tab, setTab] = useState<AiType>('opportunity_summary')
  const [out, setOut] = useState('')
  const [loading, setLoading] = useState(false)

  async function run(type: AiType) {
    setLoading(true)
    setOut('')
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, context }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setOut(data.result ?? '')
    } catch {
      setOut(tc('errors.generic'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-lg border bg-card p-5 space-y-4">
      <h3 className="font-heading font-semibold">{t('title')}</h3>
      <div className="flex flex-wrap gap-2">
        {(
          [
            ['opportunity_summary', t('summary')],
            ['next_step', t('nextStep')],
            ['follow_up_email', t('followUpDraft')],
          ] as const
        ).map(([key, label]) => (
          <Button
            key={key}
            type="button"
            size="sm"
            variant={tab === key ? 'default' : 'outline'}
            onClick={() => setTab(key)}
          >
            {label}
          </Button>
        ))}
      </div>
      <Button type="button" loading={loading} onClick={() => run(tab)}>
        {loading ? t('generating') : t('generate')}
      </Button>
      {out ? (
        <pre className="text-xs whitespace-pre-wrap rounded-md bg-muted/50 p-3 max-h-64 overflow-y-auto border">
          {out}
        </pre>
      ) : null}
    </div>
  )
}
