'use server'

import { tryCreateClient } from '@/lib/db/server'
import { requireAuth, getActiveOrganization } from '@/lib/auth/server'
import { requirePermission, type Permission } from '@/lib/rbac/permissions'

export type TimelineEntity = 'lead' | 'contact' | 'company' | 'opportunity'

export type TimelineEvent = {
  id: string
  kind: 'note' | 'activity' | 'task' | 'audit' | 'quote'
  title: string
  subtitle: string | null
  occurredAt: string
  actorName: string | null
}

const ENTITY_READ: Record<TimelineEntity, Permission> = {
  lead: 'leads:read',
  contact: 'contacts:read',
  company: 'companies:read',
  opportunity: 'opportunities:read',
}

type QuoteTimelineRow = {
  id: string
  title: string
  quote_number: string
  status: string
  updated_at: string
}

function actorLabel(
  profiles: Map<string, { first_name: string | null; last_name: string | null }>,
  id: string | null | undefined
): string | null {
  if (!id) return null
  const p = profiles.get(id)
  if (!p) return null
  return [p.first_name, p.last_name].filter(Boolean).join(' ') || null
}

function auditSubtitle(metadata: unknown): string | null {
  if (metadata == null || typeof metadata !== 'object') return null
  const m = metadata as Record<string, unknown>
  const bits: string[] = []
  if (typeof m.previousStageId === 'string') bits.push(`prev ${m.previousStageId.slice(0, 8)}…`)
  if (typeof m.newStageId === 'string') bits.push(`→ ${m.newStageId.slice(0, 8)}…`)
  if (typeof m.contactId === 'string') bits.push('contact linked')
  if (typeof m.companyId === 'string') bits.push('company linked')
  if (bits.length) return bits.join(' · ')
  try {
    const s = JSON.stringify(metadata)
    return s.length > 160 ? `${s.slice(0, 157)}…` : s
  } catch {
    return null
  }
}

export async function getEntityTimeline(
  entity: TimelineEntity,
  entityId: string
): Promise<TimelineEvent[]> {
  const user = await requireAuth()
  const orgData = await getActiveOrganization(user.id)
  if (!orgData) return []
  requirePermission(orgData.membership.role, ENTITY_READ[entity])

  const supabase = await tryCreateClient()
  if (!supabase) return []

  const orgId = orgData.organization.id
  const fk =
    entity === 'lead'
      ? 'lead_id'
      : entity === 'contact'
        ? 'contact_id'
        : entity === 'company'
          ? 'company_id'
          : 'opportunity_id'

  const quotesPromise =
    entity === 'opportunity'
      ? supabase
          .from('quotes')
          .select('id,title,quote_number,status,updated_at')
          .eq('organization_id', orgId)
          .eq('opportunity_id', entityId)
      : Promise.resolve({ data: [] as QuoteTimelineRow[] })

  const [notesRes, activitiesRes, tasksRes, auditRes, quotesRes] = await Promise.all([
    supabase.from('notes').select('*').eq('organization_id', orgId).eq(fk, entityId),
    supabase.from('activities').select('*').eq('organization_id', orgId).eq(fk, entityId),
    supabase.from('tasks').select('*').eq('organization_id', orgId).eq(fk, entityId),
    supabase
      .from('audit_logs')
      .select('*')
      .eq('organization_id', orgId)
      .eq('entity_id', entityId)
      .eq('entity_type', entity),
    quotesPromise,
  ])

  const actorIds = new Set<string>()
  for (const n of notesRes.data ?? []) {
    if (n.created_by) actorIds.add(n.created_by)
  }
  for (const a of activitiesRes.data ?? []) {
    if (a.created_by) actorIds.add(a.created_by)
  }
  for (const t of tasksRes.data ?? []) {
    if (t.created_by) actorIds.add(t.created_by)
    if (t.owner_id) actorIds.add(t.owner_id)
  }
  for (const l of auditRes.data ?? []) {
    if (l.actor_id) actorIds.add(l.actor_id)
  }

  let profilesMap = new Map<string, { first_name: string | null; last_name: string | null }>()
  if (actorIds.size > 0) {
    const { data: profs } = await supabase
      .from('profiles')
      .select('id,first_name,last_name')
      .in('id', [...actorIds])
    for (const p of profs ?? []) {
      profilesMap.set(p.id, { first_name: p.first_name, last_name: p.last_name })
    }
  }

  const events: TimelineEvent[] = []

  for (const n of notesRes.data ?? []) {
    events.push({
      id: `note-${n.id}`,
      kind: 'note',
      title: n.content.slice(0, 120) + (n.content.length > 120 ? '…' : ''),
      subtitle: null,
      occurredAt: n.created_at,
      actorName: actorLabel(profilesMap, n.created_by),
    })
  }

  for (const a of activitiesRes.data ?? []) {
    events.push({
      id: `act-${a.id}`,
      kind: 'activity',
      title: a.subject,
      subtitle: a.type,
      occurredAt: a.activity_date,
      actorName: actorLabel(profilesMap, a.created_by),
    })
  }

  for (const t of tasksRes.data ?? []) {
    const when = t.completed_at ?? t.created_at
    events.push({
      id: `task-${t.id}`,
      kind: 'task',
      title: t.title,
      subtitle: t.completed_at ? `completed · ${t.priority}` : `open · ${t.priority}`,
      occurredAt: when,
      actorName: actorLabel(profilesMap, t.owner_id ?? t.created_by),
    })
  }

  for (const l of auditRes.data ?? []) {
    events.push({
      id: `audit-${l.id}`,
      kind: 'audit',
      title: l.action.replace(/\./g, ' · '),
      subtitle: auditSubtitle(l.metadata),
      occurredAt: l.created_at,
      actorName: actorLabel(profilesMap, l.actor_id),
    })
  }

  for (const q of quotesRes.data ?? []) {
    events.push({
      id: `quote-${q.id}`,
      kind: 'quote',
      title: `${q.quote_number} — ${q.title}`,
      subtitle: q.status,
      occurredAt: q.updated_at,
      actorName: null,
    })
  }

  events.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
  return events
}
