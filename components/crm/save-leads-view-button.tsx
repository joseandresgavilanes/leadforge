'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createSavedView, type LeadViewFilters } from '@/features/saved-views/actions'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialogs'

export function SaveLeadsViewButton({
  filters,
}: {
  filters: LeadViewFilters
}) {
  const t = useTranslations('workspace.savedViews')
  const tc = useTranslations('common')
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSave() {
    if (!name.trim()) return
    setLoading(true)
    const res = await createSavedView({
      entityType: 'leads',
      name: name.trim(),
      filters,
    })
    setLoading(false)
    if (!res.success) {
      toast({ title: res.error ?? tc('errors.generic'), variant: 'destructive' })
      return
    }
    toast({ title: t('saved') })
    setOpen(false)
    setName('')
    router.refresh()
  }

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        {t('saveCurrent')}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('saveCurrent')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-xs font-medium">{t('viewName')}</label>
            <input
              className="flex h-9 w-full rounded-md border px-3 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('viewName')}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {tc('actions.cancel')}
            </Button>
            <Button type="button" loading={loading} onClick={onSave} disabled={!name.trim()}>
              {t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
