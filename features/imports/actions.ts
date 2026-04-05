'use server'

import { revalidatePath } from 'next/cache'
import { parseCsv, rowsToObjects } from '@/lib/csv/parse'
import { tryCreateClient } from '@/lib/db/server'
import { OFFLINE_ACTION_ERROR } from '@/lib/mock/offline-messages'
import { requireAuth, getActiveOrganization } from '@/lib/auth/server'
import { requirePermission } from '@/lib/rbac/permissions'
import { createAuditLog, AUDIT_ACTIONS } from '@/lib/audit/log'
import type { Json } from '@/types/supabase'
import type { ActionResult } from '@/types'

export type ImportEntityType = 'leads' | 'contacts' | 'companies' | 'opportunities'

export type ImportSummary = {
  created: number
  updated: number
  skipped: number
  failed: number
  errors: { line: number; message: string }[]
}

export const IMPORT_CANONICAL_KEYS: Record<ImportEntityType, string[]> = {
  leads: [
    'firstName',
    'lastName',
    'email',
    'phone',
    'company',
    'jobTitle',
    'source',
    'status',
    'score',
    'industry',
    'website',
    'budget',
    'notes',
  ],
  contacts: ['firstName', 'lastName', 'email', 'phone', 'jobTitle', 'companyName', 'notes'],
  companies: ['name', 'domain', 'industry', 'size', 'website', 'phone', 'notes'],
  opportunities: ['name', 'value', 'stageName', 'closeDate', 'source', 'nextAction', 'notes', 'contactEmail', 'companyName'],
}

const MAX_ROWS = 2000

const LEAD_STATUSES = new Set(['new', 'contacted', 'qualified', 'unqualified', 'converted'])

async function getContext() {
  const user = await requireAuth()
  const orgData = await getActiveOrganization(user.id)
  if (!orgData) throw new Error('No organization found')
  return { user, org: orgData.organization, membership: orgData.membership }
}

function mapRow(row: Record<string, string>, mapping: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [canonical, header] of Object.entries(mapping)) {
    if (!header) continue
    out[canonical] = row[header] ?? ''
  }
  return out
}

function parseHeadersAndRows(csvText: string): { headers: string[]; objects: Record<string, string>[] } {
  const grid = parseCsv(csvText.trim())
  if (grid.length < 2) return { headers: [], objects: [] }
  const headers = grid[0].map((h) => h.trim())
  const body = grid.slice(1).slice(0, MAX_ROWS)
  const objects = rowsToObjects(headers, body)
  return { headers, objects }
}

export async function parseImportCsvHeaders(csvText: string): Promise<{ headers: string[]; rowCount: number }> {
  await getContext()
  const { headers, objects } = parseHeadersAndRows(csvText)
  return { headers, rowCount: objects.length }
}

async function resolveStageId(
  supabase: NonNullable<Awaited<ReturnType<typeof tryCreateClient>>>,
  orgId: string,
  stageName: string
): Promise<string | null> {
  const n = stageName.trim()
  if (!n) return null
  const { data } = await supabase
    .from('opportunity_stages')
    .select('id')
    .eq('organization_id', orgId)
    .ilike('name', n)
    .limit(1)
    .maybeSingle()
  return data?.id ?? null
}

async function findCompanyIdByName(
  supabase: NonNullable<Awaited<ReturnType<typeof tryCreateClient>>>,
  orgId: string,
  name: string
): Promise<string | null> {
  const n = name.trim()
  if (!n) return null
  const { data } = await supabase
    .from('companies')
    .select('id')
    .eq('organization_id', orgId)
    .ilike('name', n)
    .limit(1)
    .maybeSingle()
  return data?.id ?? null
}

async function findContactIdByEmail(
  supabase: NonNullable<Awaited<ReturnType<typeof tryCreateClient>>>,
  orgId: string,
  email: string
): Promise<string | null> {
  const e = email.trim().toLowerCase()
  if (!e) return null
  const { data } = await supabase
    .from('contacts')
    .select('id')
    .eq('organization_id', orgId)
    .ilike('email', e)
    .limit(1)
    .maybeSingle()
  return data?.id ?? null
}

