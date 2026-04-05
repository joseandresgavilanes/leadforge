import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MarketingLocaleSwitcher } from '@/components/marketing/locale-switcher'

export async function MarketingSubpage({
  locale,
  children,
}: {
  locale: string
  children: React.ReactNode
}) {
  const t = await getTranslations('marketing')
  const tc = await getTranslations('common')

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">
      <nav className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href={`/${locale}`} className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary">
              <Zap className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="font-heading font-bold text-brand-primary text-lg">LeadForge</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            {[
              { label: tc('nav.features'), href: `/${locale}/features` },
              { label: tc('nav.pricing'), href: `/${locale}/pricing` },
              { label: tc('nav.useCases'), href: `/${locale}/use-cases` },
              { label: tc('nav.demo'), href: `/${locale}/demo` },
              { label: tc('nav.blog'), href: `/${locale}/blog` },
              { label: tc('nav.security'), href: `/${locale}/security` },
            ].map((item) => (
              <Link key={item.href} href={item.href} className="text-sm font-medium text-brand-text-muted hover:text-brand-text-main">
                {item.label}
              </Link>
            ))}
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

      <main className="flex-1">{children}</main>

      <footer className="border-t bg-white py-12 mt-auto">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
            <div>
              <p className="font-semibold text-brand-text-main mb-3">{t('footer.product')}</p>
              <ul className="space-y-2 text-brand-text-muted">
                <li><Link href={`/${locale}/features`} className="hover:text-brand-primary">{tc('nav.features')}</Link></li>
                <li><Link href={`/${locale}/pricing`} className="hover:text-brand-primary">{tc('nav.pricing')}</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-brand-text-main mb-3">{t('footer.legal')}</p>
              <ul className="space-y-2 text-brand-text-muted">
                <li><Link href={`/${locale}/privacy`} className="hover:text-brand-primary">{t('footer.privacy')}</Link></li>
                <li><Link href={`/${locale}/terms`} className="hover:text-brand-primary">{t('footer.terms')}</Link></li>
                <li><Link href={`/${locale}/security`} className="hover:text-brand-primary">{t('footer.security')}</Link></li>
              </ul>
            </div>
          </div>
          <p className="text-center text-sm text-brand-text-muted mt-8">
            {t('footer.copyright', { year: new Date().getFullYear() })}
          </p>
        </div>
      </footer>
    </div>
  )
}
