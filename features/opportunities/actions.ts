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
import { opportunitySchema, type OpportunityInput } from '@/lib/validators/schemas'
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
  opportunityId: string,
  stageId: string,
  previousStageId: string
): Promise<ActionResult<void>> {
  try {
    const { user, org, membership } = await getContext()
    requirePermission(membership.role, 'opportunities:update')

    const supabase = await tryCreateClient()
    if (!supabase) return { success: false, error: OFFLINE_ACTION_ERROR }

    const { error } = await supabase
      .from('opportunities')
      .update({ stage_id: stageId, updated_at: new Date().toISOString() })
      .eq('id', opportunityId)
      .eq('organization_id', org.id)

    if (error) return { success: false, error: error.message }

    await createAuditLog({
      organizationId: org.id,
      actorId: user.id,
      action: AUDIT_ACTIONS.OPPORTUNITY_STAGE_CHANGED,
      entityType: 'opportunity',
      entityId: opportunityId,
      metadata: { previousStageId, newStageId: stageId },
    })

    await trackEvent('opportunity_stage_changed', {
      organizationId: org.id,
      userId: user.id,
      properties: { opportunityId, stageId },
    })

    revalidatePath('/[locale]/app/opportunities', 'page')
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
