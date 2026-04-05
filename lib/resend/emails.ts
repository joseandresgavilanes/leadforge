import { Resend } from 'resend'

let resendSingleton: Resend | null = null

function getResend(): Resend {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error('RESEND_API_KEY is not set')
  resendSingleton ??= new Resend(key)
  return resendSingleton
}

const FROM = 'LeadForge <noreply@leadforge.io>'

// --- Email templates ---

export async function sendWelcomeEmail({
  to,
  firstName,
  locale = 'en',
}: {
  to: string
  firstName: string
  locale?: string
}) {
  const subject = locale === 'es'
    ? '¡Bienvenido a LeadForge!'
    : 'Welcome to LeadForge!'

  const html = locale === 'es'
    ? `
      <h1>¡Hola, ${firstName}!</h1>
      <p>Gracias por unirte a LeadForge. Tu prueba de 14 días ha comenzado.</p>
      <p>Comienza capturando tu primer lead y configura tu pipeline.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/es/app/dashboard" style="background:#123C66;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:16px">
        Ir al Panel
      </a>
      <p style="margin-top:24px;color:#5E6B7A">Si tienes preguntas, responde a este correo.</p>
    `
    : `
      <h1>Hi ${firstName},</h1>
      <p>Thanks for joining LeadForge. Your 14-day trial has started.</p>
      <p>Get started by capturing your first lead and setting up your pipeline.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/en/app/dashboard" style="background:#123C66;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:16px">
        Go to Dashboard
      </a>
      <p style="margin-top:24px;color:#5E6B7A">If you have questions, just reply to this email.</p>
    `

  return getResend().emails.send({ from: FROM, to, subject, html })
}

export async function sendPasswordResetEmail({
  to,
  resetLink,
  locale = 'en',
}: {
  to: string
  resetLink: string
  locale?: string
}) {
  const subject = locale === 'es'
    ? 'Restablece tu contraseña — LeadForge'
    : 'Reset your password — LeadForge'

  const html = locale === 'es'
    ? `
      <h1>Restablecer contraseña</h1>
      <p>Recibimos una solicitud para restablecer tu contraseña.</p>
      <a href="${resetLink}" style="background:#123C66;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:16px">
        Restablecer Contraseña
      </a>
      <p style="margin-top:16px;color:#5E6B7A">Este enlace expira en 1 hora. Si no solicitaste esto, ignora este correo.</p>
    `
    : `
      <h1>Reset your password</h1>
      <p>We received a request to reset your password.</p>
      <a href="${resetLink}" style="background:#123C66;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:16px">
        Reset Password
      </a>
      <p style="margin-top:16px;color:#5E6B7A">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
    `

  return getResend().emails.send({ from: FROM, to, subject, html })
}

export async function sendInvitationEmail({
  to,
  inviterName,
  orgName,
  inviteLink,
  locale = 'en',
}: {
  to: string
  inviterName: string
  orgName: string
  inviteLink: string
  locale?: string
}) {
  const subject = locale === 'es'
    ? `${inviterName} te invitó a ${orgName} en LeadForge`
    : `${inviterName} invited you to ${orgName} on LeadForge`

  const html = locale === 'es'
    ? `
      <h1>Tienes una invitación</h1>
      <p><strong>${inviterName}</strong> te invitó a unirte a <strong>${orgName}</strong> en LeadForge.</p>
      <a href="${inviteLink}" style="background:#123C66;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:16px">
        Aceptar Invitación
      </a>
      <p style="margin-top:16px;color:#5E6B7A">Esta invitación expira en 7 días.</p>
    `
    : `
      <h1>You have an invitation</h1>
      <p><strong>${inviterName}</strong> invited you to join <strong>${orgName}</strong> on LeadForge.</p>
      <a href="${inviteLink}" style="background:#123C66;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:16px">
        Accept Invitation
      </a>
      <p style="margin-top:16px;color:#5E6B7A">This invitation expires in 7 days.</p>
    `

  return getResend().emails.send({ from: FROM, to, subject, html })
}

export async function sendDemoConfirmationEmail({
  to,
  firstName,
  locale = 'en',
}: {
  to: string
  firstName: string
  locale?: string
}) {
  const subject = locale === 'es'
    ? 'Confirmación de demo — LeadForge'
    : 'Demo confirmation — LeadForge'

  const html = locale === 'es'
    ? `
      <h1>¡Gracias, ${firstName}!</h1>
      <p>Recibimos tu solicitud de demo. Te contactaremos en 1 día hábil para agendar.</p>
      <p style="color:#5E6B7A">El equipo de LeadForge</p>
    `
    : `
      <h1>Thanks, ${firstName}!</h1>
      <p>We received your demo request. We'll reach out within 1 business day to schedule.</p>
      <p style="color:#5E6B7A">The LeadForge team</p>
    `

  return getResend().emails.send({ from: FROM, to, subject, html })
}

export async function sendTrialEndingEmail({
  to,
  firstName,
  daysLeft,
  upgradeLink,
  locale = 'en',
}: {
  to: string
  firstName: string
  daysLeft: number
  upgradeLink: string
  locale?: string
}) {
  const subject = locale === 'es'
    ? `Tu prueba de LeadForge termina en ${daysLeft} días`
    : `Your LeadForge trial ends in ${daysLeft} days`

  const html = locale === 'es'
    ? `
      <h1>Tu prueba termina pronto</h1>
      <p>Hola ${firstName}, tu prueba gratuita de LeadForge termina en <strong>${daysLeft} días</strong>.</p>
      <p>Mejora ahora para no perder tu pipeline, contactos y datos.</p>
      <a href="${upgradeLink}" style="background:#123C66;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:16px">
        Mejorar Ahora
      </a>
    `
    : `
      <h1>Your trial ends soon</h1>
      <p>Hi ${firstName}, your LeadForge free trial ends in <strong>${daysLeft} days</strong>.</p>
      <p>Upgrade now to keep your pipeline, contacts, and data.</p>
      <a href="${upgradeLink}" style="background:#123C66;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:16px">
        Upgrade Now
      </a>
    `

  return getResend().emails.send({ from: FROM, to, subject, html })
}
