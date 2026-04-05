import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MarketingLocaleSwitcher } from '@/components/marketing/locale-switcher'

export default async function AutomationMarketingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations('marketing')
  const tc = await getTranslations('common')

  return (
    <div className="min-h-screen bg-brand-bg">
      <nav className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href={`/${locale}`} className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="font-heading font-bold text-brand-primary">LeadForge</span>
          </Link>
          <div className="hidden md:flex items-center gap-5 text-sm font-medium text-brand-text-muted">
            <Link href={`/${locale}/features`} className="hover:text-brand-text-main">{tc('nav.features')}</Link>
            <Link href={`/${locale}/pipeline`} className="hover:text-brand-text-main">{tc('nav.pipeline')}</Link>
            <Link href={`/${locale}/integrations`} className="hover:text-brand-text-main">{tc('nav.integrations')}</Link>
          </div>
          <div className="flex items-center gap-2">
            <MarketingLocaleSwitcher locale={locale} />
            <Link href={`/${locale}/login`}>
              <Button variant="ghost" size="sm">{tc('nav.login')}</Button>
            </Link>
            <Link href={`/${locale}/signup`}>
              <Button size="sm">{tc('nav.signup')}</Button>
            </Link>
          </div>
        </div>
      </nav>
      <div className="container mx-auto max-w-3xl px-4 py-20">
        <h1 className="font-heading text-4xl font-bold text-brand-text-main mb-6">{t('pages.automation.title')}</h1>
        <p className="text-lg text-brand-text-muted leading-relaxed mb-10">{t('pages.automation.body')}</p>
        <div className="flex flex-wrap gap-3">
          <Link href={`/${locale}/signup`}><Button size="lg">{tc('nav.signup')}</Button></Link>
          <Link href={`/${locale}/demo`}><Button size="lg" variant="outline">{tc('nav.demo')}</Button></Link>
        </div>
      </div>
    </div>
  )
}
