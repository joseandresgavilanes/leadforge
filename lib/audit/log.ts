import type { Json } from '@/types/supabase'

interface AuditLogEntry {
  organizationId: string
  actorId?: string | null
  action: string
  entityType: string
  entityId?: string | null
  metadata?: Record<string, unknown>
}

export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    const { tryCreateClient } = await import('@/lib/db/server')
    const supabase = await tryCreateClient()
    if (!supabase) return

    await supabase.from('audit_logs').insert({
      organization_id: entry.organizationId,
      actor_id: entry.actorId ?? null,
      action: entry.action,
      entity_type: entry.entityType,
      entity_id: entry.entityId ?? null,
      metadata: (entry.metadata ?? {}) as Json,
    })
  } catch {
    // Audit logs should not break the app
  }
}

// Common audit action constants
export const AUDIT_ACTIONS = {
  // Leads
  LEAD_CREATED: 'lead.created',
  LEAD_UPDATED: 'lead.updated',
  LEAD_DELETED: 'lead.deleted',
  LEAD_CONVERTED: 'lead.converted',
  // Contacts
  CONTACT_CREATED: 'contact.created',
  CONTACT_UPDATED: 'contact.updated',
  CONTACT_DELETED: 'contact.deleted',
  // Companies
  COMPANY_CREATED: 'company.created',
  COMPANY_UPDATED: 'company.updated',
  COMPANY_DELETED: 'company.deleted',
  // Opportunities
  OPPORTUNITY_CREATED: 'opportunity.created',
  OPPORTUNITY_UPDATED: 'opportunity.updated',
  OPPORTUNITY_DELETED: 'opportunity.deleted',
  OPPORTUNITY_STAGE_CHANGED: 'opportunity.stage_changed',
  // Tasks
  TASK_CREATED: 'task.created',
  TASK_COMPLETED: 'task.completed',
  TASK_DELETED: 'task.deleted',
  // Quotes
  QUOTE_CREATED: 'quote.created',
  QUOTE_SENT: 'quote.sent',
  QUOTE_ACCEPTED: 'quote.accepted',
  // Team
  MEMBER_INVITED: 'member.invited',
  MEMBER_REMOVED: 'member.removed',
  MEMBER_ROLE_CHANGED: 'member.role_changed',
  // Auth
  USER_LOGGED_IN: 'user.logged_in',
  USER_LOGGED_OUT: 'user.logged_out',
  PASSWORD_CHANGED: 'user.password_changed',
  // Billing
  PLAN_UPGRADED: 'billing.plan_upgraded',
  PLAN_DOWNGRADED: 'billing.plan_downgraded',
  SUBSCRIPTION_CANCELLED: 'billing.subscription_cancelled',
} as const
