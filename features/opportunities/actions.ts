'use server'

import { revalidatePath } from 'next/cache'
import { tryCreateClient } from '@/lib/db/server'
import { OFFLINE_ACTION_ERROR } from '@/lib/mock/offline-messages'
import {
  getDemoOpportunities,
  getDemoOpportunityById,
  getDemoPipelineStages,
} from '@/lib/mock/demo-dataset'
import { requireAuth, getActiveOrganization } from '@/lib/auth/server'
import { requirePermission } from '@/lib/rbac/permissions'
import {
  opportunitySchema,
  moveOpportunityStageSchema,
  type OpportunityInput,
  type MoveOpportunityStageInput,
} from '@/lib/validators/schemas'
import { createAuditLog, AUDIT_ACTIONS } from '@/lib/audit/log'
import { trackEvent } from '@/lib/analytics/track'
import type { ActionResult, OpportunityFilters, PaginatedResult, OpportunityWithStage } from '@/types'

async function getContext() {
  const user = await requireAuth()
  const orgData = await getActiveOrganization(user.id)
  if (!orgData) throw new Error('No organization found')
  return { user, org: orgData.organization, membership: orgData.membership }
}

export async function getOpportunities(
  filters: OpportunityFilters = {},
  page = 1,
  pageSize = 50
): Promise<PaginatedResult<OpportunityWithStage>> {
  const { org } = await getContext()
  const supabase = await tryCreateClient()
  if (!supabase) return getDemoOpportunities(org.id, filters, page, pageSize)

  let query = supabase
    .from('opportunities')
    .select(`
      *,
      stage:opportunity_stages(*),
      owner:profiles!opportunities_owner_id_fkey(id,first_name,last_name,avatar_url),
      contact:contacts(id,first_name,last_name,email),
      company:companies(id,name)
    `, { count: 'exact' })
    .eq('organization_id', org.id)
    .order('created_at', { ascending: false })

  if (filters.stageId) query = query.eq('stage_id', filters.stageId)
  if (filters.ownerId) query = query.eq('owner_id', filters.ownerId)
  if (filters.search) {
    query = query.ilike('name', `%${filters.search}%`)
  }
  if (filters.minValue !== undefined) query = query.gte('value', filters.minValue)
  if (filters.maxValue !== undefined) query = query.lte('value', filters.maxValue)

  const from = (page - 1) * pageSize
  query = query.range(from, from + pageSize - 1)

  const { data, count, error } = await query
  if (error) throw error

  return {
    data: (data ?? []) as unknown as OpportunityWithStage[],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  }
}

export async function getOpportunityById(id: string): Promise<OpportunityWithStage | null> {
  const { org } = await getContext()
  const supabase = await tryCreateClient()
  if (!supabase) return getDemoOpportunityById(org.id, id)

  const { data } = await supabase
    .from('opportunities')
    .select(`
      *,
      stage:opportunity_stages(*),
      owner:profiles!opportunities_owner_id_fkey(id,first_name,last_name,avatar_url),
      contact:contacts(id,first_name,last_name,email),
      company:companies(id,name)
    `)
    .eq('id', id)
    .eq('organization_id', org.id)
    .single()

  return data as unknown as OpportunityWithStage | null
}

export async function getPipelineStages() {
  const { org } = await getContext()
  const supabase = await tryCreateClient()
  if (!supabase) return getDemoPipelineStages(org.id)

  const { data } = await supabase
    .from('opportunity_stages')
    .select('*')
    .eq('organization_id', org.id)
    .order('position', { ascending: true })

  return data ?? []
}

