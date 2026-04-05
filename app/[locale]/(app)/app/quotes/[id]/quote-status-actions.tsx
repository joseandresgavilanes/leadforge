'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { updateQuoteStatus } from '@/features/quotes/actions'
import { Button } from '@/components/ui/button'

const TERMINAL = new Set(['accepted', 'rejected', 'expired', 'cancelled'])

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

  async function setStatus(
    status: 'sent' | 'viewed' | 'accepted' | 'rejected' | 'cancelled'
  ) {
    await updateQuoteStatus(quoteId, status)
    router.refresh()
  }

  if (TERMINAL.has(currentStatus)) return null

  return (
    <div className="flex flex-wrap gap-2">
      {currentStatus === 'draft' && (
        <>
          <Button type="button" size="sm" onClick={() => setStatus('sent')}>{t('send')}</Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setStatus('cancelled')}>
            {t('cancel')}
          </Button>
        </>
      )}
      {(currentStatus === 'sent' || currentStatus === 'viewed') && (
        <>
          {currentStatus === 'sent' && (
            <Button type="button" size="sm" variant="secondary" onClick={() => setStatus('viewed')}>
              {t('markViewed')}
            </Button>
          )}
          <Button type="button" size="sm" variant="secondary" onClick={() => setStatus('accepted')}>
            {t('markAccepted')}
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setStatus('rejected')}>
            {t('markRejected')}
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setStatus('cancelled')}>
            {t('cancel')}
          </Button>
        </>
      )}
    </div>
  )
}
