'use server'

import { revalidatePath } from 'next/cache'
import { tryCreateClient } from '@/lib/db/server'
import { OFFLINE_ACTION_ERROR } from '@/lib/mock/offline-messages'
import { getDemoLeadById, getDemoLeads } from '@/lib/mock/demo-dataset'
import { requireAuth, getActiveOrganization } from '@/lib/auth/server'
import { requirePermission } from '@/lib/rbac/permissions'
import { leadSchema, convertLeadSchema, type LeadInput } from '@/lib/validators/schemas'
import { createAuditLog, AUDIT_ACTIONS } from '@/lib/audit/log'
import { trackEvent } from '@/lib/analytics/track'
import type { ActionResult, LeadFilters, PaginatedResult, LeadWithOwner } from '@/types'

async function getContext() {
  const user = await requireAuth()
  const orgData = await getActiveOrganization(user.id)
  if (!orgData) throw new Error('No organization found')
  return { user, org: orgData.organization, membership: orgData.membership }
}

export async function getLeads(
  filters: LeadFilters = {},
  page = 1,
  pageSize = 25
): Promise<PaginatedResult<LeadWithOwner>> {
  const { org } = await getContext()
  const supabase = await tryCreateClient()
  if (!supabase) return getDemoLeads(org.id, filters, page, pageSize)

  let query = supabase
    .from('leads')
    .select('*, owner:profiles!leads_owner_id_fkey(id,first_name,last_name,avatar_url)', { count: 'exact' })
    .eq('organization_id', org.id)
    .order('created_at', { ascending: false })

  if (filters.status) query = query.eq('status', filters.status)
  if (filters.source) query = query.eq('source', filters.source)
  if (filters.ownerId) query = query.eq('owner_id', filters.ownerId)
  if (filters.search) {
    query = query.or(
      `first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,company.ilike.%${filters.search}%`
    )
  }
  if (filters.dateFrom) query = query.gte('created_at', filters.dateFrom)
  if (filters.dateTo) query = query.lte('created_at', filters.dateTo)

  const from = (page - 1) * pageSize
  query = query.range(from, from + pageSize - 1)

  const { data, count, error } = await query
  if (error) throw error

  return {
    data: (data ?? []) as LeadWithOwner[],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  }
}

export async function getLeadById(id: string): Promise<LeadWithOwner | null> {
  const { org } = await getContext()
  const supabase = await tryCreateClient()
  if (!supabase) return getDemoLeadById(org.id, id)

  const { data } = await supabase
    .from('leads')
    .select('*, owner:profiles!leads_owner_id_fkey(id,first_name,last_name,avatar_url)')
    .eq('id', id)
    .eq('organization_id', org.id)
    .single()

  return data as LeadWithOwner | null
}

