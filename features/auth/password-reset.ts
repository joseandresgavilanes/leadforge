'use server'

import { resetPasswordSchema } from '@/lib/validators/schemas'
import { createServiceRoleClient } from '@/lib/db/service-role'
import { sendPasswordResetEmail } from '@/lib/resend/emails'

/** Always returns success when email is valid shape to avoid account enumeration. */
export async function requestPasswordReset(email: string, locale: string): Promise<{ ok: boolean }> {
  const parsed = resetPasswordSchema.safeParse({ email })
  if (!parsed.success) return { ok: true }

  try {
    const admin = createServiceRoleClient()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const nextPath = `/${locale}/update-password`
    const { data, error } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email: parsed.data.email,
      options: {
        redirectTo: `${appUrl}/auth/callback?next=${encodeURIComponent(nextPath)}`,
      },
    })

    if (!error && data?.properties?.action_link) {
      await sendPasswordResetEmail({
        to: parsed.data.email,
        resetLink: data.properties.action_link,
        locale: locale === 'es' ? 'es' : 'en',
      })
    }
  } catch {
    // ignore
  }

  return { ok: true }
}
