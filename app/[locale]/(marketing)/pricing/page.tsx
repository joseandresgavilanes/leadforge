import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { CheckCircle, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function PricingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations('marketing')
  const tc = await getTranslations('common')

  const plans = [
    {
      key: 'starter',
      features: ['3 users', '500 leads', '10 quotes/month', 'Pipeline & tasks', 'Email support'],
    },
    {
      key: 'growth',
      popular: true,
      features: ['10 users', '5,000 leads', '100 quotes/month', 'Advanced reports', 'AI features', 'Priority support'],
    },
    {
      key: 'pro',
      features: ['Unlimited users', 'Unlimited leads & quotes', 'Custom fields', 'API access', 'Dedicated support'],
    },
  ]

  return (
    <div className="min-h-screen bg-brand-bg">
      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href={`/${locale}`} className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="font-heading font-bold text-brand-primary">LeadForge</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href={`/${locale}/login`}><Button variant="ghost" size="sm">{tc('nav.login')}</Button></Link>
            <Link href={`/${locale}/signup`}><Button size="sm">{tc('nav.signup')}</Button></Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h1 className="font-heading text-5xl font-bold text-brand-text-main mb-4">{t('pricing.title')}</h1>
          <p className="text-xl text-brand-text-muted">{t('pricing.subtitle')}</p>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-20">
          {plans.map((plan) => (
            <div key={plan.key} className={`relative rounded-2xl border bg-white p-8 ${plan.popular ? 'border-brand-accent ring-2 ring-brand-accent shadow-xl' : 'shadow-sm'}`}>
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand-accent text-white text-xs font-bold px-4 py-1.5 rounded-full">
                  {t('pricing.save')}
                </div>
              )}
              <div className="mb-6">
                <h3 className="font-heading font-bold text-xl text-brand-text-main mb-1">
                  {(t.raw(`plans.${plan.key}`) as any).name}
                </h3>
                <p className="text-sm text-brand-text-muted mb-4">
                  {(t.raw(`plans.${plan.key}`) as any).description}
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-heading font-bold text-brand-text-main">
                    {(t.raw(`plans.${plan.key}`) as any).price}
                  </span>
                  <span className="text-brand-text-muted">/month</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-brand-text-main">
                    <CheckCircle className="h-4 w-4 text-brand-accent shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href={`/${locale}/signup`}>
                <Button
                  className="w-full"
                  variant={plan.popular ? 'default' : 'outline'}
                  size="lg"
                >
                  {(t.raw(`plans.${plan.key}`) as any).cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="font-heading text-3xl font-bold text-center mb-10">{t('pricing.faq.title')}</h2>
          <div className="space-y-6">
            {(['trial', 'cancel', 'upgrade', 'data'] as const).map((key) => (
              <div key={key} className="border-b pb-6 last:border-0">
                <h3 className="font-semibold text-brand-text-main mb-2">{(t.raw(`pricing.faq.${key}`) as any).q}</h3>
                <p className="text-brand-text-muted text-sm">{(t.raw(`pricing.faq.${key}`) as any).a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
