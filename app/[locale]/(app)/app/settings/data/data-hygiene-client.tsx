'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import {
  IMPORT_CANONICAL_KEYS,
  parseImportCsvHeaders,
  runCsvImport,
  type ImportEntityType,
  type ImportSummary,
} from '@/features/imports/actions'
import { listContactDuplicateGroups, mergeContacts, type ContactDupGroup } from '@/features/dedupe/actions'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'

type Tab = 'import' | 'dedupe'

export function DataHygieneClient({
  locale,
  canImport,
  canMerge,
}: {
  locale: string
  canImport: boolean
  canMerge: boolean
}) {
  const t = useTranslations('dataHygiene')
  const tc = useTranslations('common')
  const [tab, setTab] = useState<Tab>('import')
  const [entityType, setEntityType] = useState<ImportEntityType>('leads')
  const [csvText, setCsvText] = useState('')
  const [fileName, setFileName] = useState<string | null>(null)
  const [headers, setHeaders] = useState<string[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [lastSummary, setLastSummary] = useState<ImportSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [dupGroups, setDupGroups] = useState<ContactDupGroup[]>([])
  const [dupLoading, setDupLoading] = useState(false)
  const [primaryId, setPrimaryId] = useState<string>('')
  const [secondaryId, setSecondaryId] = useState<string>('')

  const keys = useMemo(() => IMPORT_CANONICAL_KEYS[entityType], [entityType])

  const loadHeaders = useCallback(async () => {
    if (!csvText.trim()) {
      setHeaders([])
      return
    }
    setLoading(true)
    const res = await parseImportCsvHeaders(csvText)
    setLoading(false)
    setHeaders(res.headers)
    const next: Record<string, string> = {}
    for (const k of IMPORT_CANONICAL_KEYS[entityType]) {
      const match = res.headers.find((h) => h.toLowerCase().replace(/\s+/g, '') === k.toLowerCase())
      next[k] = match ?? ''
    }
    setMapping(next)
  }, [csvText, entityType])

  useEffect(() => {
    void loadHeaders()
  }, [loadHeaders])

  useEffect(() => {
    if (tab !== 'dedupe' || !canImport) return
    setDupLoading(true)
    void listContactDuplicateGroups()
      .then(setDupGroups)
      .catch(() => toast({ title: t('loadError'), variant: 'destructive' }))
      .finally(() => setDupLoading(false))
  }, [tab, canImport, t])

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFileName(f.name)
    const text = await f.text()
    setCsvText(text)
  }

  async function execute(dryRun: boolean) {
    if (!csvText.trim()) {
      toast({ title: tc('errors.generic'), variant: 'destructive' })
      return
    }
    setLoading(true)
    const res = await runCsvImport({
      entityType,
      csvText,
      mapping,
      dryRun,
      fileName,
    })
    setLoading(false)
    if (!res.success) {
      toast({ title: res.error ?? tc('errors.generic'), variant: 'destructive' })
      return
    }
    if (!res.data) {
      toast({ title: tc('errors.generic'), variant: 'destructive' })
      return
    }
    setLastSummary(res.data)
    toast({
      title: dryRun ? t('preview') : t('summary'),
      description: `${t('created')}: ${res.data.created} · ${t('skipped')}: ${res.data.skipped} · ${t('failed')}: ${res.data.failed}`,
    })
  }

  async function onMerge() {
    if (!primaryId || !secondaryId) return
    setLoading(true)
    const res = await mergeContacts(primaryId, secondaryId)
    setLoading(false)
    if (!res.success) {
      toast({ title: res.error ?? tc('errors.generic'), variant: 'destructive' })
      return
    }
    toast({ title: t('mergeSuccess') })
    setPrimaryId('')
    setSecondaryId('')
    setDupGroups(await listContactDuplicateGroups())
  }

  const firstGroup = dupGroups[0]

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex flex-wrap gap-2 border-b pb-4">
        <Link href={`/${locale}/app/settings`}>
          <Button variant="ghost" size="sm">{tc('actions.back')}</Button>
        </Link>
      </div>

      <div className="flex gap-2">
        <Button variant={tab === 'import' ? 'default' : 'outline'} size="sm" onClick={() => setTab('import')}>
          {t('importTab')}
        </Button>
        <Button variant={tab === 'dedupe' ? 'default' : 'outline'} size="sm" onClick={() => setTab('dedupe')}>
          {t('dedupeTab')}
        </Button>
      </div>

      {tab === 'import' && (
        <div className="space-y-6 rounded-lg border bg-card p-6">
          {!canImport ? (
            <p className="text-sm text-muted-foreground">{t('noPermission')}</p>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('entity')}</label>
                <select
                  className="flex h-9 rounded-md border bg-background px-3 text-sm max-w-xs"
                  value={entityType}
                  onChange={(e) => setEntityType(e.target.value as ImportEntityType)}
                >
                  {(['leads', 'contacts', 'companies', 'opportunities'] as const).map((k) => (
                    <option key={k} value={k}>{t(`entities.${k}`)}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('upload')}</label>
                <input type="file" accept=".csv,text/csv" onChange={onFile} className="text-sm" />
                <p className="text-xs text-muted-foreground">{t('fileHint')}</p>
              </div>
              {headers.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm">{t('mapping')}</h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {keys.map((k) => (
                      <div key={k} className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">{t(`canonical.${k}` as 'canonical.firstName')}</span>
                        <select
                          className="flex h-9 rounded-md border bg-background px-2 text-sm"
                          value={mapping[k] ?? ''}
                          onChange={(e) => setMapping((m) => ({ ...m, [k]: e.target.value }))}
                        >
                          <option value="">—</option>
                          {headers.map((h) => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="secondary" loading={loading} onClick={() => execute(true)}>
                  {t('dryRun')}
                </Button>
                <Button type="button" loading={loading} onClick={() => execute(false)}>
                  {t('runImport')}
                </Button>
              </div>
              {lastSummary && lastSummary.errors.length > 0 && (
                <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
                  <p className="font-medium mb-2">{t('rowErrors')}</p>
                  <ul className="space-y-1 max-h-40 overflow-y-auto text-xs font-mono">
                    {lastSummary.errors.slice(0, 50).map((er, i) => (
                      <li key={i}>L{er.line}: {er.message}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {tab === 'dedupe' && (
        <div className="space-y-6 rounded-lg border bg-card p-6">
          {!canImport ? (
            <p className="text-sm text-muted-foreground">{t('noPermission')}</p>
          ) : dupLoading ? (
            <p className="text-sm text-muted-foreground">{tc('loading')}</p>
          ) : dupGroups.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('noDuplicates')}</p>
          ) : (
            <>
              <div>
                <h3 className="font-heading font-semibold">{t('mergeTitle')}</h3>
                <p className="text-sm text-muted-foreground mt-1">{t('mergeHint')}</p>
              </div>
              {firstGroup && (
                <div className="rounded-md border p-3 text-sm space-y-1 mb-4">
                  <p className="font-medium">{firstGroup.key}</p>
                  <ul className="list-disc pl-4">
                    {firstGroup.contacts.map((c) => (
                      <li key={c.id}>{c.label}</li>
                    ))}
                  </ul>
                </div>
              )}
              {canMerge ? (
                <div className="grid gap-4 sm:grid-cols-2 max-w-xl">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">{t('primary')}</label>
                    <select
                      className="flex h-9 w-full rounded-md border px-2 text-sm"
                      value={primaryId}
                      onChange={(e) => setPrimaryId(e.target.value)}
                    >
                      <option value="">—</option>
                      {dupGroups.flatMap((g) => g.contacts).map((c) => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">{t('secondary')}</label>
                    <select
                      className="flex h-9 w-full rounded-md border px-2 text-sm"
                      value={secondaryId}
                      onChange={(e) => setSecondaryId(e.target.value)}
                    >
                      <option value="">—</option>
                      {dupGroups.flatMap((g) => g.contacts).map((c) => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <Button type="button" disabled={!primaryId || !secondaryId} loading={loading} onClick={onMerge}>
                      {t('merge')}
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t('noPermission')}</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
