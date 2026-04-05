export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type OrganizationsRow = {
  id: string
  name: string
  slug: string
  domain: string | null
  industry: string | null
  timezone: string
  currency: string
  logo_url: string | null
  plan: 'starter' | 'growth' | 'pro'
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  subscription_status: 'trialing' | 'active' | 'past_due' | 'cancelled' | null
  trial_ends_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export type MembershipsRow = {
  id: string
  organization_id: string
  user_id: string
  role: 'org_admin' | 'sales_manager' | 'sales_rep' | 'viewer'
  invited_by: string | null
  invited_at: string | null
  accepted_at: string | null
  created_at: string
  updated_at: string
}

export type ProfilesRow = {
  id: string
  first_name: string | null
  last_name: string | null
  email: string
  phone: string | null
  job_title: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export type LeadsRow = {
  id: string
  organization_id: string
  first_name: string
  last_name: string | null
  email: string | null
  phone: string | null
  company: string | null
  job_title: string | null
  source: string | null
  status: 'new' | 'contacted' | 'qualified' | 'unqualified' | 'converted'
  score: number
  owner_id: string | null
  tags: string[]
  notes: string | null
  website: string | null
  industry: string | null
  budget: number | null
  converted_at: string | null
  converted_contact_id: string | null
  converted_company_id: string | null
  converted_opportunity_id: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export type ContactsRow = {
  id: string
  organization_id: string
  first_name: string
  last_name: string | null
  email: string | null
  phone: string | null
  job_title: string | null
  company_id: string | null
  owner_id: string | null
  tags: string[]
  notes: string | null
  linkedin_url: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export type CompaniesRow = {
  id: string
  organization_id: string
  name: string
  domain: string | null
  industry: string | null
  size: string | null
  annual_revenue: number | null
  phone: string | null
  address: string | null
  city: string | null
  country: string | null
  website: string | null
  owner_id: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export type OpportunityStagesRow = {
  id: string
  organization_id: string
  name: string
  position: number
  probability: number
  color: string
  is_closed_won: boolean
  is_closed_lost: boolean
  created_at: string
  updated_at: string
}

export type OpportunitiesRow = {
  id: string
  organization_id: string
  name: string
  value: number
  stage_id: string
  probability: number
  close_date: string | null
  owner_id: string | null
  contact_id: string | null
  company_id: string | null
  source: string | null
  next_action: string | null
  lost_reason: string | null
  competitor: string | null
  notes: string | null
  closed_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export type ActivitiesRow = {
  id: string
  organization_id: string
  type: 'call' | 'meeting' | 'email' | 'note' | 'demo' | 'task'
  subject: string
  description: string | null
  duration_minutes: number | null
  outcome: string | null
  activity_date: string
  lead_id: string | null
  contact_id: string | null
  company_id: string | null
  opportunity_id: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export type TasksRow = {
  id: string
  organization_id: string
  title: string
  description: string | null
  priority: 'low' | 'medium' | 'high' | 'urgent'
  due_date: string | null
  completed_at: string | null
  owner_id: string | null
  lead_id: string | null
  contact_id: string | null
  company_id: string | null
  opportunity_id: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export type QuotesRow = {
  id: string
  organization_id: string
  quote_number: string
  title: string
  opportunity_id: string | null
  contact_id: string | null
  company_id: string | null
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired' | 'cancelled'
  issue_date: string
  expiry_date: string | null
  subtotal: number
  tax_rate: number
  tax_amount: number
  discount: number
  total: number
  notes: string | null
  terms: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export type QuoteItemsRow = {
  id: string
  quote_id: string
  description: string
  quantity: number
  unit_price: number
  amount: number
  position: number
  created_at: string
}

export type NotesRow = {
  id: string
  organization_id: string
  content: string
  lead_id: string | null
  contact_id: string | null
  company_id: string | null
  opportunity_id: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export type AuditLogsRow = {
  id: string
  organization_id: string
  actor_id: string | null
  action: string
  entity_type: string
  entity_id: string | null
  metadata: Json
  created_at: string
}

export type InvitationsRow = {
  id: string
  organization_id: string
  email: string
  role: 'org_admin' | 'sales_manager' | 'sales_rep' | 'viewer'
  token: string
  invited_by: string | null
  accepted_at: string | null
  expires_at: string
  created_at: string
}

export type AnalyticsEventsRow = {
  id: string
  organization_id: string | null
  user_id: string | null
  event: string
  properties: Json
  created_at: string
}

export type ImportRunsRow = {
  id: string
  organization_id: string
  created_by: string | null
  entity_type: 'leads' | 'contacts' | 'companies' | 'opportunities'
  file_name: string | null
  dry_run: boolean
  summary: Json
  created_at: string
}

type StripMeta<T extends Record<string, unknown>> = Omit<T, 'id' | 'created_at' | 'updated_at'>

/**
 * Insert DTO: DB columns typed as `| null` can be omitted on insert.
 * Matches typical Supabase-generated Insert ergonomics.
 */
export type TableInsert<T extends Record<string, unknown>> = Partial<{
  [K in keyof StripMeta<T> as null extends StripMeta<T>[K] ? K : never]: StripMeta<T>[K]
}> & {
  [K in keyof StripMeta<T> as null extends StripMeta<T>[K] ? never : K]: StripMeta<T>[K]
}

type StripShort<T extends Record<string, unknown>> = Omit<T, 'id' | 'created_at'>

export type TableInsertShort<T extends Record<string, unknown>> = Partial<{
  [K in keyof StripShort<T> as null extends StripShort<T>[K] ? K : never]: StripShort<T>[K]
}> & {
  [K in keyof StripShort<T> as null extends StripShort<T>[K] ? never : K]: StripShort<T>[K]
}

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: OrganizationsRow
        Insert: TableInsert<OrganizationsRow>
        Update: Partial<TableInsert<OrganizationsRow>>
        Relationships: []
      }
      memberships: {
        Row: MembershipsRow
        Insert: TableInsert<MembershipsRow>
        Update: Partial<TableInsert<MembershipsRow>>
        Relationships: [
          {
            foreignKeyName: 'memberships_organization_id_fkey',
            columns: ['organization_id'],
            isOneToOne: false,
            referencedRelation: 'organizations',
            referencedColumns: ['id'],
          },
          {
            foreignKeyName: 'memberships_user_id_fkey',
            columns: ['user_id'],
            isOneToOne: false,
            referencedRelation: 'profiles',
            referencedColumns: ['id'],
          },
        ]
      }
      profiles: {
        Row: ProfilesRow
        Insert: TableInsert<ProfilesRow>
        Update: Partial<TableInsert<ProfilesRow>>
        Relationships: []
      }
      leads: {
        Row: LeadsRow
        Insert: TableInsert<LeadsRow>
        Update: Partial<TableInsert<LeadsRow>>
        Relationships: [
          {
            foreignKeyName: 'leads_organization_id_fkey',
            columns: ['organization_id'],
            isOneToOne: false,
            referencedRelation: 'organizations',
            referencedColumns: ['id'],
          },
          {
            foreignKeyName: 'leads_owner_id_fkey',
            columns: ['owner_id'],
            isOneToOne: false,
            referencedRelation: 'profiles',
            referencedColumns: ['id'],
          },
        ]
      }
      contacts: {
        Row: ContactsRow
        Insert: TableInsert<ContactsRow>
        Update: Partial<TableInsert<ContactsRow>>
        Relationships: [
          {
            foreignKeyName: 'contacts_organization_id_fkey',
            columns: ['organization_id'],
            isOneToOne: false,
            referencedRelation: 'organizations',
            referencedColumns: ['id'],
          },
          {
            foreignKeyName: 'contacts_company_id_fkey',
            columns: ['company_id'],
            isOneToOne: false,
            referencedRelation: 'companies',
            referencedColumns: ['id'],
          },
          {
            foreignKeyName: 'contacts_owner_id_fkey',
            columns: ['owner_id'],
            isOneToOne: false,
            referencedRelation: 'profiles',
            referencedColumns: ['id'],
          },
        ]
      }
      companies: {
        Row: CompaniesRow
        Insert: TableInsert<CompaniesRow>
        Update: Partial<TableInsert<CompaniesRow>>
        Relationships: [
          {
            foreignKeyName: 'companies_organization_id_fkey',
            columns: ['organization_id'],
            isOneToOne: false,
            referencedRelation: 'organizations',
            referencedColumns: ['id'],
          },
          {
            foreignKeyName: 'companies_owner_id_fkey',
            columns: ['owner_id'],
            isOneToOne: false,
            referencedRelation: 'profiles',
            referencedColumns: ['id'],
          },
        ]
      }
      opportunity_stages: {
        Row: OpportunityStagesRow
        Insert: TableInsert<OpportunityStagesRow>
        Update: Partial<TableInsert<OpportunityStagesRow>>
        Relationships: [
          {
            foreignKeyName: 'opportunity_stages_organization_id_fkey',
            columns: ['organization_id'],
            isOneToOne: false,
            referencedRelation: 'organizations',
            referencedColumns: ['id'],
          },
        ]
      }
      opportunities: {
        Row: OpportunitiesRow
        Insert: TableInsert<OpportunitiesRow>
        Update: Partial<TableInsert<OpportunitiesRow>>
        Relationships: [
          {
            foreignKeyName: 'opportunities_organization_id_fkey',
            columns: ['organization_id'],
            isOneToOne: false,
            referencedRelation: 'organizations',
            referencedColumns: ['id'],
          },
          {
            foreignKeyName: 'opportunities_stage_id_fkey',
            columns: ['stage_id'],
            isOneToOne: false,
            referencedRelation: 'opportunity_stages',
            referencedColumns: ['id'],
          },
          {
            foreignKeyName: 'opportunities_contact_id_fkey',
            columns: ['contact_id'],
            isOneToOne: false,
            referencedRelation: 'contacts',
            referencedColumns: ['id'],
          },
          {
            foreignKeyName: 'opportunities_company_id_fkey',
            columns: ['company_id'],
            isOneToOne: false,
            referencedRelation: 'companies',
            referencedColumns: ['id'],
          },
          {
            foreignKeyName: 'opportunities_owner_id_fkey',
            columns: ['owner_id'],
            isOneToOne: false,
            referencedRelation: 'profiles',
            referencedColumns: ['id'],
          },
        ]
      }
      activities: {
        Row: ActivitiesRow
        Insert: TableInsert<ActivitiesRow>
        Update: Partial<TableInsert<ActivitiesRow>>
        Relationships: [
          {
            foreignKeyName: 'activities_organization_id_fkey',
            columns: ['organization_id'],
            isOneToOne: false,
            referencedRelation: 'organizations',
            referencedColumns: ['id'],
          },
          {
            foreignKeyName: 'activities_lead_id_fkey',
            columns: ['lead_id'],
            isOneToOne: false,
            referencedRelation: 'leads',
            referencedColumns: ['id'],
          },
          {
            foreignKeyName: 'activities_contact_id_fkey',
            columns: ['contact_id'],
            isOneToOne: false,
            referencedRelation: 'contacts',
            referencedColumns: ['id'],
          },
          {
            foreignKeyName: 'activities_company_id_fkey',
            columns: ['company_id'],
            isOneToOne: false,
            referencedRelation: 'companies',
            referencedColumns: ['id'],
          },
          {
            foreignKeyName: 'activities_opportunity_id_fkey',
            columns: ['opportunity_id'],
            isOneToOne: false,
            referencedRelation: 'opportunities',
            referencedColumns: ['id'],
          },
          {
            foreignKeyName: 'activities_created_by_fkey',
            columns: ['created_by'],
            isOneToOne: false,
            referencedRelation: 'profiles',
            referencedColumns: ['id'],
          },
        ]
      }
      tasks: {
        Row: TasksRow
        Insert: TableInsert<TasksRow>
        Update: Partial<TableInsert<TasksRow>>
        Relationships: [
          {
            foreignKeyName: 'tasks_organization_id_fkey',
            columns: ['organization_id'],
            isOneToOne: false,
            referencedRelation: 'organizations',
            referencedColumns: ['id'],
          },
          {
            foreignKeyName: 'tasks_lead_id_fkey',
            columns: ['lead_id'],
            isOneToOne: false,
            referencedRelation: 'leads',
            referencedColumns: ['id'],
          },
          {
            foreignKeyName: 'tasks_contact_id_fkey',
            columns: ['contact_id'],
            isOneToOne: false,
            referencedRelation: 'contacts',
            referencedColumns: ['id'],
          },
          {
            foreignKeyName: 'tasks_company_id_fkey',
            columns: ['company_id'],
            isOneToOne: false,
            referencedRelation: 'companies',
            referencedColumns: ['id'],
          },
          {
            foreignKeyName: 'tasks_opportunity_id_fkey',
            columns: ['opportunity_id'],
            isOneToOne: false,
            referencedRelation: 'opportunities',
            referencedColumns: ['id'],
          },
          {
            foreignKeyName: 'tasks_owner_id_fkey',
            columns: ['owner_id'],
            isOneToOne: false,
            referencedRelation: 'profiles',
            referencedColumns: ['id'],
          },
        ]
      }
      quotes: {
        Row: QuotesRow
        Insert: TableInsert<QuotesRow>
        Update: Partial<TableInsert<QuotesRow>>
        Relationships: [
          {
            foreignKeyName: 'quotes_organization_id_fkey',
            columns: ['organization_id'],
            isOneToOne: false,
            referencedRelation: 'organizations',
            referencedColumns: ['id'],
          },
          {
            foreignKeyName: 'quotes_opportunity_id_fkey',
            columns: ['opportunity_id'],
            isOneToOne: false,
            referencedRelation: 'opportunities',
            referencedColumns: ['id'],
          },
          {
            foreignKeyName: 'quotes_contact_id_fkey',
            columns: ['contact_id'],
            isOneToOne: false,
            referencedRelation: 'contacts',
            referencedColumns: ['id'],
          },
          {
            foreignKeyName: 'quotes_company_id_fkey',
            columns: ['company_id'],
            isOneToOne: false,
            referencedRelation: 'companies',
            referencedColumns: ['id'],
          },
        ]
      }
      quote_items: {
        Row: QuoteItemsRow
        Insert: TableInsertShort<QuoteItemsRow>
        Update: Partial<TableInsertShort<QuoteItemsRow>>
        Relationships: [
          {
            foreignKeyName: 'quote_items_quote_id_fkey',
            columns: ['quote_id'],
            isOneToOne: false,
            referencedRelation: 'quotes',
            referencedColumns: ['id'],
          },
        ]
      }
      notes: {
        Row: NotesRow
        Insert: TableInsert<NotesRow>
        Update: Partial<TableInsert<NotesRow>>
        Relationships: [
          {
            foreignKeyName: 'notes_organization_id_fkey',
            columns: ['organization_id'],
            isOneToOne: false,
            referencedRelation: 'organizations',
            referencedColumns: ['id'],
          },
          {
            foreignKeyName: 'notes_lead_id_fkey',
            columns: ['lead_id'],
            isOneToOne: false,
            referencedRelation: 'leads',
            referencedColumns: ['id'],
          },
          {
            foreignKeyName: 'notes_contact_id_fkey',
            columns: ['contact_id'],
            isOneToOne: false,
            referencedRelation: 'contacts',
            referencedColumns: ['id'],
          },
          {
            foreignKeyName: 'notes_company_id_fkey',
            columns: ['company_id'],
            isOneToOne: false,
            referencedRelation: 'companies',
            referencedColumns: ['id'],
          },
          {
            foreignKeyName: 'notes_opportunity_id_fkey',
            columns: ['opportunity_id'],
            isOneToOne: false,
            referencedRelation: 'opportunities',
            referencedColumns: ['id'],
          },
        ]
      }
      audit_logs: {
        Row: AuditLogsRow
        Insert: TableInsertShort<AuditLogsRow>
        Update: never
        Relationships: [
          {
            foreignKeyName: 'audit_logs_organization_id_fkey',
            columns: ['organization_id'],
            isOneToOne: false,
            referencedRelation: 'organizations',
            referencedColumns: ['id'],
          },
        ]
      }
      invitations: {
        Row: InvitationsRow
        Insert: TableInsertShort<Omit<InvitationsRow, 'token' | 'expires_at'>> &
          Partial<Pick<InvitationsRow, 'token' | 'expires_at'>>
        Update: Partial<TableInsertShort<InvitationsRow>>
        Relationships: [
          {
            foreignKeyName: 'invitations_organization_id_fkey',
            columns: ['organization_id'],
            isOneToOne: false,
            referencedRelation: 'organizations',
            referencedColumns: ['id'],
          },
        ]
      }
      import_runs: {
        Row: ImportRunsRow
        Insert: TableInsertShort<ImportRunsRow>
        Update: never
        Relationships: [
          {
            foreignKeyName: 'import_runs_organization_id_fkey',
            columns: ['organization_id'],
            isOneToOne: false,
            referencedRelation: 'organizations',
            referencedColumns: ['id'],
          },
        ]
      }
      analytics_events: {
        Row: AnalyticsEventsRow
        Insert: TableInsertShort<AnalyticsEventsRow>
        Update: never
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type InsertDto<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type UpdateDto<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']
