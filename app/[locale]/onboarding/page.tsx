import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { requireAuth, getUserOrganizations } from '@/lib/auth/server'
import Link from 'next/link'
import { Zap } from 'lucide-react'
import OnboardingForm from './onboarding-form'

export default async function OnboardingPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const user = await requireAuth(locale)
  const orgs = await getUserOrganizations(user.id)
  if (orgs.length > 0) {
    redirect(`/${locale}/app/dashboard`)
  }

  const t = await getTranslations('auth.onboarding')
  const tc = await getTranslations('common')

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Link href={`/${locale}`} className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-primary">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="font-heading font-bold text-xl text-brand-primary">LeadForge</span>
          </Link>
        </div>

        <div className="rounded-2xl border bg-white shadow-sm p-8">
          <div className="mb-6 text-center">
            <h1 className="font-heading text-2xl font-bold text-brand-text-main">{t('title')}</h1>
            <p className="text-sm text-brand-text-muted mt-1">{t('subtitle')}</p>
          </div>

          <OnboardingForm locale={locale} />
        </div>

        <p className="mt-6 text-center text-sm text-brand-text-muted">
          <Link href={`/${locale}/login`} className="font-medium text-brand-primary hover:underline">
            {tc('actions.back')}
          </Link>
        </p>
      </div>
    </div>
  )
}