export async function runCsvImport(params: {
  entityType: ImportEntityType
  csvText: string
  mapping: Record<string, string>
  dryRun: boolean
  fileName?: string | null
}): Promise<ActionResult<ImportSummary>> {
  try {
    const { user, org, membership } = await getContext()
    requirePermission(membership.role, 'data:import')

    const supabase = await tryCreateClient()
    if (!supabase) return { success: false, error: OFFLINE_ACTION_ERROR }

    const { objects } = parseHeadersAndRows(params.csvText)
    if (objects.length === 0) {
      return { success: false, error: 'CSV has no data rows.' }
    }

    const summary: ImportSummary = { created: 0, updated: 0, skipped: 0, failed: 0, errors: [] }

    for (let i = 0; i < objects.length; i++) {
      const line = i + 2
      const raw = mapRow(objects[i]!, params.mapping)

      try {
        if (params.entityType === 'leads') {
          const firstName = raw.firstName?.trim()
          if (!firstName) {
            summary.failed++
            summary.errors.push({ line, message: 'firstName required' })
            continue
          }
          const email = raw.email?.trim() || null
          const phone = raw.phone?.trim() || null
          if (!email && !phone) {
            summary.failed++
            summary.errors.push({ line, message: 'email or phone required' })
            continue
          }
          if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            summary.failed++
            summary.errors.push({ line, message: 'invalid email' })
            continue
          }
          let status = (raw.status?.trim().toLowerCase() || 'new') as
            | 'new'
            | 'contacted'
            | 'qualified'
            | 'unqualified'
            | 'converted'
          if (!LEAD_STATUSES.has(status)) status = 'new'
          const score = Math.min(100, Math.max(0, Number(raw.score) || 50))
          const budget = raw.budget?.trim() ? Number(raw.budget) : null
          if (email) {
            const { data: dup } = await supabase
              .from('leads')
              .select('id')
              .eq('organization_id', org.id)
              .ilike('email', email)
              .limit(1)
              .maybeSingle()
            if (dup) {
              summary.skipped++
              continue
            }
          }
          if (!params.dryRun) {
            const { error } = await supabase.from('leads').insert({
              organization_id: org.id,
              first_name: firstName,
              last_name: raw.lastName?.trim() || null,
              email,
              phone,
              company: raw.company?.trim() || null,
              job_title: raw.jobTitle?.trim() || null,
              source: raw.source?.trim() || null,
              status,
              score: Number.isFinite(score) ? score : 50,
              owner_id: user.id,
              tags: [],
              notes: raw.notes?.trim() || null,
              website: raw.website?.trim() || null,
              industry: raw.industry?.trim() || null,
              budget: budget !== null && Number.isFinite(budget) ? budget : null,
              created_by: user.id,
            })
            if (error) {
              summary.failed++
              summary.errors.push({ line, message: error.message })
              continue
            }
          }
          summary.created++
          continue
        }

        if (params.entityType === 'contacts') {
          const firstName = raw.firstName?.trim()
          if (!firstName) {
            summary.failed++
            summary.errors.push({ line, message: 'firstName required' })
            continue
          }
          const email = raw.email?.trim() || null
          const phone = raw.phone?.trim() || null
          if (!email && !phone) {
            summary.failed++
            summary.errors.push({ line, message: 'email or phone required' })
            continue
          }
          if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            summary.failed++
            summary.errors.push({ line, message: 'invalid email' })
            continue
          }
          if (email) {
            const { data: dup } = await supabase
              .from('contacts')
              .select('id')
              .eq('organization_id', org.id)
              .ilike('email', email)
              .limit(1)
              .maybeSingle()
            if (dup) {
              summary.skipped++
              continue
            }
          }
          let companyId: string | null = null
          if (raw.companyName?.trim()) {
            companyId = await findCompanyIdByName(supabase, org.id, raw.companyName)
          }
          if (!params.dryRun) {
            const { error } = await supabase.from('contacts').insert({
              organization_id: org.id,
              first_name: firstName,
              last_name: raw.lastName?.trim() || null,
              email,
              phone,
              job_title: raw.jobTitle?.trim() || null,
              company_id: companyId,
              owner_id: user.id,
              tags: [],
              notes: raw.notes?.trim() || null,
              created_by: user.id,
            })
            if (error) {
              summary.failed++
              summary.errors.push({ line, message: error.message })
              continue
            }
          }
          summary.created++
          continue
        }

        if (params.entityType === 'companies') {
          const name = raw.name?.trim()
          if (!name) {
            summary.failed++
            summary.errors.push({ line, message: 'name required' })
            continue
          }
          const domain = raw.domain?.trim() || null
          if (domain) {
            const { data: dup } = await supabase
              .from('companies')
              .select('id')
              .eq('organization_id', org.id)
              .ilike('domain', domain)
              .limit(1)
              .maybeSingle()
            if (dup) {
              summary.skipped++
              continue
            }
          }
          if (!params.dryRun) {
            const { error } = await supabase.from('companies').insert({
              organization_id: org.id,
              name,
              domain,
              industry: raw.industry?.trim() || null,
              size: raw.size?.trim() || null,
              website: raw.website?.trim() || null,
              phone: raw.phone?.trim() || null,
              owner_id: user.id,
              notes: raw.notes?.trim() || null,
              created_by: user.id,
            })
            if (error) {
              summary.failed++
              summary.errors.push({ line, message: error.message })
              continue
            }
          }
          summary.created++
          continue
        }

        // opportunities
        const name = raw.name?.trim()
        if (!name) {
          summary.failed++
          summary.errors.push({ line, message: 'name required' })
          continue
        }
        const stageId = await resolveStageId(supabase, org.id, raw.stageName ?? '')
        if (!stageId) {
          summary.failed++
          summary.errors.push({ line, message: 'unknown stage name' })
          continue
        }
        const value = Number(raw.value) || 0
        let contactId: string | null = null
        let companyId: string | null = null
        if (raw.contactEmail?.trim()) {
          contactId = await findContactIdByEmail(supabase, org.id, raw.contactEmail)
        }
        if (raw.companyName?.trim()) {
          companyId = await findCompanyIdByName(supabase, org.id, raw.companyName)
        }
        if (!params.dryRun) {
          const { data: stageRow } = await supabase
            .from('opportunity_stages')
            .select('probability')
            .eq('id', stageId)
            .single()
          const { error } = await supabase.from('opportunities').insert({
            organization_id: org.id,
            name,
            value,
            stage_id: stageId,
            probability: stageRow?.probability ?? 20,
            close_date: raw.closeDate?.trim() || null,
            owner_id: user.id,
            contact_id: contactId,
            company_id: companyId,
            source: raw.source?.trim() || null,
            next_action: raw.nextAction?.trim() || null,
            notes: raw.notes?.trim() || null,
            created_by: user.id,
            stage_entered_at: new Date().toISOString(),
          })
          if (error) {
            summary.failed++
            summary.errors.push({ line, message: error.message })
            continue
          }
        }
        summary.created++
      } catch (e) {
        summary.failed++
        summary.errors.push({ line, message: e instanceof Error ? e.message : 'error' })
      }
    }

    if (!params.dryRun && summary.created > 0) {
      await supabase.from('import_runs').insert({
        organization_id: org.id,
        created_by: user.id,
        entity_type: params.entityType,
        file_name: params.fileName ?? null,
        dry_run: false,
        summary: summary as unknown as Json,
      })
      await createAuditLog({
        organizationId: org.id,
        actorId: user.id,
        action: AUDIT_ACTIONS.DATA_IMPORTED,
        entityType: params.entityType,
        entityId: null,
        metadata: {
          fileName: params.fileName,
          created: summary.created,
          skipped: summary.skipped,
          failed: summary.failed,
        },
      })
    }

    revalidatePath('/[locale]/app/leads', 'page')
    revalidatePath('/[locale]/app/contacts', 'page')
    revalidatePath('/[locale]/app/companies', 'page')
    revalidatePath('/[locale]/app/opportunities', 'page')
    revalidatePath('/[locale]/app/settings/data', 'page')

    return { success: true, data: summary }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
