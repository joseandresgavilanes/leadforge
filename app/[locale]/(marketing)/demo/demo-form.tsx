'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { demoRequestSchema, type DemoRequestInput } from '@/lib/validators/schemas'
import { Input, Label, Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/form-elements'
import { Button } from '@/components/ui/button'
import { CheckCircle } from 'lucide-react'
import { trackClientEvent } from '@/lib/analytics/track-client'

export default function DemoForm({ locale }: { locale: string }) {
  const t = useTranslations('marketing.demo.form')
  const [submitted, setSubmitted] = useState(false)

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<DemoRequestInput>({
    resolver: zodResolver(demoRequestSchema),
  })

  async function onSubmit(data: DemoRequestInput) {
    // Send confirmation email via API
    await fetch('/api/demo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, locale }),
    })
    trackClientEvent('demo_requested', { teamSize: data.teamSize })
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="flex justify-center mb-4">
          <CheckCircle className="h-12 w-12 text-brand-accent" />
        </div>
        <h3 className="font-heading text-xl font-bold mb-2">{t('success')}</h3>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>{t('firstName')}</Label>
          <Input placeholder="Jane" {...register('firstName')} />
          {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>{t('lastName')}</Label>
          <Input placeholder="Smith" {...register('lastName')} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>{t('email')}</Label>
        <Input type="email" placeholder="jane@company.com" {...register('email')} />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label>{t('company')}</Label>
        <Input placeholder="Acme Corp" {...register('company')} />
      </div>
      <div className="space-y-1.5">
        <Label>{t('teamSize')}</Label>
        <Select onValueChange={(v) => setValue('teamSize', v)}>
          <SelectTrigger>
            <SelectValue placeholder="Select team size" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(t.raw('teamSizes') as Record<string, string>).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.teamSize && <p className="text-xs text-destructive">{errors.teamSize.message}</p>}
      </div>
      <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
        {t('submit')}
      </Button>
    </form>
  )
}
