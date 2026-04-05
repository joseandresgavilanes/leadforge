import { getTranslations } from 'next-intl/server'
import { tryCreateClient } from '@/lib/db/server'
import { requireAuth, getActiveOrganization } from '@/lib/auth/server'
import { formatDate } from '@/lib/dates'
import { UserAvatar } from '@/components/ui/data-display'
import { Badge } from '@/components/ui/data-display'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/data-display'
import { Shield } from 'lucide-react'
import { InviteMemberDialog } from '@/components/team/invite-member-dialog'
import { can } from '@/lib/rbac/permissions'
import type { OrgRole } from '@/types'

export default async function TeamPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations('team')
  const user = await requireAuth(locale)
  const orgData = await getActiveOrganization(user.id)
  if (!orgData) return null

  const supabase = await tryCreateClient()

  let members: unknown[] = []
  let pendingInvites: unknown[] = []

  if (supabase) {
    const { data: m } = await supabase
      .from('memberships')
      .select('*, profile:profiles(*)')
      .eq('organization_id', orgData.organization.id)
      .not('accepted_at', 'is', null)
      .order('created_at', { ascending: true })
    members = m ?? []

    const { data: inv } = await supabase
      .from('invitations')
      .select('*')
      .eq('organization_id', orgData.organization.id)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
    pendingInvites = inv ?? []
  } else {
    members = [
      {
        ...orgData.membership,
        profile: user.profile,
      },
    ]
  }

  const canInvite = can(orgData.membership.role as OrgRole, 'team:invite')

  const roleColors: Record<string, any> = {
    org_admin: 'default',
    sales_manager: 'info',
    sales_rep: 'success',
    viewer: 'secondary',
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">{t('title')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {members?.length ?? 0} {t('members')}
          </p>
        </div>
        {canInvite ? <InviteMemberDialog locale={locale} /> : null}
      </div>

      {/* Members */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('members')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {members?.map((m: any) => (
              <div key={m.id} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <UserAvatar
                    firstName={m.profile?.first_name}
                    lastName={m.profile?.last_name}
                    avatarUrl={m.profile?.avatar_url}
                    size="md"
                  />
                  <div>
                    <p className="text-sm font-medium">
                      {m.profile?.first_name} {m.profile?.last_name}
                      {m.user_id === user.id && (
                        <span className="ml-2 text-xs text-muted-foreground">({t('you')})</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">{m.profile?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={roleColors[m.role] ?? 'secondary'}>
                    {t(`roles.${m.role}`)}
                  </Badge>
                  <p className="text-xs text-muted-foreground hidden md:block">
                    {formatDate(m.accepted_at, locale)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {(pendingInvites?.length ?? 0) > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t('invite.pending')}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {pendingInvites?.map((inv: any) => (
                <div key={inv.id} className="flex items-center justify-between px-6 py-4">
                  <div>
                    <p className="text-sm font-medium">{inv.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Expires {formatDate(inv.expires_at, locale)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="warning">{t('invite.pending')}</Badge>
                    <Badge variant="secondary">{t(`roles.${inv.role}`)}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Role guide */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            {t('roleGuideTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4">
            {['org_admin', 'sales_manager', 'sales_rep', 'viewer'].map((role) => (
              <div key={role} className="rounded-lg border p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <Badge variant={roleColors[role] ?? 'secondary'}>{t(`roles.${role}`)}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{t(`roleDescriptions.${role}`)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
