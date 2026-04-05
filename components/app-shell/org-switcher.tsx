'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ChevronDown } from 'lucide-react'
import { setActiveOrganization } from '@/features/organizations/actions'
import type { Organization } from '@/types'

type Row = { organization_id: string; organization: Organization }

export function OrgSwitcher({
  organizations,
  activeOrganizationId,
}: {
  organizations: Row[]
  activeOrganizationId: string
}) {
  const t = useTranslations('common.organization')
  const router = useRouter()

  if (organizations.length <= 1) return null

  async function onChange(orgId: string) {
    if (orgId === activeOrganizationId) return
    const res = await setActiveOrganization(orgId)
    if (res.success) {
      router.refresh()
    }
  }

  const active = organizations.find((o) => o.organization_id === activeOrganizationId)

  return (
    <div className="relative group">
      <button
        type="button"
        className="flex items-center gap-1 rounded-md border border-border bg-muted/40 px-2.5 py-1 text-xs font-medium max-w-[160px]"
      >
        <span className="truncate">{active?.organization.name ?? t('switchOrg')}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
      </button>
      <div className="absolute right-0 top-full mt-1 min-w-full w-max max-w-[240px] rounded-md border bg-background shadow-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
        {organizations.map((o) => (
          <button
            key={o.organization_id}
            type="button"
            onClick={() => onChange(o.organization_id)}
            className={`w-full px-3 py-2 text-left text-xs hover:bg-muted truncate ${o.organization_id === activeOrganizationId ? 'font-semibold text-primary' : ''}`}
          >
            {o.organization.name}
          </button>
        ))}
      </div>
    </div>
  )
}
