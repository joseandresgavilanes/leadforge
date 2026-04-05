'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { advanceSequenceEnrollment, updateEnrollmentStatus } from '@/features/sequences/actions'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'

export function SequenceEnrollmentActions({
  enrollmentId,
  status,
  nextRunAt,
}: {
  enrollmentId: string
  status: string
  nextRunAt: string
}) {
  const t = useTranslations('workspace.sequences')
  const tc = useTranslations('common')
  const router = useRouter()
  const [pending, start] = useTransition()
  const waitBlocked = status === 'active' && new Date(nextRunAt).getTime() > Date.now()

  function run(fn: () => Promise<{ success: boolean; error?: string }>) {
    start(async () => {
      const res = await fn()
      if (!res.success) {
        toast({ title: res.error ?? tc('errors.generic'), variant: 'destructive' })
        return
      }
      router.refresh()
    })
  }

  if (status !== 'active') {
    return (
      <div className="flex flex-wrap gap-1">
        {status === 'paused' && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            loading={pending}
            onClick={() => run(() => updateEnrollmentStatus(enrollmentId, 'active'))}
          >
            {t('resume')}
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          loading={pending}
          onClick={() => run(() => updateEnrollmentStatus(enrollmentId, 'cancelled'))}
        >
          {t('cancel')}
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-1">
      <Button
        type="button"
        size="sm"
        loading={pending}
        disabled={waitBlocked}
        onClick={() => run(() => advanceSequenceEnrollment(enrollmentId))}
      >
        {t('advance')}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        loading={pending}
        onClick={() => run(() => updateEnrollmentStatus(enrollmentId, 'paused'))}
      >
        {t('pause')}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        loading={pending}
        onClick={() => run(() => updateEnrollmentStatus(enrollmentId, 'cancelled'))}
      >
        {t('cancel')}
      </Button>
    </div>
  )
}
