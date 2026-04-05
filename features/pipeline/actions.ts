'use server'

import { revalidatePath } from 'next/cache'
import { tryCreateClient } from '@/lib/db/server'
import { OFFLINE_ACTION_ERROR } from '@/lib/mock/offline-messages'
import { requireAuth, getActiveOrganization } from '@/lib/auth/server'
import { requirePermission } from '@/lib/rbac/permissions'
import { pipelineStageSchema } from '@/lib/validators/schemas'
import { createAuditLog, AUDIT_ACTIONS } from '@/lib/audit/log'
import type { ActionResult } from '@/types'

async function ctx() {
  const user = await requireAuth()
  const orgData = await getActiveOrganization(user.id)
  if (!orgData) throw new Error('No organization')
  return { user, org: orgData.organization, membership: orgData.membership }
}

export async function createPipelineStage(input: {
  name: string
  probability: number
  color: string
  position: number
}): Promise<ActionResult<{ id: string }>> {
  try {
    const { user, org, membership } = await ctx()
    requirePermission(membership.role, 'pipeline:configure')
    const v = pipelineStageSchema.parse(input)
    const supabase = await tryCreateClient()
    if (!supabase) return { success: false, error: OFFLINE_ACTION_ERROR }

    const { data, error } = await supabase
      .from('opportunity_stages')
      .insert({
        organization_id: org.id,
        name: v.name,
        probability: v.probability,
        color: v.color,
        position: v.position,
        is_closed_won: false,
        is_closed_lost: false,
      })
      .select('id')
      .single()
    if (error) return { success: false, error: error.message }
    await createAuditLog({
      organizationId: org.id,
      actorId: user.id,
      action: AUDIT_ACTIONS.OPPORTUNITY_UPDATED,
      entityType: 'opportunity_stage',
      entityId: data.id,
      metadata: { name: v.name },
    })
    revalidatePath('/[locale]/app/settings', 'page')
    revalidatePath('/[locale]/app/opportunities', 'page')
    return { success: true, data: { id: data.id } }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Failed' }
  }
}

export async function updatePipelineStage(
  id: string,
  input: Partial<{ name: string; probability: number; color: string; position: number }>
): Promise<ActionResult<void>> {
  try {
    const { user, org, membership } = await ctx()
    requirePermission(membership.role, 'pipeline:configure')
    const supabase = await tryCreateClient()
    if (!supabase) return { success: false, error: OFFLINE_ACTION_ERROR }

    const { error } = await supabase
      .from('opportunity_stages')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('organization_id', org.id)
    if (error) return { success: false, error: error.message }
    revalidatePath('/[locale]/app/settings', 'page')
    revalidatePath('/[locale]/app/opportunities', 'page')
    return { success: true, data: undefined }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Failed' }
  }
}
