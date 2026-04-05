import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import LoginForm from './login-form'
import { Zap } from 'lucide-react'

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ next?: string }>
}) {
  const { locale } = await params
  const sp = await searchParams
  const t = await getTranslations('auth.login')
  const tc = await getTranslations('common')

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href={`/${locale}`} className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-primary">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="font-heading font-bold text-xl text-brand-primary">LeadForge</span>
          </Link>
        </div>

        {/* Card */}
        <div className="rounded-2xl border bg-white shadow-sm p-8">
          <div className="mb-6 text-center">
            <h1 className="font-heading text-2xl font-bold text-brand-text-main">{t('title')}</h1>
            <p className="text-sm text-brand-text-muted mt-1">{t('subtitle')}</p>
          </div>

          <LoginForm locale={locale} nextPath={sp.next} />

          <p className="mt-6 text-center text-sm text-brand-text-muted">
            {t('noAccount')}{' '}
            <Link href={`/${locale}/signup`} className="font-medium text-brand-primary hover:underline">
              {t('signupLink')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
