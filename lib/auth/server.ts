import { cookies } from 'next/headers'
import { createClient } from '@/lib/db/server'
import { redirect } from 'next/navigation'
import type { Profile, Membership, Organization, OrgRole } from '@/types'
import { isOfflineDemoMode } from '@/lib/config/backend'
import { MOCK_USER_ID } from '@/lib/mock/demo-entities'
import {
  readMockSessionFromCookies,
  mockSessionToUser,
  mockMembershipsWithOrg,
} from '@/lib/mock/session'

export interface SessionUser {
  id: string
  email: string
  profile: Profile | null
}

export interface OrgContext {
  organization: Organization
  membership: Membership
  role: OrgRole
}

export async function getSessionUser(): Promise<SessionUser | null> {
  if (isOfflineDemoMode()) {
    const payload = await readMockSessionFromCookies()
    if (!payload) return null
    return mockSessionToUser(payload)
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return {
    id: user.id,
    email: user.email!,
    profile,
  }
}

export async function requireAuth(locale = 'en'): Promise<SessionUser> {
  const user = await getSessionUser()
  if (!user) redirect(`/${locale}/login`)
  return user
}

export async function getOrgContext(
  organizationId: string,
  userId: string
): Promise<OrgContext | null> {
  if (isOfflineDemoMode()) {
    if (userId !== MOCK_USER_ID) return null
    const payload = await readMockSessionFromCookies()
    if (!payload) return null
    const rows = mockMembershipsWithOrg(payload)
    const row = rows.find((r) => r.organization_id === organizationId)
    if (!row) return null
    return {
      organization: row.organization,
      membership: row,
      role: row.role,
    }
  }

  const supabase = await createClient()

  const [{ data: organization }, { data: membership }] = await Promise.all([
    supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single(),
    supabase
      .from('memberships')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .not('accepted_at', 'is', null)
      .single(),
  ])

  if (!organization || !membership) return null

  return {
    organization,
    membership,
    role: membership.role,
  }
}

export async function getUserOrganizations(userId: string) {
  if (isOfflineDemoMode()) {
    if (userId !== MOCK_USER_ID) return []
    const payload = await readMockSessionFromCookies()
    if (!payload) return []
    return mockMembershipsWithOrg(payload)
  }

  const supabase = await createClient()

  const { data } = await supabase
    .from('memberships')
    .select(`
      *,
      organization:organizations(*)
    `)
    .eq('user_id', userId)
    .not('accepted_at', 'is', null)
    .order('created_at', { ascending: true })

  return data ?? []
}

export async function getActiveOrganization(
  userId: string,
  preferredOrgId?: string
): Promise<{ organization: Organization; membership: Membership } | null> {
  if (isOfflineDemoMode()) {
    if (userId !== MOCK_USER_ID) return null
    const payload = await readMockSessionFromCookies()
    if (!payload) return null
    const orgs = mockMembershipsWithOrg(payload)
    if (!orgs.length) return null
    const cookieOrgId = preferredOrgId ?? (await cookies()).get('lf_active_org')?.value
    const preferred = cookieOrgId ? orgs.find((m) => m.organization_id === cookieOrgId) : null
    const membership = preferred ?? orgs[0]
    const organization = membership.organization
    return { organization, membership }
  }

  const orgs = await getUserOrganizations(userId)
  if (!orgs.length) return null

  const cookieOrgId = preferredOrgId ?? (await cookies()).get('lf_active_org')?.value

  const preferred = cookieOrgId
    ? orgs.find((m) => m.organization_id === cookieOrgId)
    : null

  const membership = preferred ?? orgs[0]
  const organization = (membership as any).organization as Organization

  return { organization, membership }
}
