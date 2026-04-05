import { notFound, redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { Zap } from 'lucide-react'
import { getSessionUser } from '@/lib/auth/server'
import { createServiceRoleClient } from '@/lib/db/service-role'
import AcceptInviteClient from './accept-invite-client'

export const dynamic = 'force-dynamic'

export default async function InvitePage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>
}) {
  const { locale, token } = await params
  const t = await getTranslations('auth.invite')

  let orgName = 'LeadForge'
  try {
    const admin = createServiceRoleClient()
    const { data: inv } = await admin
      .from('invitations')
      .select('email, expires_at, accepted_at, organization:organizations(name)')
      .eq('token', token)
      .maybeSingle()

    if (!inv || inv.accepted_at) notFound()
    if (inv.expires_at && new Date(inv.expires_at) < new Date()) {
      return (
        <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
          <p className="text-sm text-brand-text-muted">{t('expired')}</p>
        </div>
      )
    }
    const org = inv.organization as { name: string } | null
    if (org?.name) orgName = org.name
  } catch {
    notFound()
  }

  const user = await getSessionUser()
  if (!user) {
    const next = encodeURIComponent(`/${locale}/invite/${token}`)
    redirect(`/${locale}/login?next=${next}`)
  }

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Link href={`/${locale}`} className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-primary">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="font-heading font-bold text-xl text-brand-primary">LeadForge</span>
          </Link>
        </div>

        <div className="rounded-2xl border bg-white shadow-sm p-8 text-center space-y-4">
          <h1 className="font-heading text-2xl font-bold text-brand-text-main">{t('title')}</h1>
          <p className="text-sm text-brand-text-muted">{t('subtitle', { orgName })}</p>
          <AcceptInviteClient token={token} locale={locale} />
        </div>
      </div>
    </div>
  )
}
