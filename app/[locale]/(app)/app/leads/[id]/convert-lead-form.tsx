'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { convertLead } from '@/features/leads/actions'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import type { OpportunityStage } from '@/types'

export type SelectOption = { id: string; label: string }

export default function ConvertLeadForm({
  locale,
  leadId,
  stages,
  contactOptions,
  companyOptions,
}: {
  locale: string
  leadId: string
  stages: OpportunityStage[]
  contactOptions: SelectOption[]
  companyOptions: SelectOption[]
}) {
  const t = useTranslations('leads.convert')
  const tc = useTranslations('common')
  const router = useRouter()
  const [contact, setContact] = useState(true)
  const [company, setCompany] = useState(true)
  const [opportunity, setOpportunity] = useState(false)
  const [existingContactId, setExistingContactId] = useState('')
  const [existingCompanyId, setExistingCompanyId] = useState('')
  const [stageId, setStageId] = useState(stages[0]?.id ?? '')
  const [oppName, setOppName] = useState('')
  const [oppValue, setOppValue] = useState('0')
  const [loading, setLoading] = useState(false)

  const openStages = stages.filter((s) => !s.is_closed_won && !s.is_closed_lost)

  async function onConvert() {
    if (opportunity && !stageId) {
      toast({ title: tc('errors.generic'), variant: 'destructive' })
      return
    }
    if (!contact && !existingContactId) {
      toast({ title: tc('errors.generic'), variant: 'destructive' })
      return
    }
    if (contact && existingContactId) {
      toast({ title: tc('errors.generic'), variant: 'destructive' })
      return
    }
    if (company && existingCompanyId) {
      toast({ title: tc('errors.generic'), variant: 'destructive' })
      return
    }
    setLoading(true)
    const res = await convertLead({
      leadId,
      createContact: contact,
      createCompany: company,
      createOpportunity: opportunity,
      existingContactId: !contact ? existingContactId : undefined,
      existingCompanyId: !company ? existingCompanyId || undefined : undefined,
      opportunityName: oppName || undefined,
      opportunityValue: opportunity ? Number(oppValue) || 0 : undefined,
      stageId: opportunity ? stageId : undefined,
    })
    setLoading(false)
    if (!res.success) {
      toast({ title: res.error ?? tc('errors.generic'), variant: 'destructive' })
      return
    }
    toast({ title: t('success') })
    router.push(`/${locale}/app/leads/${leadId}`)
    router.refresh()
  }

  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <h2 className="font-heading font-semibold text-lg">{t('title')}</h2>
      <p className="text-sm text-muted-foreground">{t('description')}</p>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={contact} onChange={(e) => { setContact(e.target.checked); if (e.target.checked) setExistingContactId('') }} />
        {t('createContact')}
      </label>
      {!contact && (
        <div className="space-y-1 pl-4 border-l-2 border-primary/20">
          <label className="text-xs font-medium">{t('selectContact')}</label>
          <select
            className="flex h-9 w-full max-w-md rounded-md border px-3 text-sm"
            value={existingContactId}
            onChange={(e) => setExistingContactId(e.target.value)}
          >
            <option value="">—</option>
            {contactOptions.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
      )}
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={company} onChange={(e) => { setCompany(e.target.checked); if (e.target.checked) setExistingCompanyId('') }} />
        {t('createCompany')}
      </label>
      {!company && (
        <div className="space-y-1 pl-4 border-l-2 border-primary/20">
          <label className="text-xs font-medium">{t('selectCompany')}</label>
          <select
            className="flex h-9 w-full max-w-md rounded-md border px-3 text-sm"
            value={existingCompanyId}
            onChange={(e) => setExistingCompanyId(e.target.value)}
          >
            <option value="">—</option>
            {companyOptions.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
      )}
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={opportunity} onChange={(e) => setOpportunity(e.target.checked)} />
        {t('createOpportunity')}
      </label>
      {opportunity && (
        <div className="space-y-3 pl-4 border-l-2 border-primary/20">
          <div className="space-y-1">
            <label className="text-xs font-medium">{t('opportunityName')}</label>
            <input name="opportunityName" className="flex h-9 w-full rounded-md border px-3 text-sm" value={oppName} onChange={(e) => setOppName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">{t('opportunityValue')}</label>
            <input name="opportunityValue" type="number" className="flex h-9 w-full rounded-md border px-3 text-sm" value={oppValue} onChange={(e) => setOppValue(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">{t('stage')}</label>
            <select className="flex h-9 w-full rounded-md border px-3 text-sm" value={stageId} onChange={(e) => setStageId(e.target.value)}>
              {openStages.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}
      <Button type="button" onClick={onConvert} loading={loading}>{tc('actions.convert')}</Button>
    </div>
  )
}
