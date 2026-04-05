'use server'

import { revalidatePath } from 'next/cache'
import { tryCreateClient } from '@/lib/db/server'
import { OFFLINE_ACTION_ERROR } from '@/lib/mock/offline-messages'
import { requireAuth, getActiveOrganization } from '@/lib/auth/server'
import { requirePermission } from '@/lib/rbac/permissions'
import { createAuditLog, AUDIT_ACTIONS } from '@/lib/audit/log'
import type { ActionResult } from '@/types'
import type { Json } from '@/types/supabase'
import type { SavedViewsRow } from '@/types/supabase'

export type SavedEntityType = SavedViewsRow['entity_type']

async function getContext() {
  const user = await requireAuth()
  const orgData = await getActiveOrganization(user.id)
  if (!orgData) throw new Error('No organization found')
  return { user, org: orgData.organization, membership: orgData.membership }
}

export type LeadViewFilters = {
  status?: string
  source?: string
  search?: string
}

export async function listSavedViews(entityType: SavedEntityType): Promise<SavedViewsRow[]> {
  const { user, org, membership } = await getContext()
  requirePermission(membership.role, 'views:read')
  const supabase = await tryCreateClient()
  if (!supabase) return []
  const { data } = await supabase
    .from('saved_views')
    .select('*')
    .eq('organization_id', org.id)
    .eq('entity_type', entityType)
    .or(`user_id.eq.${user.id},is_shared.eq.true`)
    .order('is_pinned', { ascending: false })
    .order('name')
  return (data ?? []) as SavedViewsRow[]
}

export async function getSavedView(id: string): Promise<SavedViewsRow | null> {
  const { user, org, membership } = await getContext()
  requirePermission(membership.role, 'views:read')
  const supabase = await tryCreateClient()
  if (!supabase) return null
  const { data } = await supabase.from('saved_views').select('*').eq('id', id).eq('organization_id', org.id).single()
  if (!data) return null
  const row = data as SavedViewsRow
  if (row.user_id !== user.id && !row.is_shared) return null
  return row
}

export async function createSavedView(input: {
  entityType: SavedEntityType
  name: string
  filters: LeadViewFilters | Record<string, unknown>
  isShared?: boolean
  isPinned?: boolean
}): Promise<ActionResult<{ id: string }>> {
  try {
    const { user, org, membership } = await getContext()
    requirePermission(membership.role, 'views:manage')
    const supabase = await tryCreateClient()
    if (!supabase) return { success: false, error: OFFLINE_ACTION_ERROR }

    const { data, error } = await supabase
      .from('saved_views')
      .insert({
        organization_id: org.id,
        user_id: user.id,
        entity_type: input.entityType,
        name: input.name.trim(),
        is_shared: input.isShared ?? false,
        is_pinned: input.isPinned ?? false,
        filters: input.filters as Json,
      })
      .select('id')
      .single()

    if (error) return { success: false, error: error.message }

    await createAuditLog({
      organizationId: org.id,
      actorId: user.id,
      action: AUDIT_ACTIONS.SAVED_VIEW_CREATED,
      entityType: 'saved_view',
      entityId: data.id,
      metadata: { entityType: input.entityType, name: input.name },
    })

    revalidatePath('/[locale]/app/leads', 'page')
    return { success: true, data: { id: data.id } }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function deleteSavedView(id: string): Promise<ActionResult<void>> {
  try {
    const { user, org, membership } = await getContext()
    requirePermission(membership.role, 'views:manage')
    const supabase = await tryCreateClient()
    if (!supabase) return { success: false, error: OFFLINE_ACTION_ERROR }
    const { error } = await supabase
      .from('saved_views')
      .delete()
      .eq('id', id)
      .eq('organization_id', org.id)
      .eq('user_id', user.id)
    if (error) return { success: false, error: error.message }
    revalidatePath('/[locale]/app/leads', 'page')
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
