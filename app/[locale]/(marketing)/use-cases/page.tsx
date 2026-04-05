import { getTranslations } from 'next-intl/server'
import { MarketingSubpage } from '@/components/marketing/marketing-subpage'

export default async function UseCasesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations('marketing')
  const keys = ['founderLed', 'salesTeam', 'agencies'] as const

  return (
    <MarketingSubpage locale={locale}>
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="font-heading text-4xl font-bold text-brand-text-main mb-10">{t('useCases.title')}</h1>
        <div className="grid gap-8">
          {keys.map((key) => (
            <div key={key} className="rounded-xl border border-brand-border bg-white p-6">
              <h2 className="font-heading text-xl font-semibold text-brand-text-main mb-2">
                {t(`useCases.${key}.title`)}
              </h2>
              <p className="text-brand-text-muted">{t(`useCases.${key}.description`)}</p>
            </div>
          ))}
        </div>
      </div>
    </MarketingSubpage>
  )
}
