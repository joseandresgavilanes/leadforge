'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { updateQuoteStatus } from '@/features/quotes/actions'
import { Button } from '@/components/ui/button'

export function QuoteStatusActions({
  quoteId,
  locale: _locale,
  currentStatus,
}: {
  quoteId: string
  locale: string
  currentStatus: string
}) {
  const t = useTranslations('quotes.actions')
  const router = useRouter()

  async function setStatus(status: 'sent' | 'accepted' | 'rejected') {
    await updateQuoteStatus(quoteId, status)
    router.refresh()
  }

  if (currentStatus !== 'draft' && currentStatus !== 'sent') return null

  return (
    <div className="flex flex-wrap gap-2">
      {currentStatus === 'draft' && (
        <Button type="button" size="sm" onClick={() => setStatus('sent')}>{t('send')}</Button>
      )}
      {currentStatus === 'sent' && (
        <>
          <Button type="button" size="sm" variant="secondary" onClick={() => setStatus('accepted')}>{t('markAccepted')}</Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setStatus('rejected')}>{t('markRejected')}</Button>
        </>
      )}
    </div>
  )
}
