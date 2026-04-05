'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { acceptInvitation } from '@/features/organizations/actions'
import { Button } from '@/components/ui/button'

export default function AcceptInviteClient({ token, locale }: { token: string; locale: string }) {
  const t = useTranslations('auth.invite')
  const [err, setErr] = useState('')
  const [pending, start] = useTransition()

  function onAccept() {
    setErr('')
    start(async () => {
      const res = await acceptInvitation(token, locale)
      if (res && !res.success) setErr(res.error ?? '')
    })
  }

  return (
    <div className="space-y-3">
      {err ? <p className="text-sm text-destructive">{err}</p> : null}
      <Button className="w-full" loading={pending} onClick={onAccept}>
        {t('acceptInvite')}
      </Button>
    </div>
  )
}
