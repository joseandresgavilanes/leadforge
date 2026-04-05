import { getTranslations } from 'next-intl/server'
import { MarketingSubpage } from '@/components/marketing/marketing-subpage'

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations('legal.terms')

  return (
    <MarketingSubpage locale={locale}>
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <h1 className="font-heading text-4xl font-bold text-brand-text-main mb-2">{t('title')}</h1>
        <p className="text-sm text-brand-text-muted mb-8">{t('updated')}</p>
        {(['p1', 'p2', 'p3', 'p4', 'p5'] as const).map((k) => (
          <p key={k} className="text-brand-text-main mb-4 leading-relaxed">{t(k)}</p>
        ))}
      </div>
    </MarketingSubpage>
  )
}
