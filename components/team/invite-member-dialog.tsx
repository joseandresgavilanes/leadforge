'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { inviteTeamMember } from '@/features/organizations/actions'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/form-elements'
import { toast } from '@/hooks/use-toast'
import type { OrgRole } from '@/types'

export function InviteMemberDialog({ locale }: { locale: string }) {
  const t = useTranslations('team')
  const ti = useTranslations('team.invite')
  const tr = useTranslations('team.roles')
  const tc = useTranslations('common')
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<OrgRole>('sales_rep')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await inviteTeamMember({ email, role }, locale)
    setLoading(false)
    if (!res.success) {
      toast({ title: res.error ?? tc('errors.generic'), variant: 'destructive' })
      return
    }
    toast({ title: ti('success', { email }) })
    setOpen(false)
    setEmail('')
    router.refresh()
  }

  if (!open) {
    return (
      <Button type="button" onClick={() => setOpen(true)}>
        {t('inviteTeamMember')}
      </Button>
    )
  }

  return (
    <div className="rounded-lg border bg-card p-6 max-w-md space-y-4">
      <h3 className="font-heading font-semibold">{ti('title')}</h3>
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="invEmail">{ti('email')}</Label>
          <Input id="invEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="invRole">{ti('role')}</Label>
          <select id="invRole" className="flex h-10 w-full rounded-md border px-3 text-sm" value={role} onChange={(e) => setRole(e.target.value as OrgRole)}>
            {(['org_admin', 'sales_manager', 'sales_rep', 'viewer'] as const).map((r) => (
              <option key={r} value={r}>{tr(r)}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <Button type="submit" loading={loading}>{ti('send')}</Button>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>{tc('actions.cancel')}</Button>
        </div>
      </form>
    </div>
  )
}
