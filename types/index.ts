import type { Tables } from './supabase'

// Re-export table row types as domain types
export type Organization = Tables<'organizations'>
export type Membership = Tables<'memberships'>
export type Profile = Tables<'profiles'>
export type Lead = Tables<'leads'>
export type Contact = Tables<'contacts'>
export type Company = Tables<'companies'>
export type OpportunityStage = Tables<'opportunity_stages'>
export type Opportunity = Tables<'opportunities'>
export type Activity = Tables<'activities'>
export type Task = Tables<'tasks'>
export type Quote = Tables<'quotes'>
export type QuoteItem = Tables<'quote_items'>
export type Note = Tables<'notes'>
export type AuditLog = Tables<'audit_logs'>
export type Invitation = Tables<'invitations'>

// Role types
export type OrgRole = 'org_admin' | 'sales_manager' | 'sales_rep' | 'viewer'
export type Plan = 'starter' | 'growth' | 'pro'

// Extended types with joins
export type LeadWithOwner = Lead & {
  owner?: Pick<Profile, 'id' | 'first_name' | 'last_name' | 'avatar_url'> | null
}

export type OpportunityWithStage = Opportunity & {
  stage: OpportunityStage
  owner?: Pick<Profile, 'id' | 'first_name' | 'last_name' | 'avatar_url'> | null
  contact?: Pick<Contact, 'id' | 'first_name' | 'last_name' | 'email'> | null
  company?: Pick<Company, 'id' | 'name'> | null
}

export type ContactWithCompany = Contact & {
  company?: Pick<Company, 'id' | 'name'> | null
  owner?: Pick<Profile, 'id' | 'first_name' | 'last_name'> | null
}

export type QuoteWithItems = Quote & {
  items: QuoteItem[]
  opportunity?: Pick<Opportunity, 'id' | 'name'> | null
  contact?: Pick<Contact, 'id' | 'first_name' | 'last_name' | 'email'> | null
  company?: Pick<Company, 'id' | 'name'> | null
}

export type TaskWithRelations = Task & {
  owner?: Pick<Profile, 'id' | 'first_name' | 'last_name'> | null
  opportunity?: Pick<Opportunity, 'id' | 'name'> | null
  contact?: Pick<Contact, 'id' | 'first_name' | 'last_name'> | null
  company?: Pick<Company, 'id' | 'name'> | null
  lead?: Pick<Lead, 'id' | 'first_name' | 'last_name'> | null
}

export type MemberWithProfile = Membership & {
  profile: Profile
}

// Dashboard stats
export interface DashboardStats {
  newLeads: number
  openOpportunities: number
  pipelineValue: number
  monthlyForecast: number
  newLeadsChange: number
  pipelineChange: number
}

// Plan limits
export interface PlanLimits {
  maxUsers: number
  maxLeads: number
  maxQuotesPerMonth: number
  hasReports: boolean
  hasAI: boolean
  hasCustomFields: boolean
  hasApiAccess: boolean
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  starter: {
    maxUsers: 3,
    maxLeads: 500,
    maxQuotesPerMonth: 10,
    hasReports: false,
    hasAI: false,
    hasCustomFields: false,
    hasApiAccess: false,
  },
  growth: {
    maxUsers: 10,
    maxLeads: 5000,
    maxQuotesPerMonth: 100,
    hasReports: true,
    hasAI: true,
    hasCustomFields: false,
    hasApiAccess: false,
  },
  pro: {
    maxUsers: 999,
    maxLeads: 999999,
    maxQuotesPerMonth: 999,
    hasReports: true,
    hasAI: true,
    hasCustomFields: true,
    hasApiAccess: true,
  },
}

// Action result type for server actions
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

// Pagination
export interface PaginationParams {
  page: number
  pageSize: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// Filter params
export interface LeadFilters {
  status?: Lead['status']
  source?: string
  ownerId?: string
  search?: string
  dateFrom?: string
  dateTo?: string
}

export interface OpportunityFilters {
  stageId?: string
  ownerId?: string
  search?: string
  dateFrom?: string
  dateTo?: string
  minValue?: number
  maxValue?: number
}

export interface TaskFilters {
  status?: 'open' | 'completed' | 'overdue' | 'due_today'
  priority?: Task['priority']
  ownerId?: string
  search?: string
}

// Analytics event types
export type AnalyticsEventName =
  | 'lead_created'
  | 'lead_converted'
  | 'opportunity_created'
  | 'opportunity_stage_changed'
  | 'task_created'
  | 'quote_created'
  | 'demo_requested'
  | 'trial_started'
  | 'upgrade_completed'
  | 'page_viewed'
  | 'signup_started'
  | 'signup_completed'
  | 'upgrade_clicked'

export interface AnalyticsEvent {
  event: AnalyticsEventName
  properties?: Record<string, unknown>
}
