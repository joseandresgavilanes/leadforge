'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/db/client'
import { isSupabaseConfigured } from '@/lib/config/backend'
import { signupSchema, type SignupInput } from '@/lib/validators/schemas'
import { Input, Label } from '@/components/ui/form-elements'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { trackClientEvent } from '@/lib/analytics/track-client'

export default function SignupForm({ locale }: { locale: string }) {
  const t = useTranslations('auth.signup')
  const router = useRouter()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
  })

  async function onSubmit(data: SignupInput) {
    trackClientEvent('signup_started')
    const supabase = createClient()

    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          first_name: data.firstName,
          last_name: data.lastName,
          company_name: data.companyName,
        },
      },
    })

    if (error) {
      const msg = error.message.includes('already') ? t('error.emailTaken') : error.message
      toast({ title: msg, variant: 'destructive' })
      return
    }

    trackClientEvent('signup_completed')
    router.push(
      isSupabaseConfigured() ? `/${locale}/onboarding` : `/${locale}/app/dashboard`
    )
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="firstName">{t('firstName')}</Label>
          <Input id="firstName" placeholder="Jane" {...register('firstName')} />
          {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lastName">{t('lastName')}</Label>
          <Input id="lastName" placeholder="Smith" {...register('lastName')} />
          {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">{t('email')}</Label>
        <Input id="email" type="email" placeholder="jane@company.com" {...register('email')} />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="companyName">{t('companyName')}</Label>
        <Input id="companyName" placeholder="Acme Corp" {...register('companyName')} />
        {errors.companyName && <p className="text-xs text-destructive">{errors.companyName.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">{t('password')}</Label>
        <Input id="password" type="password" placeholder="••••••••" {...register('password')} />
        <p className="text-xs text-muted-foreground">{t('passwordRequirements')}</p>
        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
      </div>

      <Button type="submit" className="w-full" loading={isSubmitting}>
        {t('submit')}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        <a href={`/${locale}/terms`} className="underline hover:text-primary">{t('termsLink')}</a>
        {' · '}
        <a href={`/${locale}/privacy`} className="underline hover:text-primary">{t('privacyLink')}</a>
      </p>
    </form>
  )
}
