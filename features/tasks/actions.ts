'use server'

import { revalidatePath } from 'next/cache'
import { tryCreateClient } from '@/lib/db/server'
import { getDemoActivities, getDemoTasks } from '@/lib/mock/demo-dataset'
import { OFFLINE_ACTION_ERROR } from '@/lib/mock/offline-messages'
import { requireAuth, getActiveOrganization } from '@/lib/auth/server'
import { requirePermission } from '@/lib/rbac/permissions'
import { taskSchema, activitySchema, type TaskInput, type ActivityInput } from '@/lib/validators/schemas'
import { createAuditLog, AUDIT_ACTIONS } from '@/lib/audit/log'
import { trackEvent } from '@/lib/analytics/track'
import { startOfDay, endOfDay } from 'date-fns'
import type { ActionResult, TaskFilters, TaskWithRelations } from '@/types'

async function getContext() {
  const user = await requireAuth()
  const orgData = await getActiveOrganization(user.id)
  if (!orgData) throw new Error('No organization found')
  return { user, org: orgData.organization, membership: orgData.membership }
}

// --- TASKS ---

export async function getTasks(filters: TaskFilters = {}) {
  const { org } = await getContext()
  const supabase = await tryCreateClient()
  if (!supabase) return getDemoTasks(org.id, filters)

  let query = supabase
    .from('tasks')
    .select(`
      *,
      owner:profiles!tasks_owner_id_fkey(id,first_name,last_name,avatar_url),
      opportunity:opportunities(id,name),
      contact:contacts(id,first_name,last_name),
      company:companies(id,name),
      lead:leads(id,first_name,last_name)
    `)
    .eq('organization_id', org.id)
    .order('due_date', { ascending: true, nullsFirst: false })

  if (filters.status === 'completed') {
    query = query.not('completed_at', 'is', null)
  } else if (filters.status === 'overdue') {
    query = query.is('completed_at', null).lt('due_date', new Date().toISOString())
  } else if (filters.status === 'due_today') {
    const start = startOfDay(new Date()).toISOString()
    const end = endOfDay(new Date()).toISOString()
    query = query.is('completed_at', null).gte('due_date', start).lte('due_date', end)
  } else if (filters.status === 'open') {
    query = query.is('completed_at', null)
  }

  if (filters.priority) query = query.eq('priority', filters.priority)
  if (filters.ownerId) query = query.eq('owner_id', filters.ownerId)
  if (filters.search) query = query.ilike('title', `%${filters.search}%`)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as unknown as TaskWithRelations[]
}

