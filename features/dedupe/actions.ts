'use server'

import { revalidatePath } from 'next/cache'
import { tryCreateClient } from '@/lib/db/server'
import { OFFLINE_ACTION_ERROR } from '@/lib/mock/offline-messages'
import { requireAuth, getActiveOrganization } from '@/lib/auth/server'
import { requirePermission } from '@/lib/rbac/permissions'
import { createAuditLog, AUDIT_ACTIONS } from '@/lib/audit/log'
import type { ActionResult } from '@/types'

export type ContactDupGroup = {
  key: string
  contacts: { id: string; label: string }[]
}

async function getContext() {
  const user = await requireAuth()
  const orgData = await getActiveOrganization(user.id)
  if (!orgData) throw new Error('No organization found')
  return { user, org: orgData.organization, membership: orgData.membership }
}

export async function listContactDuplicateGroups(): Promise<ContactDupGroup[]> {
  const { org, membership } = await getContext()
  requirePermission(membership.role, 'data:import')

  const supabase = await tryCreateClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('contacts')
    .select('id,first_name,last_name,email')
    .eq('organization_id', org.id)
    .not('email', 'is', null)
    .limit(8000)

  if (error || !data) return []

  const map = new Map<string, { id: string; label: string }[]>()
  for (const c of data) {
    const em = (c.email ?? '').trim().toLowerCase()
    if (!em) continue
    const label = `${c.first_name} ${c.last_name ?? ''}`.trim() + (c.email ? ` · ${c.email}` : '')
    const list = map.get(em) ?? []
    list.push({ id: c.id, label })
    map.set(em, list)
  }

  const out: ContactDupGroup[] = []
  for (const [key, contacts] of map) {
    if (contacts.length > 1) out.push({ key, contacts })
  }
  out.sort((a, b) => b.contacts.length - a.contacts.length)
  return out
}

export async function mergeContacts(primaryId: string, secondaryId: string): Promise<ActionResult<void>> {
  try {
    const { user, org, membership } = await getContext()
    requirePermission(membership.role, 'data:merge')

    if (primaryId === secondaryId) {
      return { success: false, error: 'Cannot merge a record into itself.' }
    }

    const supabase = await tryCreateClient()
    if (!supabase) return { success: false, error: OFFLINE_ACTION_ERROR }

    const { data: pair, error: loadErr } = await supabase
      .from('contacts')
      .select('id')
      .eq('organization_id', org.id)
      .in('id', [primaryId, secondaryId])

    if (loadErr || !pair || pair.length !== 2) {
      return { success: false, error: 'Contacts not found in organization.' }
    }

    const { error: n1 } = await supabase
      .from('notes')
      .update({ contact_id: primaryId })
      .eq('contact_id', secondaryId)
      .eq('organization_id', org.id)
    if (n1) return { success: false, error: n1.message }

    const { error: a1 } = await supabase
      .from('activities')
      .update({ contact_id: primaryId })
      .eq('contact_id', secondaryId)
      .eq('organization_id', org.id)
    if (a1) return { success: false, error: a1.message }

    const { error: t1 } = await supabase
      .from('tasks')
      .update({ contact_id: primaryId })
      .eq('contact_id', secondaryId)
      .eq('organization_id', org.id)
    if (t1) return { success: false, error: t1.message }

    const { error: o1 } = await supabase
      .from('opportunities')
      .update({ contact_id: primaryId })
      .eq('contact_id', secondaryId)
      .eq('organization_id', org.id)
    if (o1) return { success: false, error: o1.message }

    const { error: q1 } = await supabase
      .from('quotes')
      .update({ contact_id: primaryId })
      .eq('contact_id', secondaryId)
      .eq('organization_id', org.id)
    if (q1) return { success: false, error: q1.message }

    const { error: del } = await supabase
      .from('contacts')
      .delete()
      .eq('id', secondaryId)
      .eq('organization_id', org.id)
    if (del) return { success: false, error: del.message }

    await createAuditLog({
      organizationId: org.id,
      actorId: user.id,
      action: AUDIT_ACTIONS.CONTACT_MERGED,
      entityType: 'contact',
      entityId: primaryId,
      metadata: { mergedFrom: secondaryId },
    })

    revalidatePath('/[locale]/app/contacts', 'page')
    revalidatePath(`/[locale]/app/contacts/${primaryId}`, 'page')
    revalidatePath('/[locale]/app/settings/data', 'page')

    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
