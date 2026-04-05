'use server'

import { revalidatePath } from 'next/cache'
import { tryCreateClient } from '@/lib/db/server'
import { OFFLINE_ACTION_ERROR } from '@/lib/mock/offline-messages'
import { requireAuth, getActiveOrganization } from '@/lib/auth/server'
import { requirePermission } from '@/lib/rbac/permissions'
import { createAuditLog, AUDIT_ACTIONS } from '@/lib/audit/log'
import type { ActionResult } from '@/types'
import type { CommunicationThreadsRow, EmailTemplatesRow, EmailSnippetsRow } from '@/types/supabase'

async function getContext() {
  const user = await requireAuth()
  const orgData = await getActiveOrganization(user.id)
  if (!orgData) throw new Error('No organization found')
  return { user, org: orgData.organization, membership: orgData.membership }
}

export async function listThreads(limit = 50): Promise<CommunicationThreadsRow[]> {
  const { org, membership } = await getContext()
  requirePermission(membership.role, 'communications:read')
  const supabase = await tryCreateClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('communication_threads')
    .select('*')
    .eq('organization_id', org.id)
    .order('last_message_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []) as CommunicationThreadsRow[]
}

export async function getThread(threadId: string) {
  const { org, membership } = await getContext()
  requirePermission(membership.role, 'communications:read')
  const supabase = await tryCreateClient()
  if (!supabase) return null

  const { data: thread } = await supabase
    .from('communication_threads')
    .select('*')
    .eq('id', threadId)
    .eq('organization_id', org.id)
    .single()

  if (!thread) return null

  const { data: messages } = await supabase
    .from('communication_messages')
    .select('*')
    .eq('thread_id', threadId)
    .order('logged_at', { ascending: true })

  return { thread, messages: messages ?? [] }
}

export async function createThread(input: {
  subject: string
  leadId?: string | null
  contactId?: string | null
  companyId?: string | null
  opportunityId?: string | null
}): Promise<ActionResult<{ id: string }>> {
  try {
    const { user, org, membership } = await getContext()
    requirePermission(membership.role, 'communications:manage')
    const supabase = await tryCreateClient()
    if (!supabase) return { success: false, error: OFFLINE_ACTION_ERROR }

    if (!input.leadId && !input.contactId && !input.companyId && !input.opportunityId) {
      return { success: false, error: 'Link the thread to a record.' }
    }

    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from('communication_threads')
      .insert({
        organization_id: org.id,
        subject: input.subject.trim(),
        lead_id: input.leadId ?? null,
        contact_id: input.contactId ?? null,
        company_id: input.companyId ?? null,
        opportunity_id: input.opportunityId ?? null,
        created_by: user.id,
        last_message_at: now,
      })
      .select('id')
      .single()

    if (error) return { success: false, error: error.message }

    await createAuditLog({
      organizationId: org.id,
      actorId: user.id,
      action: AUDIT_ACTIONS.COMM_THREAD_CREATED,
      entityType: 'communication_thread',
      entityId: data.id,
    })

    revalidatePath('/[locale]/app/inbox', 'page')
    return { success: true, data: { id: data.id } }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function logMessage(input: {
  threadId: string
  direction: 'inbound' | 'outbound'
  channel: 'email' | 'call' | 'meeting' | 'demo' | 'note'
  subject?: string | null
  body: string
}): Promise<ActionResult<void>> {
  try {
    const { user, org, membership } = await getContext()
    requirePermission(membership.role, 'communications:manage')
    const supabase = await tryCreateClient()
    if (!supabase) return { success: false, error: OFFLINE_ACTION_ERROR }

    const { data: threadRow } = await supabase
      .from('communication_threads')
      .select('id, lead_id, contact_id, company_id, opportunity_id')
      .eq('id', input.threadId)
      .eq('organization_id', org.id)
      .single()
    if (!threadRow) return { success: false, error: 'Thread not found' }

    const now = new Date().toISOString()
    const { error } = await supabase.from('communication_messages').insert({
      thread_id: input.threadId,
      direction: input.direction,
      channel: input.channel,
      subject: input.subject?.trim() || null,
      body: input.body.trim(),
      logged_at: now,
      created_by: user.id,
    })

    if (error) return { success: false, error: error.message }

    await supabase
      .from('communication_threads')
      .update({ last_message_at: now, updated_at: now })
      .eq('id', input.threadId)

    const activityType =
      input.channel === 'call'
        ? 'call'
        : input.channel === 'meeting'
          ? 'meeting'
          : input.channel === 'demo'
            ? 'demo'
            : input.channel === 'email'
              ? 'email'
              : 'note'

    await supabase.from('activities').insert({
      organization_id: org.id,
      type: activityType,
      subject: input.subject?.trim() || `${input.channel} logged`,
      description: input.body.trim(),
      activity_date: now,
      lead_id: threadRow.lead_id,
      contact_id: threadRow.contact_id,
      company_id: threadRow.company_id,
      opportunity_id: threadRow.opportunity_id,
      created_by: user.id,
    })

    await createAuditLog({
      organizationId: org.id,
      actorId: user.id,
      action: AUDIT_ACTIONS.COMM_MESSAGE_LOGGED,
      entityType: 'communication_thread',
      entityId: input.threadId,
      metadata: { channel: input.channel, direction: input.direction },
    })

    revalidatePath('/[locale]/app/inbox', 'page')
    revalidatePath(`/[locale]/app/inbox/${input.threadId}`, 'page')
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function listEmailTemplates(): Promise<EmailTemplatesRow[]> {
  const { org, membership } = await getContext()
  requirePermission(membership.role, 'communications:read')
  const supabase = await tryCreateClient()
  if (!supabase) return []
  const { data } = await supabase
    .from('email_templates')
    .select('*')
    .eq('organization_id', org.id)
    .order('name')
  return (data ?? []) as EmailTemplatesRow[]
}

export async function listEmailSnippets(): Promise<EmailSnippetsRow[]> {
  const { org, membership } = await getContext()
  requirePermission(membership.role, 'communications:read')
  const supabase = await tryCreateClient()
  if (!supabase) return []
  const { data } = await supabase
    .from('email_snippets')
    .select('*')
    .eq('organization_id', org.id)
    .order('name')
  return (data ?? []) as EmailSnippetsRow[]
}

export async function createEmailTemplate(input: {
  name: string
  subject: string
  body: string
  category?: string | null
}): Promise<ActionResult<{ id: string }>> {
  try {
    const { user, org, membership } = await getContext()
    requirePermission(membership.role, 'communications:manage')
    const supabase = await tryCreateClient()
    if (!supabase) return { success: false, error: OFFLINE_ACTION_ERROR }
    const { data, error } = await supabase
      .from('email_templates')
      .insert({
        organization_id: org.id,
        name: input.name.trim(),
        subject: input.subject.trim(),
        body: input.body.trim(),
        category: input.category ?? null,
        created_by: user.id,
      })
      .select('id')
      .single()
    if (error) return { success: false, error: error.message }
    revalidatePath('/[locale]/app/inbox', 'page')
    return { success: true, data: { id: data.id } }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