export async function createTask(input: TaskInput): Promise<ActionResult<{ id: string }>> {
  try {
    const { user, org, membership } = await getContext()
    requirePermission(membership.role, 'tasks:create')

    const validated = taskSchema.parse(input)
    const supabase = await tryCreateClient()
    if (!supabase) return { success: false, error: OFFLINE_ACTION_ERROR }

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        organization_id: org.id,
        title: validated.title,
        description: validated.description ?? null,
        priority: validated.priority,
        due_date: validated.dueDate ?? null,
        owner_id: validated.ownerId ?? user.id,
        lead_id: validated.leadId ?? null,
        contact_id: validated.contactId ?? null,
        company_id: validated.companyId ?? null,
        opportunity_id: validated.opportunityId ?? null,
        created_by: user.id,
      })
      .select('id')
      .single()

    if (error) return { success: false, error: error.message }

    await createAuditLog({
      organizationId: org.id,
      actorId: user.id,
      action: AUDIT_ACTIONS.TASK_CREATED,
      entityType: 'task',
      entityId: data.id,
      metadata: { title: validated.title },
    })

    await trackEvent('task_created', { organizationId: org.id, userId: user.id })

    revalidatePath('/[locale]/app/tasks', 'page')
    revalidatePath('/[locale]/app/dashboard', 'page')
    return { success: true, data: { id: data.id } }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function updateTask(id: string, input: Partial<TaskInput>): Promise<ActionResult<void>> {
  try {
    const { user, org, membership } = await getContext()
    requirePermission(membership.role, 'tasks:update')

    const supabase = await tryCreateClient()
    if (!supabase) return { success: false, error: OFFLINE_ACTION_ERROR }

    const { error } = await supabase
      .from('tasks')
      .update({
        title: input.title,
        description: input.description,
        priority: input.priority,
        due_date: input.dueDate,
        owner_id: input.ownerId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('organization_id', org.id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/[locale]/app/tasks', 'page')
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function completeTask(id: string): Promise<ActionResult<void>> {
  try {
    const { user, org, membership } = await getContext()
    requirePermission(membership.role, 'tasks:update')

    const supabase = await tryCreateClient()
    if (!supabase) return { success: false, error: OFFLINE_ACTION_ERROR }

    const { error } = await supabase
      .from('tasks')
      .update({
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('organization_id', org.id)

    if (error) return { success: false, error: error.message }

    await createAuditLog({
      organizationId: org.id,
      actorId: user.id,
      action: AUDIT_ACTIONS.TASK_COMPLETED,
      entityType: 'task',
      entityId: id,
    })

    revalidatePath('/[locale]/app/tasks', 'page')
    revalidatePath('/[locale]/app/dashboard', 'page')
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function deleteTask(id: string): Promise<ActionResult<void>> {
  try {
    const { user, org, membership } = await getContext()
    requirePermission(membership.role, 'tasks:delete')

    const supabase = await tryCreateClient()
    if (!supabase) return { success: false, error: OFFLINE_ACTION_ERROR }

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('organization_id', org.id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/[locale]/app/tasks', 'page')
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

// --- ACTIVITIES ---

export async function getActivities(filters: {
  leadId?: string
  contactId?: string
  companyId?: string
  opportunityId?: string
  limit?: number
} = {}) {
  const { org } = await getContext()
  const supabase = await tryCreateClient()
  if (!supabase) return getDemoActivities(org.id, filters)

  let query = supabase
    .from('activities')
    .select('*, creator:profiles!activities_created_by_fkey(id,first_name,last_name,avatar_url)')
    .eq('organization_id', org.id)
    .order('activity_date', { ascending: false })

  if (filters.leadId) query = query.eq('lead_id', filters.leadId)
  if (filters.contactId) query = query.eq('contact_id', filters.contactId)
  if (filters.companyId) query = query.eq('company_id', filters.companyId)
  if (filters.opportunityId) query = query.eq('opportunity_id', filters.opportunityId)
  if (filters.limit) query = query.limit(filters.limit)

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function createActivity(input: ActivityInput): Promise<ActionResult<{ id: string }>> {
  try {
    const { user, org, membership } = await getContext()
    requirePermission(membership.role, 'activities:create')

    const validated = activitySchema.parse(input)
    const supabase = await tryCreateClient()
    if (!supabase) return { success: false, error: OFFLINE_ACTION_ERROR }

    const { data, error } = await supabase
      .from('activities')
      .insert({
        organization_id: org.id,
        type: validated.type,
        subject: validated.subject,
        description: validated.description ?? null,
        duration_minutes: validated.durationMinutes ?? null,
        outcome: validated.outcome ?? null,
        activity_date: validated.activityDate,
        lead_id: validated.leadId ?? null,
        contact_id: validated.contactId ?? null,
        company_id: validated.companyId ?? null,
        opportunity_id: validated.opportunityId ?? null,
        created_by: user.id,
      })
      .select('id')
      .single()

    if (error) return { success: false, error: error.message }

    revalidatePath('/[locale]/app/activities', 'page')
    revalidatePath('/[locale]/app/dashboard', 'page')
    return { success: true, data: { id: data.id } }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function deleteActivity(id: string): Promise<ActionResult<void>> {
  try {
    const { user, org, membership } = await getContext()
    requirePermission(membership.role, 'activities:delete')

    const supabase = await tryCreateClient()
    if (!supabase) return { success: false, error: OFFLINE_ACTION_ERROR }

    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', id)
      .eq('organization_id', org.id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/[locale]/app/activities', 'page')
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
