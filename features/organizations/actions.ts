'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { tryCreateClient } from '@/lib/db/server'
import { isOfflineDemoMode } from '@/lib/config/backend'
import { OFFLINE_ACTION_ERROR } from '@/lib/mock/offline-messages'
import { createServiceRoleClient } from '@/lib/db/service-role'
import { requireAuth, getUserOrganizations } from '@/lib/auth/server'
import { requirePermission } from '@/lib/rbac/permissions'
import { organizationSchema, inviteMemberSchema, type InviteMemberInput } from '@/lib/validators/schemas'
import { sendInvitationEmail, sendWelcomeEmail } from '@/lib/resend/emails'
import { trackEvent } from '@/lib/analytics/track'
import { DEFAULT_OPPORTUNITY_STAGES, slugifyOrgName } from '@/features/organizations/constants'
import type { ActionResult, Membership, Organization, OrgRole } from '@/types'

const ACTIVE_ORG_COOKIE = 'lf_active_org'

export async function updateOrganizationProfile(input: {
  name: string
  timezone?: string
  currency?: string
}): Promise<ActionResult<void>> {
  try {
    const user = await requireAuth()
    const supabase = await tryCreateClient()
    if (!supabase) return { success: false, error: OFFLINE_ACTION_ERROR }

    const orgData = await getUserOrganizations(user.id)
    const cookieOrg = (await cookies()).get(ACTIVE_ORG_COOKIE)?.value
    const row =
      (cookieOrg ? orgData.find((m) => m.organization_id === cookieOrg) : null) ?? orgData[0]
    if (!row) return { success: false, error: 'No organization' }
    const m = row as Membership & { organization: Organization }
    requirePermission(m.role as OrgRole, 'settings:update')

    const { error } = await supabase
      .from('organizations')
      .update({
        name: input.name,
        timezone: input.timezone ?? m.organization.timezone,
        currency: input.currency ?? m.organization.currency,
        updated_at: new Date().toISOString(),
      })
      .eq('id', m.organization.id)

    if (error) return { success: false, error: error.message }
    revalidatePath('/', 'layout')
    return { success: true, data: undefined }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Update failed' }
  }
}

export async function setActiveOrganization(organizationId: string): Promise<ActionResult<void>> {
  try {
    const user = await requireAuth()
    const supabase = await tryCreateClient()
    if (!supabase) {
      const orgs = await getUserOrganizations(user.id)
      const ok = orgs.some((m) => m.organization_id === organizationId)
      if (!ok) return { success: false, error: 'Not a member of this organization' }
    } else {
      const { data } = await supabase
        .from('memberships')
        .select('id')
        .eq('user_id', user.id)
        .eq('organization_id', organizationId)
        .not('accepted_at', 'is', null)
        .maybeSingle()

      if (!data) return { success: false, error: 'Not a member of this organization' }
    }

    const jar = await cookies()
    jar.set(ACTIVE_ORG_COOKIE, organizationId, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })

    revalidatePath('/', 'layout')
    return { success: true, data: undefined }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Failed to switch organization' }
  }
}

export async function completeOnboarding(input: {
  organizationName: string
  industry?: string | null
  timezone?: string
  currency?: string
  locale: string
}): Promise<ActionResult<{ organizationId: string }>> {
  try {
    if (isOfflineDemoMode()) {
      return { success: false, error: OFFLINE_ACTION_ERROR }
    }

    const user = await requireAuth()
    const parsed = organizationSchema.parse({
      name: input.organizationName,
      industry: input.industry ?? null,
      timezone: input.timezone ?? 'UTC',
      currency: input.currency ?? 'USD',
    })

    const userClient = await tryCreateClient()
    if (!userClient) return { success: false, error: OFFLINE_ACTION_ERROR }
    const { data: existing } = await userClient
      .from('memberships')
      .select('id')
      .eq('user_id', user.id)
      .not('accepted_at', 'is', null)
      .limit(1)

    if (existing?.length) {
      return { success: false, error: 'You already belong to an organization' }
    }

    const admin = createServiceRoleClient()
    const baseSlug = slugifyOrgName(parsed.name)
    let slug = baseSlug
    let n = 0
    while (n < 50) {
      const { data: clash } = await admin.from('organizations').select('id').eq('slug', slug).maybeSingle()
      if (!clash) break
      n += 1
      slug = `${baseSlug}-${n}`
    }

    const trialEnds = new Date()
    trialEnds.setDate(trialEnds.getDate() + 14)

    const { data: org, error: orgErr } = await admin
      .from('organizations')
      .insert({
        name: parsed.name,
        slug,
        industry: parsed.industry?.trim() || null,
        timezone: parsed.timezone,
        currency: parsed.currency,
        plan: 'starter',
        subscription_status: 'trialing',
        trial_ends_at: trialEnds.toISOString(),
        created_by: user.id,
      })
      .select('id')
      .single()

    if (orgErr || !org) return { success: false, error: orgErr?.message ?? 'Could not create organization' }

    const { error: memErr } = await admin.from('memberships').insert({
      organization_id: org.id,
      user_id: user.id,
      role: 'org_admin',
      accepted_at: new Date().toISOString(),
    })

    if (memErr) return { success: false, error: memErr.message }

    const stages = DEFAULT_OPPORTUNITY_STAGES.map((s) => ({
      organization_id: org.id,
      name: s.name,
      position: s.position,
      probability: s.probability,
      color: s.color,
      is_closed_won: s.is_closed_won,
      is_closed_lost: s.is_closed_lost,
    }))

    await admin.from('opportunity_stages').insert(stages)

    const jar = await cookies()
    jar.set(ACTIVE_ORG_COOKIE, org.id, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })

    await trackEvent('trial_started', { organizationId: org.id, userId: user.id })

    const first = user.profile?.first_name ?? user.email.split('@')[0]
    try {
      await sendWelcomeEmail({ to: user.email, firstName: first, locale: input.locale === 'es' ? 'es' : 'en' })
    } catch {
      // Email failure must not block onboarding
    }

    revalidatePath('/', 'layout')
    return { success: true, data: { organizationId: org.id } }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Onboarding failed' }
  }
}

