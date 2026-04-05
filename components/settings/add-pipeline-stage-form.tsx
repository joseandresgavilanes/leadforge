'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createPipelineStage } from '@/features/pipeline/actions'
import { Input, Label } from '@/components/ui/form-elements'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'

export function AddPipelineStageForm({ nextPosition }: { nextPosition: number }) {
  const t = useTranslations('settings')
  const tc = useTranslations('common')
  const router = useRouter()
  const [name, setName] = useState('')
  const [probability, setProbability] = useState('50')
  const [color, setColor] = useState('#6366f1')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await createPipelineStage({
      name,
      probability: Number(probability) || 0,
      color,
      position: nextPosition,
    })
    setLoading(false)
    if (!res.success) {
      toast({ title: res.error ?? tc('errors.generic'), variant: 'destructive' })
      return
    }
    setName('')
    toast({ title: tc('toast.created', { entity: t('sections.pipeline') }) })
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-4">
      <div className="space-y-1">
        <Label htmlFor="stName">{t('pipeline.stageName')}</Label>
        <Input id="stName" value={name} onChange={(e) => setName(e.target.value)} required className="w-40" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="prob">{t('pipeline.probability')}</Label>
        <Input id="prob" type="number" min={0} max={100} value={probability} onChange={(e) => setProbability(e.target.value)} className="w-24" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="color">{t('pipeline.color')}</Label>
        <Input id="color" type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-16 h-10 p-1" />
      </div>
      <Button type="submit" loading={loading}>{tc('actions.add')}</Button>
    </form>
  )
}
