'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { updateOrganizationProfile } from '@/features/organizations/actions'
import { Input, Label } from '@/components/ui/form-elements'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import type { Organization } from '@/types'

export function OrgSettingsForm({ organization }: { organization: Organization }) {
  const t = useTranslations('settings')
  const tc = useTranslations('common')
  const router = useRouter()
  const [name, setName] = useState(organization.name)
  const [tz, setTz] = useState(organization.timezone)
  const [cur, setCur] = useState(organization.currency)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await updateOrganizationProfile({ name, timezone: tz, currency: cur })
    setLoading(false)
    if (!res.success) {
      toast({ title: res.error ?? tc('errors.generic'), variant: 'destructive' })
      return
    }
    toast({ title: tc('toast.updated', { entity: t('sections.organization') }) })
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-lg border bg-card p-6 max-w-lg">
      <h2 className="font-heading font-semibold">{t('organization.title')}</h2>
      <div className="space-y-1.5">
        <Label htmlFor="orgName">{t('organization.name')}</Label>
        <Input id="orgName" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="tz">{t('organization.timezone')}</Label>
          <Input id="tz" value={tz} onChange={(e) => setTz(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cur">{t('organization.currency')}</Label>
          <Input id="cur" value={cur} onChange={(e) => setCur(e.target.value)} maxLength={3} />
        </div>
      </div>
      <Button type="submit" loading={loading}>{tc('actions.save')}</Button>
    </form>
  )
}
