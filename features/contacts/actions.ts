'use server'

import { revalidatePath } from 'next/cache'
import { tryCreateClient } from '@/lib/db/server'
import { OFFLINE_ACTION_ERROR } from '@/lib/mock/offline-messages'
import {
  getDemoCompanies,
  getDemoCompanyById,
  getDemoContactById,
  getDemoContacts,
} from '@/lib/mock/demo-dataset'
import { requireAuth, getActiveOrganization } from '@/lib/auth/server'
import { requirePermission } from '@/lib/rbac/permissions'
import { contactSchema, companySchema, type ContactInput, type CompanyInput } from '@/lib/validators/schemas'
import { createAuditLog, AUDIT_ACTIONS } from '@/lib/audit/log'
import type { ActionResult, Company, ContactWithCompany } from '@/types'

async function getContext() {
  const user = await requireAuth()
  const orgData = await getActiveOrganization(user.id)
  if (!orgData) throw new Error('No organization found')
  return { user, org: orgData.organization, membership: orgData.membership }
}

// --- CONTACTS ---

export async function getContacts(search?: string, page = 1, pageSize = 25, companyId?: string) {
  const { org } = await getContext()
  const supabase = await tryCreateClient()
  if (!supabase) return getDemoContacts(org.id, search, page, pageSize, companyId)

  let query = supabase
    .from('contacts')
    .select(`*, company:companies(id,name), owner:profiles!contacts_owner_id_fkey(id,first_name,last_name,avatar_url)`, { count: 'exact' })
    .eq('organization_id', org.id)
    .order('first_name', { ascending: true })

  if (companyId) query = query.eq('company_id', companyId)
  if (search) {
    query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`)
  }

  const from = (page - 1) * pageSize
  const { data, count, error } = await query.range(from, from + pageSize - 1)
  if (error) throw error

  return {
    data: (data ?? []) as unknown as ContactWithCompany[],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  }
}

export async function getContactById(id: string) {
  const { org } = await getContext()
  const supabase = await tryCreateClient()
  if (!supabase) return getDemoContactById(org.id, id)

  const { data } = await supabase
    .from('contacts')
    .select(`*, company:companies(id,name), owner:profiles!contacts_owner_id_fkey(id,first_name,last_name)`)
    .eq('id', id)
    .eq('organization_id', org.id)
    .single()

  return data
}

export async function createContact(input: ContactInput): Promise<ActionResult<{ id: string }>> {
  try {
    const { user, org, membership } = await getContext()
    requirePermission(membership.role, 'contacts:create')

    const validated = contactSchema.parse(input)
    const supabase = await tryCreateClient()
    if (!supabase) return { success: false, error: OFFLINE_ACTION_ERROR }

    const { data, error } = await supabase
      .from('contacts')
      .insert({
        organization_id: org.id,
        first_name: validated.firstName,
        last_name: validated.lastName ?? null,
        email: validated.email ?? null,
        phone: validated.phone ?? null,
        job_title: validated.jobTitle ?? null,
        company_id: validated.companyId ?? null,
        owner_id: validated.ownerId ?? user.id,
        tags: validated.tags,
        notes: validated.notes ?? null,
        linkedin_url: validated.linkedinUrl ?? null,
        created_by: user.id,
      })
      .select('id')
      .single()

    if (error) return { success: false, error: error.message }

    await createAuditLog({
      organizationId: org.id,
      actorId: user.id,
      action: AUDIT_ACTIONS.CONTACT_CREATED,
      entityType: 'contact',
      entityId: data.id,
    })

    revalidatePath('/[locale]/app/contacts', 'page')
    return { success: true, data: { id: data.id } }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function updateContact(id: string, input: Partial<ContactInput>): Promise<ActionResult<void>> {
  try {
    const { user, org, membership } = await getContext()
    requirePermission(membership.role, 'contacts:update')

    const supabase = await tryCreateClient()
    if (!supabase) return { success: false, error: OFFLINE_ACTION_ERROR }

    const { error } = await supabase
      .from('contacts')
      .update({
        first_name: input.firstName,
        last_name: input.lastName,
        email: input.email,
        phone: input.phone,
        job_title: input.jobTitle,
        company_id: input.companyId,
        owner_id: input.ownerId,
        tags: input.tags,
        notes: input.notes,
        linkedin_url: input.linkedinUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('organization_id', org.id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/[locale]/app/contacts', 'page')
    revalidatePath(`/[locale]/app/contacts/${id}`, 'page')
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function deleteContact(id: string): Promise<ActionResult<void>> {
  try {
    const { user, org, membership } = await getContext()
    requirePermission(membership.role, 'contacts:delete')

    const supabase = await tryCreateClient()
    if (!supabase) return { success: false, error: OFFLINE_ACTION_ERROR }

    const { error } = await supabase.from('contacts').delete().eq('id', id).eq('organization_id', org.id)
    if (error) return { success: false, error: error.message }

    revalidatePath('/[locale]/app/contacts', 'page')
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

// --- COMPANIES ---

export async function getCompanies(search?: string, page = 1, pageSize = 25) {
  const { org } = await getContext()
  const supabase = await tryCreateClient()
  if (!supabase) return getDemoCompanies(org.id, search, page, pageSize)

  let query = supabase
    .from('companies')
    .select(`*, owner:profiles!companies_owner_id_fkey(id,first_name,last_name,avatar_url)`, { count: 'exact' })
    .eq('organization_id', org.id)
    .order('name', { ascending: true })

  if (search) query = query.ilike('name', `%${search}%`)

  const from = (page - 1) * pageSize
  const { data, count, error } = await query.range(from, from + pageSize - 1)
  if (error) throw error

  return {
    data: data ?? [],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  }
}

export async function getCompanyById(id: string) {
  const { org } = await getContext()
  const supabase = await tryCreateClient()
  if (!supabase) return getDemoCompanyById(org.id, id)

  const { data } = await supabase
    .from('companies')
    .select(`*, owner:profiles!companies_owner_id_fkey(id,first_name,last_name)`)
    .eq('id', id)
    .eq('organization_id', org.id)
    .single()

  return data
}

export async function createCompany(input: CompanyInput): Promise<ActionResult<{ id: string }>> {
  try {
    const { user, org, membership } = await getContext()
    requirePermission(membership.role, 'companies:create')

    const validated = companySchema.parse(input)
    const supabase = await tryCreateClient()
    if (!supabase) return { success: false, error: OFFLINE_ACTION_ERROR }

    const { data, error } = await supabase
      .from('companies')
      .insert({
        organization_id: org.id,
        name: validated.name,
        domain: validated.domain ?? null,
        industry: validated.industry ?? null,
        size: validated.size ?? null,
        annual_revenue: validated.annualRevenue ?? null,
        phone: validated.phone ?? null,
        address: validated.address ?? null,
        city: validated.city ?? null,
        country: validated.country ?? null,
        website: validated.website ?? null,
        owner_id: validated.ownerId ?? user.id,
        notes: validated.notes ?? null,
        created_by: user.id,
      })
      .select('id')
      .single()

    if (error) return { success: false, error: error.message }

    await createAuditLog({
      organizationId: org.id,
      actorId: user.id,
      action: AUDIT_ACTIONS.COMPANY_CREATED,
      entityType: 'company',
      entityId: data.id,
    })

    revalidatePath('/[locale]/app/companies', 'page')
    return { success: true, data: { id: data.id } }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function updateCompany(id: string, input: Partial<CompanyInput>): Promise<ActionResult<void>> {
  try {
    const { user, org, membership } = await getContext()
    requirePermission(membership.role, 'companies:update')

    const supabase = await tryCreateClient()
    if (!supabase) return { success: false, error: OFFLINE_ACTION_ERROR }

    const { error } = await supabase
      .from('companies')
      .update({
        name: input.name,
        domain: input.domain,
        industry: input.industry,
        size: input.size,
        annual_revenue: input.annualRevenue,
        phone: input.phone,
        address: input.address,
        city: input.city,
        country: input.country,
        website: input.website,
        owner_id: input.ownerId,
        notes: input.notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('organization_id', org.id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/[locale]/app/companies', 'page')
    revalidatePath(`/[locale]/app/companies/${id}`, 'page')
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function deleteCompany(id: string): Promise<ActionResult<void>> {
  try {
    const { user, org, membership } = await getContext()
    requirePermission(membership.role, 'companies:delete')

    const supabase = await tryCreateClient()
    if (!supabase) return { success: false, error: OFFLINE_ACTION_ERROR }

    const { error } = await supabase.from('companies').delete().eq('id', id).eq('organization_id', org.id)
    if (error) return { success: false, error: error.message }

    revalidatePath('/[locale]/app/companies', 'page')
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
