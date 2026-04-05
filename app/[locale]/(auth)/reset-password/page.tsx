import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { Zap } from 'lucide-react'
import ForgotPasswordForm from './forgot-password-form'

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations('auth.resetPassword')
  const tc = await getTranslations('auth.login')

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

          <ForgotPasswordForm locale={locale} />
        </div>

        <p className="mt-6 text-center text-sm text-brand-text-muted">
          <Link href={`/${locale}/login`} className="font-medium text-brand-primary hover:underline">
            {t('backToLogin')}
          </Link>
        </p>
      </div>
    </div>
  )
}
