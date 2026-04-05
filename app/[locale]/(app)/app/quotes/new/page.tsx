import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import QuoteForm from '../quote-form'

export default async function NewQuotePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations('quotes')
  const tc = await getTranslations('common')

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href={`/${locale}/app/quotes`}>
          <Button variant="ghost" size="sm">{tc('actions.back')}</Button>
        </Link>
        <h1 className="text-2xl font-heading font-bold">{t('createQuote')}</h1>
      </div>
      <QuoteForm locale={locale} />
    </div>
  )
}
