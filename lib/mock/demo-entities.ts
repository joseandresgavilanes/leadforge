import type { Organization, Membership, Profile } from '@/types'

/** Stable IDs for offline demo (no DB). */
export const MOCK_USER_ID = '00000000-0000-4000-8000-000000000001'
export const MOCK_ORG_ID = '00000000-0000-4000-8000-000000000002'

export const MOCK_ORGANIZATION: Organization = {
  id: MOCK_ORG_ID,
  name: 'Demo Org',
  slug: 'demo-org',
  domain: null,
  industry: null,
  timezone: 'UTC',
  currency: 'USD',
  logo_url: null,
  plan: 'growth',
  stripe_customer_id: null,
  stripe_subscription_id: null,
  subscription_status: 'active',
  trial_ends_at: null,
  created_by: MOCK_USER_ID,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

export function buildMockProfile(email: string, firstName?: string | null, lastName?: string | null): Profile {
  return {
    id: MOCK_USER_ID,
    first_name: firstName ?? 'Demo',
    last_name: lastName ?? 'User',
    email,
    phone: null,
    job_title: null,
    avatar_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

export function buildMockMembership(role: Membership['role'] = 'org_admin'): Membership {
  return {
    id: '00000000-0000-4000-8000-000000000003',
    organization_id: MOCK_ORG_ID,
    user_id: MOCK_USER_ID,
    role,
    invited_by: null,
    invited_at: null,
    accepted_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}
