import { cookies } from 'next/headers'
import type { Profile } from '@/types'
import {
  MOCK_USER_ID,
  MOCK_ORGANIZATION,
  buildMockMembership,
  buildMockProfile,
} from '@/lib/mock/demo-entities'
import type { MockSessionPayload } from '@/lib/mock/session-codec'
import { MOCK_SESSION_COOKIE, decodeMockSession } from '@/lib/mock/session-codec'

export type { MockSessionPayload } from '@/lib/mock/session-codec'
export { MOCK_SESSION_COOKIE, encodeMockSession } from '@/lib/mock/session-codec'

export async function readMockSessionFromCookies(): Promise<MockSessionPayload | null> {
  const jar = await cookies()
  const c = jar.get(MOCK_SESSION_COOKIE)?.value
  if (!c) return null
  return decodeMockSession(c)
}

export function mockSessionToUser(payload: MockSessionPayload): {
  id: string
  email: string
  profile: Profile
} {
  return {
    id: MOCK_USER_ID,
    email: payload.email,
    profile: buildMockProfile(payload.email, payload.firstName, payload.lastName),
  }
}

export function mockMembershipsWithOrg(payload?: MockSessionPayload | null) {
  const membership = buildMockMembership()
  const organization =
    payload?.companyName?.trim()
      ? { ...MOCK_ORGANIZATION, name: payload.companyName.trim() }
      : MOCK_ORGANIZATION
  return [
    {
      ...membership,
      organization,
    },
  ]
}
