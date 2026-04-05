'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createQuote } from '@/features/quotes/actions'
import { Input, Label } from '@/components/ui/form-elements'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import type { QuoteInput } from '@/lib/validators/schemas'

export default function QuoteForm({ locale }: { locale: string }) {
  const t = useTranslations('quotes')
  const tc = useTranslations('common')
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [taxRate, setTaxRate] = useState('0')
  const [items, setItems] = useState([{ description: '', quantity: '1', unitPrice: '0' }])
  const [loading, setLoading] = useState(false)

  function addRow() {
    setItems([...items, { description: '', quantity: '1', unitPrice: '0' }])
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const parsed: QuoteInput = {
      title,
      status: 'draft',
      discount: 0,
      issueDate: new Date().toISOString().slice(0, 10),
      taxRate: Number(taxRate) || 0,
      items: items
        .filter((i) => i.description.trim())
        .map((i, idx) => ({
          description: i.description,
          quantity: Number(i.quantity) || 0,
          unitPrice: Number(i.unitPrice) || 0,
          position: idx,
        })),
    }
    if (!parsed.items.length) {
      toast({ title: tc('errors.generic'), variant: 'destructive' })
      setLoading(false)
      return
    }
    const res = await createQuote(parsed)
    setLoading(false)
    if (!res.success) {
      toast({ title: res.error ?? tc('errors.generic'), variant: 'destructive' })
      return
    }
    if (!res.data) {
      toast({ title: tc('errors.generic'), variant: 'destructive' })
      return
    }
    toast({ title: tc('toast.created', { entity: t('singular') }) })
    router.push(`/${locale}/app/quotes/${res.data.id}`)
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-lg border bg-card p-6 max-w-3xl">
      <div className="space-y-1.5">
        <Label htmlFor="title">{t('fields.title')}</Label>
        <Input id="title" name="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div className="space-y-1.5 max-w-xs">
        <Label htmlFor="tax">{t('fields.taxRate')}</Label>
        <Input id="tax" type="number" step="0.01" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} />
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium">{t('lineItems.title')}</p>
        {items.map((row, idx) => (
          <div key={idx} className="grid grid-cols-12 gap-2 items-end">
            <div className="col-span-12 sm:col-span-6">
              <Input
                placeholder={t('lineItems.description')}
                value={row.description}
                onChange={(e) => {
                  const next = [...items]
                  next[idx].description = e.target.value
                  setItems(next)
                }}
              />
            </div>
            <div className="col-span-4 sm:col-span-3">
              <Input
                type="number"
                step="0.01"
                placeholder={t('lineItems.quantity')}
                value={row.quantity}
                onChange={(e) => {
                  const next = [...items]
                  next[idx].quantity = e.target.value
                  setItems(next)
                }}
              />
            </div>
            <div className="col-span-8 sm:col-span-3">
              <Input
                type="number"
                step="0.01"
                placeholder={t('lineItems.unitPrice')}
                value={row.unitPrice}
                onChange={(e) => {
                  const next = [...items]
                  next[idx].unitPrice = e.target.value
                  setItems(next)
                }}
              />
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addRow}>{tc('actions.add')}</Button>
      </div>
      <Button type="submit" loading={loading}>{tc('actions.create')}</Button>
    </form>
  )
}
