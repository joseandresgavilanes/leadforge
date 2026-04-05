'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { z } from 'zod'
import { organizationSchema } from '@/lib/validators/schemas'
import { completeOnboarding } from '@/features/organizations/actions'
import { Input, Label } from '@/components/ui/form-elements'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'

const formSchema = organizationSchema.pick({ name: true, industry: true, timezone: true, currency: true })

type FormValues = z.infer<typeof formSchema>

export default function OnboardingForm({ locale }: { locale: string }) {
  const t = useTranslations('auth.onboarding')
  const tc = useTranslations('common')
  const router = useRouter()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      industry: '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      currency: 'USD',
    },
  })

  async function onSubmit(data: FormValues) {
    const res = await completeOnboarding({
      organizationName: data.name,
      industry: data.industry || null,
      timezone: data.timezone,
      currency: data.currency,
      locale,
    })

    if (!res.success) {
      toast({ title: res.error ?? tc('errors.generic'), variant: 'destructive' })
      return
    }

    toast({ title: t('success') })
    router.push(`/${locale}/app/dashboard`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">{t('orgName')}</Label>
        <Input id="name" placeholder={t('orgNamePlaceholder')} {...register('name')} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="industry">{t('industry')}</Label>
        <select
          id="industry"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          {...register('industry')}
        >
          <option value="">{t('selectIndustry')}</option>
          <option value="Software / SaaS">{t('industries.software')}</option>
          <option value="Consulting">{t('industries.consulting')}</option>
          <option value="Agency">{t('industries.agency')}</option>
          <option value="Distribution">{t('industries.distribution')}</option>
          <option value="Manufacturing">{t('industries.manufacturing')}</option>
          <option value="Professional Services">{t('industries.services')}</option>
          <option value="Other">{t('industries.other')}</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="timezone">{t('timezone')}</Label>
          <Input id="timezone" {...register('timezone')} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="currency">{t('currency')}</Label>
          <Input id="currency" maxLength={3} {...register('currency')} />
        </div>
      </div>

      <Button type="submit" className="w-full" loading={isSubmitting}>
        {t('finish')}
      </Button>
    </form>
  )
}
