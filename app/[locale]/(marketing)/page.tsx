import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { ArrowRight, CheckCircle, Zap, TrendingUp, Target, FileText, BarChart3, Bot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MarketingLocaleSwitcher } from '@/components/marketing/locale-switcher'

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations('marketing')
  const tc = await getTranslations('common')

  return (
    <div className="min-h-screen bg-brand-bg">
      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary">
              <Zap className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="font-heading font-bold text-brand-primary text-lg">LeadForge</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            {[
              { label: tc('nav.features'), href: `/${locale}/features` },
              { label: tc('nav.pipeline'), href: `/${locale}/pipeline` },
              { label: tc('nav.automation'), href: `/${locale}/automation` },
              { label: tc('nav.integrations'), href: `/${locale}/integrations` },
              { label: tc('nav.pricing'), href: `/${locale}/pricing` },
              { label: tc('nav.useCases'), href: `/${locale}/use-cases` },
              { label: tc('nav.demo'), href: `/${locale}/demo` },
            ].map((item) => (
              <Link key={item.href} href={item.href} className="text-sm font-medium text-brand-text-muted hover:text-brand-text-main transition-colors">
                {item.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-3">
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

      {/* Hero */}
      <section className="container mx-auto px-4 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-brand-border bg-white px-4 py-1.5 text-sm font-medium text-brand-text-muted mb-8">
          <Zap className="h-3.5 w-3.5 text-brand-primary" />
          {t('hero.badge')}
        </div>
        <h1 className="font-heading text-5xl md:text-6xl font-bold text-brand-text-main leading-tight max-w-4xl mx-auto text-balance mb-6">
          {t('hero.title')}
        </h1>
        <p className="text-xl text-brand-text-muted max-w-2xl mx-auto mb-10 text-balance">
          {t('hero.subtitle')}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-5">
          <Link href={`/${locale}/signup`}>
            <Button size="xl" className="gap-2 min-w-48">
              {t('hero.ctaPrimary')}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href={`/${locale}/demo`}>
            <Button size="xl" variant="outline" className="min-w-48">
              {t('hero.ctaSecondary')}
            </Button>
          </Link>
        </div>
        <p className="text-sm text-brand-text-muted">{t('hero.noCard')}</p>

        {/* Mock Pipeline Preview */}
        <div className="mt-16 mx-auto max-w-5xl">
          <div className="rounded-2xl border border-brand-border bg-white shadow-2xl overflow-hidden">
            {/* Mock App Bar */}
            <div className="flex items-center gap-1.5 border-b px-4 py-3 bg-brand-bg">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <div className="flex-1 mx-4 h-6 rounded bg-white border text-xs flex items-center px-3 text-brand-text-muted">
                app.leadforge.io/pipeline
              </div>
            </div>
            {/* Mock Pipeline */}
            <div className="p-6 bg-brand-bg/50">
              <div className="flex gap-3 overflow-x-auto pb-2">
                {[
                  { name: 'Prospecting', color: '#6366f1', deals: [{ name: 'Acme Corp', value: '$12,000', prob: '20%' }, { name: 'TechFlow Inc', value: '$8,500', prob: '25%' }] },
                  { name: 'Qualification', color: '#0ea5e9', deals: [{ name: 'Global Systems', value: '$34,000', prob: '40%' }, { name: 'DataSync Pro', value: '$15,000', prob: '45%' }] },
                  { name: 'Proposal', color: '#f59e0b', deals: [{ name: 'Summit Solutions', value: '$52,000', prob: '65%' }] },
                  { name: 'Negotiation', color: '#10b981', deals: [{ name: 'NovaTech Ltd', value: '$89,000', prob: '80%' }] },
                  { name: 'Won', color: '#2E8B57', deals: [{ name: 'Vertex Corp', value: '$120,000', prob: '100%' }] },
                ].map((stage) => (
                  <div key={stage.name} className="flex-shrink-0 w-48">
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
                      <span className="text-xs font-semibold text-brand-text-main">{stage.name}</span>
                    </div>
                    <div className="space-y-2">
                      {stage.deals.map((deal) => (
                        <div key={deal.name} className="rounded-lg border border-brand-border bg-white p-2.5 shadow-sm">
                          <p className="text-xs font-semibold text-brand-text-main truncate">{deal.name}</p>
                          <p className="text-sm font-bold text-brand-primary mt-0.5">{deal.value}</p>
                          <p className="text-[10px] text-brand-text-muted">{deal.prob} probability</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust section */}
      <section className="border-y bg-white py-16">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <p className="text-sm font-semibold text-brand-text-muted uppercase tracking-widest mb-3">{t('trust.title')}</p>
          <p className="text-lg text-brand-text-muted mb-10 text-balance">{t('trust.subtitle')}</p>
          <div className="grid sm:grid-cols-2 gap-5 text-left">
            {(Object.entries(t.raw('trust.bullets') as Record<string, string>) as [string, string][]).map(([key, text]) => (
              <div key={key} className="flex gap-3 rounded-xl border border-brand-border bg-brand-bg/40 p-5">
                <CheckCircle className="h-5 w-5 text-brand-accent shrink-0 mt-0.5" />
                <p className="text-sm text-brand-text-main leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="font-heading text-4xl font-bold text-brand-text-main mb-4">{t('features.title')}</h2>
          <p className="text-xl text-brand-text-muted max-w-2xl mx-auto">{t('features.subtitle')}</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { key: 'pipeline', icon: TrendingUp },
            { key: 'leads', icon: Zap },
            { key: 'followup', icon: CheckCircle },
            { key: 'quotes', icon: FileText },
            { key: 'forecast', icon: BarChart3 },
            { key: 'ai', icon: Bot },
          ].map(({ key, icon: Icon }) => (
            <div key={key} className="rounded-xl border bg-white p-6 hover:shadow-lg hover:border-brand-primary/30 transition-all">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-primary/10 mb-4">
                <Icon className="h-5.5 w-5.5 text-brand-primary" />
              </div>
              <h3 className="font-heading font-semibold text-brand-text-main mb-2">
                {(t.raw(`features.${key}`) as any).title}
              </h3>
              <p className="text-sm text-brand-text-muted leading-relaxed">
                {(t.raw(`features.${key}`) as any).description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-brand-primary py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-heading text-4xl font-bold text-white mb-4">{t('cta.title')}</h2>
          <p className="text-xl text-white/80 mb-10">{t('cta.subtitle')}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href={`/${locale}/signup`}>
              <Button size="xl" className="bg-white text-brand-primary hover:bg-white/90 min-w-48">
                {t('cta.primary')}
              </Button>
            </Link>
            <Link href={`/${locale}/demo`}>
              <Button size="xl" variant="outline" className="border-white text-white hover:bg-white/10 min-w-48">
                {t('cta.secondary')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-primary">
                  <Zap className="h-4 w-4 text-white" />
                </div>
                <span className="font-heading font-bold text-brand-primary">LeadForge</span>
              </div>
              <p className="text-sm text-brand-text-muted max-w-xs">
                {t('footer.tagline')}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-8 text-sm">
              <div>
                <p className="font-semibold text-brand-text-main mb-3">{t('footer.product')}</p>
                <ul className="space-y-2 text-brand-text-muted">
                  <li><Link href={`/${locale}/features`} className="hover:text-brand-primary">{tc('nav.features')}</Link></li>
                  <li><Link href={`/${locale}/pipeline`} className="hover:text-brand-primary">{tc('nav.pipeline')}</Link></li>
                  <li><Link href={`/${locale}/automation`} className="hover:text-brand-primary">{tc('nav.automation')}</Link></li>
                  <li><Link href={`/${locale}/integrations`} className="hover:text-brand-primary">{tc('nav.integrations')}</Link></li>
                  <li><Link href={`/${locale}/pricing`} className="hover:text-brand-primary">{tc('nav.pricing')}</Link></li>
                  <li><Link href={`/${locale}/security`} className="hover:text-brand-primary">{tc('nav.security')}</Link></li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-brand-text-main mb-3">{t('footer.company')}</p>
                <ul className="space-y-2 text-brand-text-muted">
                  <li><Link href={`/${locale}/demo`} className="hover:text-brand-primary">{t('footer.about')}</Link></li>
                  <li><Link href={`/${locale}/blog`} className="hover:text-brand-primary">{t('footer.blog')}</Link></li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-brand-text-main mb-3">{t('footer.legal')}</p>
                <ul className="space-y-2 text-brand-text-muted">
                  <li><Link href={`/${locale}/privacy`} className="hover:text-brand-primary">{t('footer.privacy')}</Link></li>
                  <li><Link href={`/${locale}/terms`} className="hover:text-brand-primary">{t('footer.terms')}</Link></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t mt-10 pt-6 text-center text-sm text-brand-text-muted">
            {t('footer.copyright', { year: new Date().getFullYear() })}
          </div>
        </div>
      </footer>
    </div>
  )
}
