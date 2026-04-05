'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { ArrowUpRight } from 'lucide-react'

export function UpgradePlanButton({
  planKey,
  priceId,
  locale,
  currentPlan,
  popular,
}: {
  planKey: string
  priceId: string
  locale: string
  currentPlan: string
  popular?: boolean
}) {
  const t = useTranslations('billing')
  const [loading, setLoading] = useState(false)

  async function checkout() {
    if (!priceId) return
    setLoading(true)
    try {
      const res = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'checkout', priceId, locale }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } finally {
      setLoading(false)
    }
  }

  if (planKey === currentPlan) {
    return (
      <Button type="button" className="w-full" variant="secondary" size="sm" disabled>
        {t('currentPlan')}
      </Button>
    )
  }

  return (
    <Button
      type="button"
      className="w-full"
      variant={popular ? 'default' : 'outline'}
      size="sm"
      loading={loading}
      disabled={!priceId}
      onClick={checkout}
    >
      <ArrowUpRight className="h-4 w-4" />
      {t(`plans.${planKey}.cta`)}
    </Button>
  )
}
