'use server'

import { revalidatePath } from 'next/cache'
import { tryCreateClient } from '@/lib/db/server'
import { OFFLINE_ACTION_ERROR } from '@/lib/mock/offline-messages'
import { requireAuth, getActiveOrganization } from '@/lib/auth/server'
import { requirePermission } from '@/lib/rbac/permissions'
import { noteSchema } from '@/lib/validators/schemas'
import type { ActionResult } from '@/types'

async function getContext() {
  const user = await requireAuth()
  const orgData = await getActiveOrganization(user.id)
  if (!orgData) throw new Error('No organization')
  return { user, org: orgData.organization, membership: orgData.membership }
}

export async function createNote(input: {
  content: string
  leadId?: string | null
  contactId?: string | null
  companyId?: string | null
  opportunityId?: string | null
}): Promise<ActionResult<{ id: string }>> {
  try {
    const { user, org, membership } = await getContext()

    const v = noteSchema.parse({
      content: input.content,
      leadId: input.leadId,
      contactId: input.contactId,
      companyId: input.companyId,
      opportunityId: input.opportunityId,
    })

    if (v.leadId) requirePermission(membership.role, 'leads:update')
    else if (v.contactId) requirePermission(membership.role, 'contacts:update')
    else if (v.companyId) requirePermission(membership.role, 'companies:update')
    else if (v.opportunityId) requirePermission(membership.role, 'opportunities:update')

    const supabase = await tryCreateClient()
    if (!supabase) return { success: false, error: OFFLINE_ACTION_ERROR }

    const { data, error } = await supabase
      .from('notes')
      .insert({
        organization_id: org.id,
        content: v.content,
        lead_id: v.leadId ?? null,
        contact_id: v.contactId ?? null,
        company_id: v.companyId ?? null,
        opportunity_id: v.opportunityId ?? null,
        created_by: user.id,
      })
      .select('id')
      .single()

    if (error) return { success: false, error: error.message }

    revalidatePath('/', 'layout')
    return { success: true, data: { id: data.id } }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Failed' }
  }
}
