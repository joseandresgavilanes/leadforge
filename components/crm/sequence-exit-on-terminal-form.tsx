'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { updateSequenceSettings } from '@/features/sequences/actions'

export function SequenceExitOnTerminalForm({
  sequenceId,
  exitOnTerminalStage,
}: {
  sequenceId: string
  exitOnTerminalStage: boolean
}) {
  const t = useTranslations('workspace.sequences')
  const [pending, start] = useTransition()
  const router = useRouter()

  return (
    <label className="flex cursor-pointer items-start gap-2 rounded-md border bg-muted/30 p-3 text-sm">
      <input
        type="checkbox"
        className="mt-1"
        defaultChecked={exitOnTerminalStage}
        disabled={pending}
        onChange={(e) => {
          const checked = e.target.checked
          start(async () => {
            await updateSequenceSettings(sequenceId, { exitOnTerminalStage: checked })
            router.refresh()
          })
        }}
      />
      <span>{t('exitOnTerminal')}</span>
    </label>
  )
}