export async function createOpportunity(input: OpportunityInput): Promise<ActionResult<{ id: string }>> {
  try {
    const { user, org, membership } = await getContext()
    requirePermission(membership.role, 'opportunities:create')

    const validated = opportunitySchema.parse(input)
    const supabase = await tryCreateClient()
    if (!supabase) return { success: false, error: OFFLINE_ACTION_ERROR }

    const { data, error } = await supabase
      .from('opportunities')
      .insert({
        organization_id: org.id,
        name: validated.name,
        value: validated.value,
        stage_id: validated.stageId,
        probability: validated.probability,
        close_date: validated.closeDate ?? null,
        owner_id: validated.ownerId ?? user.id,
        contact_id: validated.contactId ?? null,
        company_id: validated.companyId ?? null,
        source: validated.source ?? null,
        next_action: validated.nextAction ?? null,
        notes: validated.notes ?? null,
        created_by: user.id,
      })
      .select('id')
      .single()

    if (error) return { success: false, error: error.message }

    await createAuditLog({
      organizationId: org.id,
      actorId: user.id,
      action: AUDIT_ACTIONS.OPPORTUNITY_CREATED,
      entityType: 'opportunity',
      entityId: data.id,
      metadata: { name: validated.name, value: validated.value },
    })

    await trackEvent('opportunity_created', { organizationId: org.id, userId: user.id })

    revalidatePath('/[locale]/app/opportunities', 'page')
    revalidatePath('/[locale]/app/dashboard', 'page')
    return { success: true, data: { id: data.id } }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function updateOpportunity(id: string, input: Partial<OpportunityInput>): Promise<ActionResult<void>> {
  try {
    const { user, org, membership } = await getContext()
    requirePermission(membership.role, 'opportunities:update')

    const supabase = await tryCreateClient()
    if (!supabase) return { success: false, error: OFFLINE_ACTION_ERROR }

    const { error } = await supabase
      .from('opportunities')
      .update({
        name: input.name,
        value: input.value,
        stage_id: input.stageId,
        probability: input.probability,
        close_date: input.closeDate,
        owner_id: input.ownerId,
        contact_id: input.contactId,
        company_id: input.companyId,
        source: input.source,
        next_action: input.nextAction,
        notes: input.notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('organization_id', org.id)

    if (error) return { success: false, error: error.message }

    await createAuditLog({
      organizationId: org.id,
      actorId: user.id,
      action: AUDIT_ACTIONS.OPPORTUNITY_UPDATED,
      entityType: 'opportunity',
      entityId: id,
    })

    revalidatePath('/[locale]/app/opportunities', 'page')
    revalidatePath(`/[locale]/app/opportunities/${id}`, 'page')
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function moveOpportunityStage(
  input: MoveOpportunityStageInput
): Promise<ActionResult<void>> {
  try {
    const validated = moveOpportunityStageSchema.parse(input)
    const { user, org, membership } = await getContext()
    requirePermission(membership.role, 'opportunities:update')

    const supabase = await tryCreateClient()
    if (!supabase) return { success: false, error: OFFLINE_ACTION_ERROR }

    const { data: stageRows, error: stageErr } = await supabase
      .from('opportunity_stages')
      .select('id,name,is_closed_won,is_closed_lost,probability')
      .eq('organization_id', org.id)
      .in('id', [validated.stageId, validated.previousStageId])

    if (stageErr) return { success: false, error: stageErr.message }
    const target = stageRows?.find((s) => s.id === validated.stageId)
    const previous = stageRows?.find((s) => s.id === validated.previousStageId)
    if (!target) return { success: false, error: 'Stage not found' }

    const wasClosed = !!(previous && (previous.is_closed_won || previous.is_closed_lost))
    const movingToOpen = !target.is_closed_won && !target.is_closed_lost
    if (wasClosed && movingToOpen && !validated.regressionReason?.trim()) {
      return { success: false, error: 'Regression reason is required when reopening a closed deal.' }
    }

    if (target.is_closed_lost && !validated.lostReason?.trim()) {
      return { success: false, error: 'Lost reason is required for Closed Lost.' }
    }

    const now = new Date().toISOString()

    const { data: oppSnap, error: snapErr } = await supabase
      .from('opportunities')
      .select('notes')
      .eq('id', validated.opportunityId)
      .eq('organization_id', org.id)
      .single()
    if (snapErr) return { success: false, error: snapErr.message }

    let notes = oppSnap?.notes ?? ''
    if (
      (target.is_closed_won || target.is_closed_lost) &&
      validated.closeNotes?.trim()
    ) {
      notes = `${notes}\n\n[${now}] ${validated.closeNotes.trim()}`.trim()
    }

    const updatePayload: Record<string, unknown> = {
      stage_id: validated.stageId,
      probability: target.probability,
      notes,
      updated_at: now,
    }

    if (target.is_closed_won || target.is_closed_lost) {
      updatePayload.closed_at = now
    } else {
      updatePayload.closed_at = null
      updatePayload.lost_reason = null
      updatePayload.competitor = null
    }

    if (target.is_closed_won) {
      updatePayload.probability = 100
    }
    if (target.is_closed_lost) {
      updatePayload.probability = 0
      updatePayload.lost_reason = validated.lostReason!.trim()
      updatePayload.competitor = validated.competitor?.trim() ?? null
    }

    const { error } = await supabase
      .from('opportunities')
      .update(updatePayload)
      .eq('id', validated.opportunityId)
      .eq('organization_id', org.id)

    if (error) return { success: false, error: error.message }

    const activityLines = [
      validated.regressionReason?.trim(),
      target.is_closed_lost ? `Lost reason: ${validated.lostReason?.trim()}` : null,
      validated.competitor?.trim() ? `Competitor: ${validated.competitor.trim()}` : null,
    ].filter(Boolean) as string[]

    await supabase.from('activities').insert({
      organization_id: org.id,
      type: 'note',
      subject: `Stage: ${previous?.name ?? '—'} → ${target.name}`,
      description: activityLines.length ? activityLines.join('\n') : null,
      opportunity_id: validated.opportunityId,
      activity_date: now,
      created_by: user.id,
    })

    await createAuditLog({
      organizationId: org.id,
      actorId: user.id,
      action: AUDIT_ACTIONS.OPPORTUNITY_STAGE_CHANGED,
      entityType: 'opportunity',
      entityId: validated.opportunityId,
      metadata: {
        previousStageId: validated.previousStageId,
        newStageId: validated.stageId,
        lostReason: target.is_closed_lost ? validated.lostReason : undefined,
        competitor: target.is_closed_lost ? validated.competitor : undefined,
        regressionReason: validated.regressionReason,
      },
    })

    await trackEvent('opportunity_stage_changed', {
      organizationId: org.id,
      userId: user.id,
      properties: { opportunityId: validated.opportunityId, stageId: validated.stageId },
    })

    revalidatePath('/[locale]/app/opportunities', 'page')
    revalidatePath(`/[locale]/app/opportunities/${validated.opportunityId}`, 'page')
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function deleteOpportunity(id: string): Promise<ActionResult<void>> {
  try {
    const { user, org, membership } = await getContext()
    requirePermission(membership.role, 'opportunities:delete')

    const supabase = await tryCreateClient()
    if (!supabase) return { success: false, error: OFFLINE_ACTION_ERROR }

    const { error } = await supabase
      .from('opportunities')
      .delete()
      .eq('id', id)
      .eq('organization_id', org.id)

    if (error) return { success: false, error: error.message }

    await createAuditLog({
      organizationId: org.id,
      actorId: user.id,
      action: AUDIT_ACTIONS.OPPORTUNITY_DELETED,
      entityType: 'opportunity',
      entityId: id,
    })

    revalidatePath('/[locale]/app/opportunities', 'page')
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