export async function createLead(input: LeadInput): Promise<ActionResult<{ id: string }>> {
  try {
    const { user, org, membership } = await getContext()
    requirePermission(membership.role, 'leads:create')

    const validated = leadSchema.parse(input)
    const supabase = await tryCreateClient()
    if (!supabase) return { success: false, error: OFFLINE_ACTION_ERROR }

    const { data, error } = await supabase
      .from('leads')
      .insert({
        organization_id: org.id,
        first_name: validated.firstName,
        last_name: validated.lastName ?? null,
        email: validated.email ?? null,
        phone: validated.phone ?? null,
        company: validated.company ?? null,
        job_title: validated.jobTitle ?? null,
        source: validated.source ?? null,
        status: validated.status,
        score: validated.score,
        owner_id: validated.ownerId ?? user.id,
        tags: validated.tags,
        notes: validated.notes ?? null,
        website: validated.website ?? null,
        industry: validated.industry ?? null,
        budget: validated.budget ?? null,
        created_by: user.id,
      })
      .select('id')
      .single()

    if (error) return { success: false, error: error.message }

    await createAuditLog({
      organizationId: org.id,
      actorId: user.id,
      action: AUDIT_ACTIONS.LEAD_CREATED,
      entityType: 'lead',
      entityId: data.id,
      metadata: { firstName: validated.firstName, email: validated.email },
    })

    await trackEvent('lead_created', { organizationId: org.id, userId: user.id })

    revalidatePath('/[locale]/app/leads', 'page')
    return { success: true, data: { id: data.id } }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function updateLead(id: string, input: Partial<LeadInput>): Promise<ActionResult<void>> {
  try {
    const { user, org, membership } = await getContext()
    requirePermission(membership.role, 'leads:update')

    const supabase = await tryCreateClient()
    if (!supabase) return { success: false, error: OFFLINE_ACTION_ERROR }

    const { error } = await supabase
      .from('leads')
      .update({
        first_name: input.firstName,
        last_name: input.lastName,
        email: input.email,
        phone: input.phone,
        company: input.company,
        job_title: input.jobTitle,
        source: input.source,
        status: input.status,
        score: input.score,
        owner_id: input.ownerId,
        tags: input.tags,
        notes: input.notes,
        website: input.website,
        industry: input.industry,
        budget: input.budget,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('organization_id', org.id)

    if (error) return { success: false, error: error.message }

    await createAuditLog({
      organizationId: org.id,
      actorId: user.id,
      action: AUDIT_ACTIONS.LEAD_UPDATED,
      entityType: 'lead',
      entityId: id,
    })

    revalidatePath('/[locale]/app/leads', 'page')
    revalidatePath(`/[locale]/app/leads/${id}`, 'page')
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function deleteLead(id: string): Promise<ActionResult<void>> {
  try {
    const { user, org, membership } = await getContext()
    requirePermission(membership.role, 'leads:delete')

    const supabase = await tryCreateClient()
    if (!supabase) return { success: false, error: OFFLINE_ACTION_ERROR }

    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id)
      .eq('organization_id', org.id)

    if (error) return { success: false, error: error.message }

    await createAuditLog({
      organizationId: org.id,
      actorId: user.id,
      action: AUDIT_ACTIONS.LEAD_DELETED,
      entityType: 'lead',
      entityId: id,
    })

    revalidatePath('/[locale]/app/leads', 'page')
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function convertLead(input: {
  leadId: string
  createContact: boolean
  createCompany: boolean
  createOpportunity: boolean
  existingContactId?: string | null
  existingCompanyId?: string | null
  opportunityName?: string
  opportunityValue?: number
  stageId?: string
}): Promise<ActionResult<{ contactId?: string; companyId?: string; opportunityId?: string }>> {
  try {
    const { user, org, membership } = await getContext()
    requirePermission(membership.role, 'leads:convert')

    const validated = convertLeadSchema.parse(input)
    const supabase = await tryCreateClient()
    if (!supabase) return { success: false, error: OFFLINE_ACTION_ERROR }

    const lead = await getLeadById(validated.leadId)
    if (!lead) return { success: false, error: 'Lead not found' }

    let contactId: string | undefined
    let companyId: string | undefined
    let opportunityId: string | undefined

    if (validated.existingCompanyId) {
      companyId = validated.existingCompanyId
    } else if (validated.createCompany && lead.company) {
      const { data: company } = await supabase
        .from('companies')
        .insert({
          organization_id: org.id,
          name: lead.company,
          industry: lead.industry ?? null,
          website: lead.website ?? null,
          owner_id: lead.owner_id,
          created_by: user.id,
        })
        .select('id')
        .single()
      companyId = company?.id
    }

    if (validated.existingContactId) {
      contactId = validated.existingContactId
      if (companyId) {
        await supabase
          .from('contacts')
          .update({ company_id: companyId, updated_at: new Date().toISOString() })
          .eq('id', contactId)
          .eq('organization_id', org.id)
      }
    } else if (validated.createContact) {
      const { data: contact } = await supabase
        .from('contacts')
        .insert({
          organization_id: org.id,
          first_name: lead.first_name,
          last_name: lead.last_name,
          email: lead.email,
          phone: lead.phone,
          job_title: lead.job_title,
          company_id: companyId ?? null,
          owner_id: lead.owner_id,
          tags: lead.tags,
          notes: lead.notes,
          created_by: user.id,
        })
        .select('id')
        .single()
      contactId = contact?.id
    }

    if (contactId) {
      await supabase
        .from('notes')
        .update({ lead_id: null, contact_id: contactId })
        .eq('lead_id', validated.leadId)
        .eq('organization_id', org.id)
      await supabase
        .from('activities')
        .update({ lead_id: null, contact_id: contactId })
        .eq('lead_id', validated.leadId)
        .eq('organization_id', org.id)
      await supabase
        .from('tasks')
        .update({ lead_id: null, contact_id: contactId })
        .eq('lead_id', validated.leadId)
        .eq('organization_id', org.id)
    }

    let oppCompanyId = companyId
    if (!oppCompanyId && contactId) {
      const { data: c } = await supabase
        .from('contacts')
        .select('company_id')
        .eq('id', contactId)
        .eq('organization_id', org.id)
        .single()
      oppCompanyId = c?.company_id ?? undefined
    }

    const stageIdForOpp = validated.stageId
    if (validated.createOpportunity && stageIdForOpp) {
      const { data: opp } = await supabase
        .from('opportunities')
        .insert({
          organization_id: org.id,
          name: validated.opportunityName ?? `${lead.first_name} ${lead.company ?? ''}`.trim(),
          value: validated.opportunityValue ?? 0,
          stage_id: stageIdForOpp,
          probability: 20,
          contact_id: contactId ?? null,
          company_id: oppCompanyId ?? null,
          owner_id: lead.owner_id,
          source: lead.source,
          created_by: user.id,
        })
        .select('id')
        .single()
      opportunityId = opp?.id
    }

    await supabase
      .from('leads')
      .update({
        status: 'converted',
        converted_at: new Date().toISOString(),
        converted_contact_id: contactId ?? null,
        converted_company_id: companyId ?? null,
        converted_opportunity_id: opportunityId ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', validated.leadId)
      .eq('organization_id', org.id)

    await createAuditLog({
      organizationId: org.id,
      actorId: user.id,
      action: AUDIT_ACTIONS.LEAD_CONVERTED,
      entityType: 'lead',
      entityId: validated.leadId,
      metadata: {
        contactId,
        companyId,
        opportunityId,
        existingContact: !!validated.existingContactId,
        existingCompany: !!validated.existingCompanyId,
      },
    })

    await trackEvent('lead_converted', { organizationId: org.id, userId: user.id })

    revalidatePath('/[locale]/app/leads', 'page')
    revalidatePath(`/[locale]/app/leads/${validated.leadId}`, 'page')
    revalidatePath('/[locale]/app/contacts', 'page')
    revalidatePath('/[locale]/app/opportunities', 'page')
    if (contactId) revalidatePath(`/[locale]/app/contacts/${contactId}`, 'page')
    if (companyId) revalidatePath(`/[locale]/app/companies/${companyId}`, 'page')
    if (opportunityId) revalidatePath(`/[locale]/app/opportunities/${opportunityId}`, 'page')

    return { success: true, data: { contactId, companyId, opportunityId } }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
