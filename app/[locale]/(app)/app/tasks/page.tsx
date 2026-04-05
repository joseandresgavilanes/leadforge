import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { getTasks } from '@/features/tasks/actions'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { formatRelative } from '@/lib/utils'
import { TaskCompleteButton } from './task-complete-button'

export default async function TasksPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ filter?: string }>
}) {
  const { locale } = await params
  const sp = await searchParams
  const t = await getTranslations('tasks')
  const tc = await getTranslations('common')

  const status =
    sp.filter === 'overdue' ? 'overdue' : sp.filter === 'completed' ? 'completed' : 'open'
  const tasks = await getTasks({ status: status as 'open' | 'overdue' | 'completed' })
  const base = `/${locale}/app`

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold">{t('title')}</h1>
        </div>
        <Link href={`${base}/tasks/new`}>
          <Button><Plus className="h-4 w-4" />{t('createTask')}</Button>
        </Link>
      </div>
      <div className="flex gap-2 flex-wrap">
        {(['open', 'overdue', 'completed'] as const).map((f) => (
          <Link key={f} href={f === 'open' ? `${base}/tasks` : `${base}/tasks?filter=${f}`}>
            <Button variant={sp.filter === f || (!sp.filter && f === 'open') ? 'default' : 'outline'} size="sm">
              {t(`statuses.${f === 'open' ? 'open' : f === 'overdue' ? 'overdue' : 'completed'}`)}
            </Button>
          </Link>
        ))}
      </div>
      <div className="rounded-lg border bg-card divide-y">
        {tasks.length === 0 ? (
          <p className="p-8 text-center text-muted-foreground">{t('empty.title')}</p>
        ) : (
          tasks.map((task: any) => (
            <div key={task.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div>
                <p className="font-medium text-sm">{task.title}</p>
                <p className="text-xs text-muted-foreground">
                  {tc(`priority.${task.priority}`)}
                  {task.due_date && ` · ${formatRelative(task.due_date, locale)}`}
                </p>
              </div>
              {!task.completed_at && <TaskCompleteButton taskId={task.id} label={t('completeTask')} />}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
