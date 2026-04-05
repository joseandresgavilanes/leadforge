import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { getQuoteById } from '@/features/quotes/actions'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/data-display'
import { QuotePdfButton } from '@/components/quotes/quote-pdf-button'
import { QuoteStatusActions } from './quote-status-actions'

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  const quote = await getQuoteById(id)
  const t = await getTranslations('quotes')
  const tc = await getTranslations('common')
  if (!quote) notFound()

  const st = t.raw('statuses') as Record<string, string>

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href={`/${locale}/app/quotes`}>
            <Button variant="ghost" size="sm">{tc('actions.back')}</Button>
          </Link>
          <h1 className="text-2xl font-heading font-bold mt-2">{quote.title}</h1>
          <p className="text-sm text-muted-foreground font-mono">{quote.quote_number}</p>
          <Badge className="mt-2" variant="outline">{st[quote.status] ?? quote.status}</Badge>
        </div>
        <div className="flex gap-2">
          <QuotePdfButton quote={quote} />
        </div>
      </div>

      <QuoteStatusActions quoteId={quote.id} locale={locale} currentStatus={quote.status} />

      <div className="rounded-lg border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="text-left px-4 py-2">{t('lineItems.description')}</th>
              <th className="text-right px-4 py-2">{t('lineItems.quantity')}</th>
              <th className="text-right px-4 py-2">{t('lineItems.unitPrice')}</th>
              <th className="text-right px-4 py-2">{t('lineItems.amount')}</th>
            </tr>
          </thead>
          <tbody>
            {quote.items.map((item) => (
              <tr key={item.id} className="border-b last:border-0">
                <td className="px-4 py-2">{item.description}</td>
                <td className="px-4 py-2 text-right">{item.quantity}</td>
                <td className="px-4 py-2 text-right">{formatCurrency(item.unit_price)}</td>
                <td className="px-4 py-2 text-right">{formatCurrency(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-3 border-t space-y-1 text-sm text-right">
          <p>{t('fields.subtotal')}: {formatCurrency(quote.subtotal)}</p>
          <p>{t('fields.taxAmount')}: {formatCurrency(quote.tax_amount)}</p>
          <p className="font-bold">{t('fields.total')}: {formatCurrency(quote.total)}</p>
        </div>
      </div>
    </div>
  )
}
