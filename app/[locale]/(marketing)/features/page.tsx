import { getTranslations } from 'next-intl/server'
import { MarketingSubpage } from '@/components/marketing/marketing-subpage'

export default async function FeaturesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations('marketing')

  const blocks = ['pipeline', 'leads', 'followup', 'quotes', 'forecast', 'ai'] as const

  return (
    <MarketingSubpage locale={locale}>
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="font-heading text-4xl font-bold text-brand-text-main mb-4">{t('features.title')}</h1>
        <p className="text-lg text-brand-text-muted mb-12">{t('features.subtitle')}</p>
        <div className="grid gap-8">
          {blocks.map((key) => (
            <div key={key} className="rounded-xl border border-brand-border bg-white p-6">
              <h2 className="font-heading text-xl font-semibold text-brand-text-main mb-2">
                {t(`features.${key}.title`)}
              </h2>
              <p className="text-brand-text-muted">{t(`features.${key}.description`)}</p>
            </div>
          ))}
        </div>
      </div>
    </MarketingSubpage>
  )
}
