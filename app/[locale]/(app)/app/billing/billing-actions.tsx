'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { ExternalLink } from 'lucide-react'

export default function BillingActions({ locale, hasSubscription }: { locale: string; hasSubscription: boolean }) {
  const t = useTranslations('billing')
  const [loading, setLoading] = useState(false)

  async function openPortal() {
    setLoading(true)
    try {
      const res = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'portal', locale }),
      })
      const { url } = await res.json()
      if (url) window.location.href = url
    } finally {
      setLoading(false)
    }
  }

  if (!hasSubscription) return null

  return (
    <Button variant="outline" size="sm" onClick={openPortal} loading={loading}>
      <ExternalLink className="h-4 w-4" />
      {t('actions.customerPortal')}
    </Button>
  )
}
