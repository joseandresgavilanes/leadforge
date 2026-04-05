import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { getSequenceWithSteps, listEnrollments } from '@/features/sequences/actions'
import { requireAuth, getActiveOrganization } from '@/lib/auth/server'
import { can } from '@/lib/rbac/permissions'
import type { OrgRole } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/data-display'
import { formatRelative } from '@/lib/utils'
import { AddSequenceStepForm } from '@/components/crm/add-sequence-step-form'
import { EnrollSequenceForm } from '@/components/crm/enroll-sequence-form'
import { SequenceEnrollmentActions } from '@/components/crm/sequence-enrollment-actions'
import { SequenceExitOnTerminalForm } from '@/components/crm/sequence-exit-on-terminal-form'

export default async function SequenceDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  const t = await getTranslations('workspace.sequences')
  const tc = await getTranslations('common')
  const user = await requireAuth(locale)
  const orgData = await getActiveOrganization(user.id)
  if (!orgData) return null

  const canManage = can(orgData.membership.role as OrgRole, 'sequences:manage')
  let pack: Awaited<ReturnType<typeof getSequenceWithSteps>> = null
  let enrollments: Awaited<ReturnType<typeof listEnrollments>> = []
  try {
    ;[pack, enrollments] = await Promise.all([getSequenceWithSteps(id), listEnrollments(id)])
  } catch {
    pack = null
  }
  if (!pack) notFound()

  const { sequence, steps } = pack
  const base = `/${locale}/app`

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href={`${base}/sequences`}>
            <Button variant="ghost" size="sm">
              {tc('actions.back')}
            </Button>
          </Link>
          <h1 className="mt-1 text-2xl font-heading font-bold">{sequence.name}</h1>
          {sequence.description && <p className="text-sm text-muted-foreground">{sequence.description}</p>}
        </div>
      </div>

      {canManage && (
        <SequenceExitOnTerminalForm sequenceId={id} exitOnTerminalStage={sequence.exit_on_terminal_stage} />
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{t('steps')}</h2>
        {steps.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('emptySteps')}</p>
        ) : (
          <ol className="list-decimal space-y-2 pl-5 text-sm">
            {steps.map((s) => (
              <li key={s.id} className="rounded-md border bg-card p-3">
                <span className="font-medium">
                  {t(`stepLabels.${s.step_type as 'email' | 'task' | 'wait'}`)}
                </span>
                {s.step_type === 'email' && (
                  <p className="text-muted-foreground">
                    {s.email_subject} — {s.email_body?.slice(0, 120)}
                    {(s.email_body?.length ?? 0) > 120 ? '…' : ''}
                  </p>
                )}
                {s.step_type === 'task' && (
                  <p className="text-muted-foreground">
                    {s.task_title} · {t('taskDueDays')}: {s.task_due_days ?? 1}
                  </p>
                )}
                {s.step_type === 'wait' && (
                  <p className="text-muted-foreground">
                    {t('waitHours')}: {s.wait_hours ?? 24}
                  </p>
                )}
              </li>
            ))}
          </ol>
        )}
        {canManage && <AddSequenceStepForm sequenceId={id} position={steps.length} />}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{t('enrollments')}</h2>
        {canManage && <EnrollSequenceForm sequenceId={id} />}
        {enrollments.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('emptyEnrollments')}</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left">
                  <th className="px-3 py-2 font-medium text-muted-foreground">{t('colStatus')}</th>
                  <th className="px-3 py-2 font-medium text-muted-foreground">{t('colStep')}</th>
                  <th className="px-3 py-2 font-medium text-muted-foreground">{t('colNext')}</th>
                  <th className="px-3 py-2 text-right font-medium text-muted-foreground">{t('colActions')}</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((e) => (
                  <tr key={e.id} className="border-b last:border-0">
                    <td className="px-3 py-2">
                      <Badge variant={e.status === 'active' ? 'success' : 'secondary'}>
                        {t(`status.${e.status as 'active' | 'paused' | 'completed' | 'cancelled'}`)}
                      </Badge>
                    </td>
                    <td className="px-3 py-2">{e.current_step_index + 1}</td>
                    <td className="px-3 py-2 text-muted-foreground">{formatRelative(e.next_run_at, locale)}</td>
                    <td className="px-3 py-2 text-right">
                      {canManage && (
                        <SequenceEnrollmentActions
                          enrollmentId={e.id}
                          status={e.status}
                          nextRunAt={e.next_run_at}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
