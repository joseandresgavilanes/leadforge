import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { getQuotes } from '@/features/quotes/actions'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { Badge } from '@/components/ui/data-display'

export default async function QuotesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations('quotes')
  const tc = await getTranslations('common')
  const { data } = await getQuotes(1, 50)
  const base = `/${locale}/app`
  const st = t.raw('statuses') as Record<string, string>

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-heading font-bold">{t('title')}</h1>
        <Link href={`${base}/quotes/new`}>
          <Button><Plus className="h-4 w-4" />{t('createQuote')}</Button>
        </Link>
      </div>
      <div className="rounded-lg border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('fields.quoteNumber')}</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('fields.title')}</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">{t('fields.total')}</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('fields.status')}</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">{tc('actions.view')}</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">{t('empty.title')}</td></tr>
            ) : (
              data.map((q: any) => (
                <tr key={q.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs">{q.quote_number}</td>
                  <td className="px-4 py-3 font-medium">{q.title}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(q.total)}</td>
                  <td className="px-4 py-3"><Badge variant="outline">{st[q.status] ?? q.status}</Badge></td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`${base}/quotes/${q.id}`}><Button variant="ghost" size="sm">{tc('actions.view')}</Button></Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