export async function inviteTeamMember(
  raw: InviteMemberInput,
  locale: string
): Promise<ActionResult<void>> {
  try {
    const user = await requireAuth()
    const supabase = await tryCreateClient()
    if (!supabase) return { success: false, error: OFFLINE_ACTION_ERROR }

    const orgs = await getUserOrganizations(user.id)
    const cookieOrg = (await cookies()).get(ACTIVE_ORG_COOKIE)?.value
    const membership =
      (cookieOrg ? orgs.find((m) => m.organization_id === cookieOrg) : null) ?? orgs[0]
    if (!membership) return { success: false, error: 'No organization' }

    const m = membership as Membership & { organization: Organization }
    const org = m.organization
    requirePermission(m.role as OrgRole, 'team:invite')

    const validated = inviteMemberSchema.parse(raw)

    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', validated.email)
      .maybeSingle()

    if (existingUser) {
      const { data: already } = await supabase
        .from('memberships')
        .select('id')
        .eq('organization_id', org.id)
        .eq('user_id', existingUser.id)
        .maybeSingle()
      if (already) return { success: false, error: 'User is already a member' }
    }

    const { data: pending } = await supabase
      .from('invitations')
      .select('id')
      .eq('organization_id', org.id)
      .eq('email', validated.email)
      .is('accepted_at', null)
      .maybeSingle()

    if (pending) return { success: false, error: 'An invitation is already pending for this email' }

    const { data: inv, error } = await supabase
      .from('invitations')
      .insert({
        organization_id: org.id,
        email: validated.email,
        role: validated.role,
        invited_by: user.id,
      })
      .select('token')
      .single()

    if (error) return { success: false, error: error.message }

    const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const inviteLink = `${base}/${locale}/invite/${inv.token}`

    const inviterName =
      [user.profile?.first_name, user.profile?.last_name].filter(Boolean).join(' ') || user.email

    await sendInvitationEmail({
      to: validated.email,
      inviterName,
      orgName: org.name,
      inviteLink,
      locale: locale === 'es' ? 'es' : 'en',
    })

    revalidatePath('/[locale]/app/team', 'page')
    return { success: true, data: undefined }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Invite failed' }
  }
}

export async function acceptInvitation(token: string, locale: string): Promise<ActionResult<void>> {
  try {
    if (isOfflineDemoMode()) {
      return { success: false, error: OFFLINE_ACTION_ERROR }
    }

    const user = await requireAuth()
    if (!user.email) return { success: false, error: 'No email on account' }

    const admin = createServiceRoleClient()
    const { data: inv, error: invErr } = await admin
      .from('invitations')
      .select('*')
      .eq('token', token)
      .is('accepted_at', null)
      .maybeSingle()

    if (invErr || !inv) return { success: false, error: 'Invalid or expired invitation' }
    if (inv.expires_at && new Date(inv.expires_at) < new Date()) {
      return { success: false, error: 'Invitation has expired' }
    }
    if (inv.email.toLowerCase() !== user.email.toLowerCase()) {
      return { success: false, error: 'Sign in with the email that received the invitation' }
    }

    const { data: existing } = await admin
      .from('memberships')
      .select('id')
      .eq('organization_id', inv.organization_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!existing) {
      const { error: mErr } = await admin.from('memberships').insert({
        organization_id: inv.organization_id,
        user_id: user.id,
        role: inv.role,
        invited_by: inv.invited_by,
        invited_at: inv.created_at,
        accepted_at: new Date().toISOString(),
      })
      if (mErr) return { success: false, error: mErr.message }
    }

    await admin.from('invitations').update({ accepted_at: new Date().toISOString() }).eq('id', inv.id)

    const jar = await cookies()
    jar.set(ACTIVE_ORG_COOKIE, inv.organization_id, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })

    revalidatePath('/', 'layout')
    redirect(`/${locale}/app/dashboard`)
  } catch (e) {
    if (e && typeof e === 'object' && 'digest' in e) throw e
    return { success: false, error: e instanceof Error ? e.message : 'Could not accept invitation' }
  }
}
