'use client'

import { useRouter } from 'next/navigation'
import { completeTask } from '@/features/tasks/actions'
import { Button } from '@/components/ui/button'

export function TaskCompleteButton({ taskId, label }: { taskId: string; label: string }) {
  const router = useRouter()
  return (
    <Button
      type="button"
      size="sm"
      variant="secondary"
      onClick={async () => {
        await completeTask(taskId)
        router.refresh()
      }}
    >
      {label}
    </Button>
  )
}
