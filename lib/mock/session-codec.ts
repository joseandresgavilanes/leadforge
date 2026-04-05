/** Cookie used for offline demo auth (httpOnly, set by Route Handlers). */
export const MOCK_SESSION_COOKIE = 'lf_mock_session'

export type MockSessionPayload = {
  email: string
  firstName?: string | null
  lastName?: string | null
  companyName?: string | null
}

export function encodeMockSession(payload: MockSessionPayload): string {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
}

export function decodeMockSession(raw: string): MockSessionPayload | null {
  try {
    const json = Buffer.from(raw, 'base64url').toString('utf8')
    const v = JSON.parse(json) as MockSessionPayload
    if (!v?.email || typeof v.email !== 'string') return null
    return v
  } catch {
    return null
  }
}
