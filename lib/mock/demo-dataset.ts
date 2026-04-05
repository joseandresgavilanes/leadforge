import { endOfDay, endOfMonth, startOfDay, startOfMonth, subMonths } from 'date-fns'
import { MOCK_ORG_ID, MOCK_USER_ID } from '@/lib/mock/demo-entities'
import { paginateArray } from '@/lib/mock/pagination'
import type {
  Activity,
  Company,
  Contact,
  ContactWithCompany,
  DashboardStats,
  Lead,
  LeadFilters,
  LeadWithOwner,
  Opportunity,
  OpportunityFilters,
  OpportunityStage,
  OpportunityWithStage,
  Profile,
  Quote,
  QuoteItem,
  QuoteWithItems,
  Task,
  TaskFilters,
  TaskWithRelations,
} from '@/types'

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(15, 30, 0, 0)
  return d.toISOString()
}

function todayAt(hour: number, minute = 0): string {
  const d = new Date()
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

function hoursAgo(n: number): string {
  const d = new Date()
  d.setHours(d.getHours() - n)
  return d.toISOString()
}

const ownerPick = (): Pick<Profile, 'id' | 'first_name' | 'last_name' | 'avatar_url'> => ({
  id: MOCK_USER_ID,
  first_name: 'Demo',
  last_name: 'User',
  avatar_url: null,
})

const ownerPickShort = (): Pick<Profile, 'id' | 'first_name' | 'last_name'> => ({
  id: MOCK_USER_ID,
  first_name: 'Demo',
  last_name: 'User',
})

const creatorPick = ownerPick

/** Stable UUIDs for demo entities (org = mock org). */
export const DEMO_IDS = {
  stageQualification: 'a1000000-0000-4000-8000-000000000001',
  stageProposal: 'a1000000-0000-4000-8000-000000000002',
  stageNegotiation: 'a1000000-0000-4000-8000-000000000003',
  stageWon: 'a1000000-0000-4000-8000-000000000004',
  stageLost: 'a1000000-0000-4000-8000-000000000005',
  companyAcme: 'a2000000-0000-4000-8000-000000000001',
  companyNorthwind: 'a2000000-0000-4000-8000-000000000002',
  contactSam: 'a3000000-0000-4000-8000-000000000001',
  contactJordan: 'a3000000-0000-4000-8000-000000000002',
  contactRiley: 'a3000000-0000-4000-8000-000000000003',
  lead1: 'a4000000-0000-4000-8000-000000000001',
  lead2: 'a4000000-0000-4000-8000-000000000002',
  lead3: 'a4000000-0000-4000-8000-000000000003',
  lead4: 'a4000000-0000-4000-8000-000000000004',
  lead5: 'a4000000-0000-4000-8000-000000000005',
  lead6: 'a4000000-0000-4000-8000-000000000006',
  opp1: 'a5000000-0000-4000-8000-000000000001',
  opp2: 'a5000000-0000-4000-8000-000000000002',
  opp3: 'a5000000-0000-4000-8000-000000000003',
  opp4: 'a5000000-0000-4000-8000-000000000004',
  opp5: 'a5000000-0000-4000-8000-000000000005',
  task1: 'a6000000-0000-4000-8000-000000000001',
  task2: 'a6000000-0000-4000-8000-000000000002',
  task3: 'a6000000-0000-4000-8000-000000000003',
  task4: 'a6000000-0000-4000-8000-000000000004',
  taskDueToday: 'a6000000-0000-4000-8000-000000000005',
  act1: 'a7000000-0000-4000-8000-000000000001',
  quote1: 'a8000000-0000-4000-8000-000000000001',
  quote2: 'a8000000-0000-4000-8000-000000000002',
  qi1: 'a8100000-0000-4000-8000-000000000001',
  qi2: 'a8100000-0000-4000-8000-000000000002',
} as const

export function isDemoOrg(orgId: string): boolean {
  return orgId === MOCK_ORG_ID
}

function baseLead(p: Partial<Lead> & Pick<Lead, 'id' | 'first_name' | 'status' | 'source'>): Lead {
  const created_at = p.created_at ?? daysAgo(1)
  const updated_at = p.updated_at ?? created_at
  return {
    organization_id: MOCK_ORG_ID,
    last_name: null,
    email: null,
    phone: null,
    company: null,
    job_title: null,
    score: 72,
    owner_id: MOCK_USER_ID,
    tags: ['demo'],
    notes: null,
    website: null,
    industry: null,
    budget: null,
    converted_at: null,
    converted_contact_id: null,
    converted_company_id: null,
    converted_opportunity_id: null,
    created_by: MOCK_USER_ID,
    ...p,
    created_at,
    updated_at,
  }
}

export function demoLeadsRows(): Lead[] {
  return [
    baseLead({
      id: DEMO_IDS.lead1,
      first_name: 'Alex',
      last_name: 'Rivera',
      email: 'alex.rivera@example.com',
      company: 'Acme Labs',
      status: 'new',
      source: 'website',
      score: 82,
      created_at: daysAgo(2),
    }),
    baseLead({
      id: DEMO_IDS.lead2,
      first_name: 'Morgan',
      last_name: 'Lee',
      email: 'morgan@northwind.io',
      company: 'Northwind Trading',
      job_title: 'VP Sales',
      status: 'contacted',
      source: 'referral',
      score: 65,
      created_at: daysAgo(5),
    }),
    baseLead({
      id: DEMO_IDS.lead3,
      first_name: 'Casey',
      last_name: 'Nguyen',
      email: 'casey.nguyen@example.com',
      status: 'qualified',
      source: 'inbound',
      score: 91,
      created_at: daysAgo(8),
    }),
    baseLead({
      id: DEMO_IDS.lead4,
      first_name: 'Jamie',
      last_name: 'Patel',
      email: 'jamie.patel@example.com',
      status: 'new',
      source: 'linkedin',
      score: 55,
      created_at: daysAgo(38),
    }),
    baseLead({
      id: DEMO_IDS.lead5,
      first_name: 'Taylor',
      last_name: 'Brooks',
      email: 'taylor@example.com',
      status: 'contacted',
      source: 'event',
      score: 48,
      created_at: daysAgo(42),
    }),
    baseLead({
      id: DEMO_IDS.lead6,
      first_name: 'Riley',
      last_name: 'Chen',
      email: 'riley.chen@example.com',
      company: 'Bright Co',
      status: 'converted',
      source: 'website',
      score: 88,
      converted_at: daysAgo(3),
      converted_contact_id: DEMO_IDS.contactRiley,
      converted_company_id: DEMO_IDS.companyAcme,
      converted_opportunity_id: DEMO_IDS.opp4,
      created_at: daysAgo(14),
    }),
  ]
}

function withOwner(l: Lead): LeadWithOwner {
  return { ...l, owner: ownerPick() }
}

export function getDemoLeads(
  orgId: string,
  filters: LeadFilters = {},
  page = 1,
  pageSize = 25
) {
  if (!isDemoOrg(orgId)) return paginateArray<LeadWithOwner>([], page, pageSize)
  let rows = demoLeadsRows().map(withOwner)
  if (filters.status) rows = rows.filter((r) => r.status === filters.status)
  if (filters.source) rows = rows.filter((r) => r.source === filters.source)
  if (filters.ownerId) rows = rows.filter((r) => r.owner_id === filters.ownerId)
  if (filters.search) {
    const s = filters.search.toLowerCase()
    rows = rows.filter(
      (r) =>
        r.first_name.toLowerCase().includes(s) ||
        (r.last_name?.toLowerCase().includes(s) ?? false) ||
        (r.email?.toLowerCase().includes(s) ?? false) ||
        (r.company?.toLowerCase().includes(s) ?? false)
    )
  }
  const dateFrom = filters.dateFrom
  const dateTo = filters.dateTo
  if (dateFrom) rows = rows.filter((r) => r.created_at >= dateFrom)
  if (dateTo) rows = rows.filter((r) => r.created_at <= dateTo)
  return paginateArray(rows, page, pageSize)
}

export function getDemoLeadById(orgId: string, id: string): LeadWithOwner | null {
  if (!isDemoOrg(orgId)) return null
  const row = demoLeadsRows().find((l) => l.id === id)
  return row ? withOwner(row) : null
}

function demoCompaniesRows(): Company[] {
  const t = daysAgo(120)
  return [
    {
      id: DEMO_IDS.companyAcme,
      organization_id: MOCK_ORG_ID,
      name: 'Acme Labs',
      domain: 'acmelabs.example',
      industry: 'Software',
      size: '51-200',
      annual_revenue: 12_000_000,
      phone: '+1 415 555 0100',
      address: '100 Market St',
      city: 'San Francisco',
      country: 'US',
      website: 'https://acmelabs.example',
      owner_id: MOCK_USER_ID,
      notes: 'Strategic account — evaluation phase.',
      created_by: MOCK_USER_ID,
      created_at: t,
      updated_at: daysAgo(2),
    },
    {
      id: DEMO_IDS.companyNorthwind,
      organization_id: MOCK_ORG_ID,
      name: 'Northwind Trading',
      domain: 'northwind.io',
      industry: 'Logistics',
      size: '201-500',
      annual_revenue: 45_000_000,
      phone: '+44 20 7946 0958',
      address: '221B Baker Street',
      city: 'London',
      country: 'UK',
      website: 'https://northwind.io',
      owner_id: MOCK_USER_ID,
      notes: null,
      created_by: MOCK_USER_ID,
      created_at: t,
      updated_at: daysAgo(5),
    },
  ]
}

export function getDemoCompanies(orgId: string, search: string | undefined, page: number, pageSize: number) {
  if (!isDemoOrg(orgId)) return paginateArray<Company>([], page, pageSize)
  let rows = demoCompaniesRows()
  if (search) {
    const s = search.toLowerCase()
    rows = rows.filter((c) => c.name.toLowerCase().includes(s))
  }
  return paginateArray(rows, page, pageSize)
}

export function getDemoCompanyById(orgId: string, id: string): Company | null {
  if (!isDemoOrg(orgId)) return null
  return demoCompaniesRows().find((c) => c.id === id) ?? null
}

function demoContactsRows(): Contact[] {
  const t = daysAgo(90)
  return [
    {
      id: DEMO_IDS.contactSam,
      organization_id: MOCK_ORG_ID,
      first_name: 'Sam',
      last_name: 'Okonkwo',
      email: 'sam.okonkwo@acmelabs.example',
      phone: '+1 415 555 0142',
      job_title: 'Head of IT',
      company_id: DEMO_IDS.companyAcme,
      owner_id: MOCK_USER_ID,
      tags: ['champion'],
      notes: 'Prefers email; technical buyer.',
      linkedin_url: null,
      created_by: MOCK_USER_ID,
      created_at: t,
      updated_at: daysAgo(1),
    },
    {
      id: DEMO_IDS.contactJordan,
      organization_id: MOCK_ORG_ID,
      first_name: 'Jordan',
      last_name: 'Smith',
      email: 'jordan.smith@northwind.io',
      phone: '+44 20 5555 0199',
      job_title: 'Procurement Lead',
      company_id: DEMO_IDS.companyNorthwind,
      owner_id: MOCK_USER_ID,
      tags: [],
      notes: null,
      linkedin_url: null,
      created_by: MOCK_USER_ID,
      created_at: t,
      updated_at: daysAgo(4),
    },
    {
      id: DEMO_IDS.contactRiley,
      organization_id: MOCK_ORG_ID,
      first_name: 'Riley',
      last_name: 'Chen',
      email: 'riley.chen@bright.co',
      phone: '+1 646 555 0133',
      job_title: 'COO',
      company_id: null,
      owner_id: MOCK_USER_ID,
      tags: ['executive'],
      notes: null,
      linkedin_url: null,
      created_by: MOCK_USER_ID,
      created_at: daysAgo(20),
      updated_at: daysAgo(3),
    },
  ]
}

function companyPick(id: string | null): Pick<Company, 'id' | 'name'> | null {
  if (!id) return null
  const c = demoCompaniesRows().find((x) => x.id === id)
  return c ? { id: c.id, name: c.name } : null
}

export function getDemoContacts(
  orgId: string,
  search: string | undefined,
  page: number,
  pageSize: number,
  companyId?: string
) {
  if (!isDemoOrg(orgId)) return paginateArray<ContactWithCompany>([], page, pageSize)
  let rows = demoContactsRows()
  if (companyId) rows = rows.filter((c) => c.company_id === companyId)
  if (search) {
    const s = search.toLowerCase()
    rows = rows.filter(
      (c) =>
        c.first_name.toLowerCase().includes(s) ||
        (c.last_name?.toLowerCase().includes(s) ?? false) ||
        (c.email?.toLowerCase().includes(s) ?? false)
    )
  }
  const withCo: ContactWithCompany[] = rows.map((c) => ({
    ...c,
    company: companyPick(c.company_id),
    owner: ownerPickShort(),
  }))
  return paginateArray(withCo, page, pageSize)
}

export function getDemoContactById(orgId: string, id: string): ContactWithCompany | null {
  if (!isDemoOrg(orgId)) return null
  const c = demoContactsRows().find((x) => x.id === id)
  if (!c) return null
  return { ...c, company: companyPick(c.company_id), owner: ownerPickShort() }
}

export function demoStagesRows(): OpportunityStage[] {
  const t = daysAgo(200)
  return [
    {
      id: DEMO_IDS.stageQualification,
      organization_id: MOCK_ORG_ID,
      name: 'Qualification',
      position: 0,
      probability: 15,
      color: '#64748b',
      is_closed_won: false,
      is_closed_lost: false,
      created_at: t,
      updated_at: daysAgo(1),
    },
    {
      id: DEMO_IDS.stageProposal,
      organization_id: MOCK_ORG_ID,
      name: 'Proposal',
      position: 1,
      probability: 40,
      color: '#3b82f6',
      is_closed_won: false,
      is_closed_lost: false,
      created_at: t,
      updated_at: daysAgo(1),
    },
    {
      id: DEMO_IDS.stageNegotiation,
      organization_id: MOCK_ORG_ID,
      name: 'Negotiation',
      position: 2,
      probability: 70,
      color: '#8b5cf6',
      is_closed_won: false,
      is_closed_lost: false,
      created_at: t,
      updated_at: daysAgo(1),
    },
    {
      id: DEMO_IDS.stageWon,
      organization_id: MOCK_ORG_ID,
      name: 'Closed won',
      position: 3,
      probability: 100,
      color: '#22c55e',
      is_closed_won: true,
      is_closed_lost: false,
      created_at: t,
      updated_at: daysAgo(1),
    },
    {
      id: DEMO_IDS.stageLost,
      organization_id: MOCK_ORG_ID,
      name: 'Closed lost',
      position: 4,
      probability: 0,
      color: '#ef4444',
      is_closed_won: false,
      is_closed_lost: true,
      created_at: t,
      updated_at: daysAgo(1),
    },
  ]
}

function stageById(id: string): OpportunityStage | undefined {
  return demoStagesRows().find((s) => s.id === id)
}

function baseOpp(p: Partial<Opportunity> & Pick<Opportunity, 'id' | 'name' | 'value' | 'stage_id'>): Opportunity {
  return {
    organization_id: MOCK_ORG_ID,
    probability: 30,
    close_date: null,
    owner_id: MOCK_USER_ID,
    contact_id: null,
    company_id: null,
    source: 'inbound',
    next_action: null,
    lost_reason: null,
    competitor: null,
    notes: null,
    closed_at: null,
    stage_entered_at: daysAgo(10),
    created_by: MOCK_USER_ID,
    created_at: daysAgo(30),
    updated_at: daysAgo(2),
    ...p,
  }
}

function demoOpportunitiesRows(): Opportunity[] {
  return [
    baseOpp({
      id: DEMO_IDS.opp1,
      name: 'Acme — Enterprise rollout',
      value: 45_000,
      stage_id: DEMO_IDS.stageQualification,
      probability: 25,
      contact_id: DEMO_IDS.contactSam,
      company_id: DEMO_IDS.companyAcme,
      next_action: 'Schedule technical deep-dive',
      updated_at: daysAgo(3),
      created_at: daysAgo(18),
    }),
    baseOpp({
      id: DEMO_IDS.opp2,
      name: 'Northwind — Logistics suite',
      value: 120_000,
      stage_id: DEMO_IDS.stageProposal,
      probability: 55,
      contact_id: DEMO_IDS.contactJordan,
      company_id: DEMO_IDS.companyNorthwind,
      next_action: 'Send revised pricing',
      updated_at: daysAgo(20),
      created_at: daysAgo(40),
    }),
    baseOpp({
      id: DEMO_IDS.opp3,
      name: 'Bright Co — Team expansion',
      value: 28_000,
      stage_id: DEMO_IDS.stageNegotiation,
      probability: 75,
      contact_id: DEMO_IDS.contactRiley,
      company_id: null,
      updated_at: daysAgo(1),
      created_at: daysAgo(10),
    }),
    baseOpp({
      id: DEMO_IDS.opp4,
      name: 'Bright Co — Pilot closed',
      value: 18_000,
      stage_id: DEMO_IDS.stageWon,
      probability: 100,
      contact_id: DEMO_IDS.contactRiley,
      company_id: DEMO_IDS.companyAcme,
      updated_at: daysAgo(4),
      created_at: daysAgo(25),
    }),
    baseOpp({
      id: DEMO_IDS.opp5,
      name: 'Legacy Corp — RFP',
      value: 9_500,
      stage_id: DEMO_IDS.stageLost,
      probability: 0,
      lost_reason: 'Budget freeze',
      updated_at: daysAgo(12),
      created_at: daysAgo(50),
    }),
  ]
}

function enrichOpp(o: Opportunity): OpportunityWithStage | null {
  const stage = stageById(o.stage_id)
  if (!stage) return null
  const contact = demoContactsRows().find((c) => c.id === o.contact_id)
  const company = o.company_id ? demoCompaniesRows().find((c) => c.id === o.company_id) : null
  return {
    ...o,
    stage,
    owner: ownerPick(),
    contact: contact
      ? {
          id: contact.id,
          first_name: contact.first_name,
          last_name: contact.last_name,
          email: contact.email,
        }
      : null,
    company: company ? { id: company.id, name: company.name } : null,
  }
}

export function getDemoPipelineStages(orgId: string): OpportunityStage[] {
  if (!isDemoOrg(orgId)) return []
  return demoStagesRows()
}

export function getDemoOpportunities(
  orgId: string,
  filters: OpportunityFilters = {},
  page = 1,
  pageSize = 50
) {
  if (!isDemoOrg(orgId)) return paginateArray<OpportunityWithStage>([], page, pageSize)
  let rows = demoOpportunitiesRows()
    .map(enrichOpp)
    .filter((x): x is OpportunityWithStage => x !== null)
  if (filters.stageId) rows = rows.filter((r) => r.stage_id === filters.stageId)
  if (filters.ownerId) rows = rows.filter((r) => r.owner_id === filters.ownerId)
  if (filters.search) {
    const s = filters.search.toLowerCase()
    rows = rows.filter((r) => r.name.toLowerCase().includes(s))
  }
  if (filters.minValue !== undefined) rows = rows.filter((r) => r.value >= filters.minValue!)
  if (filters.maxValue !== undefined) rows = rows.filter((r) => r.value <= filters.maxValue!)
  const dateFrom = filters.dateFrom
  const dateTo = filters.dateTo
  if (dateFrom) rows = rows.filter((r) => r.created_at >= dateFrom)
  if (dateTo) rows = rows.filter((r) => r.created_at <= dateTo)
  return paginateArray(rows, page, pageSize)
}

export function getDemoOpportunityById(orgId: string, id: string): OpportunityWithStage | null {
  if (!isDemoOrg(orgId)) return null
  const o = demoOpportunitiesRows().find((x) => x.id === id)
  return o ? enrichOpp(o) : null
}

function baseTask(p: Partial<Task> & Pick<Task, 'id' | 'title' | 'priority'>): Task {
  return {
    organization_id: MOCK_ORG_ID,
    description: null,
    due_date: null,
    completed_at: null,
    owner_id: MOCK_USER_ID,
    lead_id: null,
    contact_id: null,
    company_id: null,
    opportunity_id: null,
    created_by: MOCK_USER_ID,
    created_at: daysAgo(4),
    updated_at: daysAgo(1),
    ...p,
  }
}

function demoTasksRows(): Task[] {
  return [
    baseTask({
      id: DEMO_IDS.task1,
      title: 'Follow up: Acme technical questions',
      priority: 'high',
      due_date: daysAgo(1),
      opportunity_id: DEMO_IDS.opp1,
      contact_id: DEMO_IDS.contactSam,
    }),
    baseTask({
      id: DEMO_IDS.task2,
      title: 'Send contract draft — Northwind',
      priority: 'urgent',
      due_date: daysAgo(2),
      opportunity_id: DEMO_IDS.opp2,
    }),
    baseTask({
      id: DEMO_IDS.task3,
      title: 'Prep QBR slides',
      priority: 'medium',
      due_date: daysAgo(-3),
      completed_at: null,
      company_id: DEMO_IDS.companyAcme,
    }),
    baseTask({
      id: DEMO_IDS.task4,
      title: 'Log call notes — Bright Co',
      priority: 'low',
      due_date: daysAgo(-5),
      completed_at: hoursAgo(6),
      opportunity_id: DEMO_IDS.opp3,
    }),
    baseTask({
      id: DEMO_IDS.taskDueToday,
      title: 'Send recap email — discovery call',
      priority: 'medium',
      due_date: todayAt(16, 0),
      opportunity_id: DEMO_IDS.opp1,
    }),
  ]
}

function enrichTask(t: Task): TaskWithRelations {
  const opp = t.opportunity_id ? demoOpportunitiesRows().find((o) => o.id === t.opportunity_id) : null
  const contact = t.contact_id ? demoContactsRows().find((c) => c.id === t.contact_id) : null
  const company = t.company_id ? demoCompaniesRows().find((c) => c.id === t.company_id) : null
  const lead = t.lead_id ? demoLeadsRows().find((l) => l.id === t.lead_id) : null
  return {
    ...t,
    owner: ownerPickShort(),
    opportunity: opp ? { id: opp.id, name: opp.name } : null,
    contact: contact
      ? { id: contact.id, first_name: contact.first_name, last_name: contact.last_name }
      : null,
    company: company ? { id: company.id, name: company.name } : null,
    lead: lead ? { id: lead.id, first_name: lead.first_name, last_name: lead.last_name } : null,
  }
}

export function getDemoTasks(orgId: string, filters: TaskFilters = {}): TaskWithRelations[] {
  if (!isDemoOrg(orgId)) return []
  let rows = demoTasksRows().map(enrichTask)
  if (filters.status === 'completed') {
    rows = rows.filter((t) => t.completed_at !== null)
  } else if (filters.status === 'overdue') {
    const now = new Date().toISOString()
    rows = rows.filter((t) => !t.completed_at && t.due_date && t.due_date < now)
  } else if (filters.status === 'due_today') {
    const start = startOfDay(new Date()).toISOString()
    const end = endOfDay(new Date()).toISOString()
    rows = rows.filter((t) => !t.completed_at && t.due_date && t.due_date >= start && t.due_date <= end)
  } else if (filters.status === 'open') {
    rows = rows.filter((t) => t.completed_at === null)
  }
  if (filters.priority) rows = rows.filter((t) => t.priority === filters.priority)
  if (filters.ownerId) rows = rows.filter((t) => t.owner_id === filters.ownerId)
  if (filters.search) {
    const s = filters.search.toLowerCase()
    rows = rows.filter((t) => t.title.toLowerCase().includes(s))
  }
  return rows.sort((a, b) => {
    const da = a.due_date ?? ''
    const db = b.due_date ?? ''
    return da.localeCompare(db)
  })
}

function demoActivitiesRows(): Activity[] {
  return [
    {
      id: DEMO_IDS.act1,
      organization_id: MOCK_ORG_ID,
      type: 'call',
      subject: 'Discovery call — Acme',
      description: 'Discussed integration timeline and security questionnaire.',
      duration_minutes: 45,
      outcome: 'Positive — send security docs',
      activity_date: daysAgo(2),
      lead_id: null,
      contact_id: DEMO_IDS.contactSam,
      company_id: DEMO_IDS.companyAcme,
      opportunity_id: DEMO_IDS.opp1,
      created_by: MOCK_USER_ID,
      created_at: daysAgo(2),
      updated_at: daysAgo(2),
    },
    {
      id: 'a7000000-0000-4000-8000-000000000002',
      organization_id: MOCK_ORG_ID,
      type: 'email',
      subject: 'Proposal sent — Northwind',
      description: null,
      duration_minutes: null,
      outcome: null,
      activity_date: daysAgo(4),
      contact_id: DEMO_IDS.contactJordan,
      company_id: DEMO_IDS.companyNorthwind,
      opportunity_id: DEMO_IDS.opp2,
      lead_id: null,
      created_by: MOCK_USER_ID,
      created_at: daysAgo(4),
      updated_at: daysAgo(4),
    },
    {
      id: 'a7000000-0000-4000-8000-000000000003',
      organization_id: MOCK_ORG_ID,
      type: 'meeting',
      subject: 'Demo — Bright Co leadership',
      description: 'Walked through pipeline and reporting.',
      duration_minutes: 60,
      outcome: 'Requested pricing for 50 seats',
      activity_date: daysAgo(6),
      contact_id: DEMO_IDS.contactRiley,
      company_id: null,
      opportunity_id: DEMO_IDS.opp3,
      lead_id: null,
      created_by: MOCK_USER_ID,
      created_at: daysAgo(6),
      updated_at: daysAgo(6),
    },
    {
      id: 'a7000000-0000-4000-8000-000000000004',
      organization_id: MOCK_ORG_ID,
      type: 'note',
      subject: 'Internal: pricing approval',
      description: 'Finance approved 12% discount for annual prepay.',
      duration_minutes: null,
      outcome: null,
      activity_date: daysAgo(1),
      lead_id: null,
      contact_id: null,
      company_id: null,
      opportunity_id: DEMO_IDS.opp2,
      created_by: MOCK_USER_ID,
      created_at: daysAgo(1),
      updated_at: daysAgo(1),
    },
  ]
}

export function getDemoActivities(
  orgId: string,
  filters: {
    leadId?: string
    contactId?: string
    companyId?: string
    opportunityId?: string
    limit?: number
  } = {}
) {
  if (!isDemoOrg(orgId)) return []
  let rows = [...demoActivitiesRows()]
  if (filters.leadId) rows = rows.filter((a) => a.lead_id === filters.leadId)
  if (filters.contactId) rows = rows.filter((a) => a.contact_id === filters.contactId)
  if (filters.companyId) rows = rows.filter((a) => a.company_id === filters.companyId)
  if (filters.opportunityId) rows = rows.filter((a) => a.opportunity_id === filters.opportunityId)
  rows.sort((a, b) => b.activity_date.localeCompare(a.activity_date))
  if (filters.limit) rows = rows.slice(0, filters.limit)
  return rows
}

export function getDemoRecentActivities(orgId: string, limit: number) {
  if (!isDemoOrg(orgId)) return []
  return demoActivitiesRows()
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, limit)
    .map((a) => ({
      ...a,
      creator: creatorPick(),
    }))
}

export function getDemoOverdueTasks(orgId: string, limit: number) {
  if (!isDemoOrg(orgId)) return []
  const now = new Date().toISOString()
  return demoTasksRows()
    .filter((t) => !t.completed_at && t.due_date && t.due_date < now)
    .sort((a, b) => (a.due_date ?? '').localeCompare(b.due_date ?? ''))
    .slice(0, limit)
    .map((t) => ({
      ...t,
      owner: ownerPickShort(),
    }))
}

export function getDemoTasksDueToday(orgId: string, limit: number) {
  if (!isDemoOrg(orgId)) return []
  const start = startOfDay(new Date()).toISOString()
  const end = endOfDay(new Date()).toISOString()
  return demoTasksRows()
    .filter((t) => !t.completed_at && t.due_date && t.due_date >= start && t.due_date <= end)
    .sort((a, b) => (a.due_date ?? '').localeCompare(b.due_date ?? ''))
    .slice(0, limit)
    .map((t) => ({
      ...t,
      owner: ownerPickShort(),
    }))
}

export function getDemoStaleOpportunities(orgId: string, dayThreshold: number, limit: number) {
  if (!isDemoOrg(orgId)) return []
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - dayThreshold)
  const iso = cutoff.toISOString()
  return demoOpportunitiesRows()
    .filter((o) => o.updated_at < iso)
    .map(enrichOpp)
    .filter((o): o is OpportunityWithStage => o !== null && !o.stage.is_closed_won && !o.stage.is_closed_lost)
    .sort((a, b) => a.updated_at.localeCompare(b.updated_at))
    .slice(0, limit)
}

export function getDemoDashboardStats(orgId: string): DashboardStats {
  if (!isDemoOrg(orgId)) {
    return {
      newLeads: 0,
      openOpportunities: 0,
      pipelineValue: 0,
      monthlyForecast: 0,
      newLeadsChange: 0,
      pipelineChange: 0,
    }
  }

  const now = new Date()
  const thisMonthStart = startOfMonth(now)
  const lastMonthStart = startOfMonth(subMonths(now, 1))
  const lastMonthEnd = endOfMonth(subMonths(now, 1))
  const tms = thisMonthStart.toISOString()
  const lms = lastMonthStart.toISOString()
  const lme = lastMonthEnd.toISOString()

  const leads = demoLeadsRows()
  const newLeadsThisMonth = leads.filter((l) => l.created_at >= tms).length
  const newLeadsLastMonth = leads.filter((l) => l.created_at >= lms && l.created_at <= lme).length

  const opps = demoOpportunitiesRows()
  const activeOpps = opps
    .map(enrichOpp)
    .filter((o): o is OpportunityWithStage => o !== null && !o.stage.is_closed_won && !o.stage.is_closed_lost)

  const pipelineValue = activeOpps.reduce((sum, o) => sum + o.value, 0)
  const monthlyForecast = activeOpps.reduce(
    (sum, o) => sum + o.value * (o.probability / 100),
    0
  )

  const lastMonthOpps = opps.filter((o) => o.created_at <= lme)
  const lastMonthPipeline = lastMonthOpps
    .map(enrichOpp)
    .filter((o): o is OpportunityWithStage => o !== null && !o.stage.is_closed_won && !o.stage.is_closed_lost)
    .reduce((sum, o) => sum + o.value, 0)

  const pipelineChange =
    lastMonthPipeline > 0 ? Math.round(((pipelineValue - lastMonthPipeline) / lastMonthPipeline) * 100) : 12

  const newLeadsChange =
    newLeadsLastMonth > 0
      ? Math.round(((newLeadsThisMonth - newLeadsLastMonth) / newLeadsLastMonth) * 100)
      : newLeadsThisMonth > 0
        ? 100
        : 0

  return {
    newLeads: newLeadsThisMonth,
    openOpportunities: activeOpps.length,
    pipelineValue,
    monthlyForecast,
    newLeadsChange,
    pipelineChange,
  }
}

function demoQuoteItems(quoteId: string): QuoteItem[] {
  const t = daysAgo(1)
  if (quoteId === DEMO_IDS.quote1) {
    return [
      {
        id: DEMO_IDS.qi1,
        quote_id: quoteId,
        description: 'CRM seats (annual) × 25',
        quantity: 25,
        unit_price: 48,
        amount: 1200,
        position: 0,
        created_at: t,
      },
      {
        id: DEMO_IDS.qi2,
        quote_id: quoteId,
        description: 'Onboarding & training package',
        quantity: 1,
        unit_price: 2500,
        amount: 2500,
        position: 1,
        created_at: t,
      },
    ]
  }
  if (quoteId === DEMO_IDS.quote2) {
    return [
      {
        id: 'a8100000-0000-4000-8000-000000000003',
        quote_id: quoteId,
        description: 'Professional services — integration',
        quantity: 40,
        unit_price: 175,
        amount: 7000,
        position: 0,
        created_at: t,
      },
    ]
  }
  return []
}

function demoQuotesRows(): Quote[] {
  return [
    {
      id: DEMO_IDS.quote1,
      organization_id: MOCK_ORG_ID,
      quote_number: 'Q-00042',
      title: 'Acme — Annual subscription',
      opportunity_id: DEMO_IDS.opp1,
      contact_id: DEMO_IDS.contactSam,
      company_id: DEMO_IDS.companyAcme,
      status: 'sent',
      issue_date: daysAgo(5).slice(0, 10),
      expiry_date: daysAgo(-25).slice(0, 10),
      subtotal: 3700,
      tax_rate: 8,
      tax_amount: 296,
      discount: 0,
      total: 3996,
      notes: 'Net 30; PO required.',
      terms: 'Standard MSA applies.',
      created_by: MOCK_USER_ID,
      created_at: daysAgo(5),
      updated_at: daysAgo(2),
    },
    {
      id: DEMO_IDS.quote2,
      organization_id: MOCK_ORG_ID,
      quote_number: 'Q-00043',
      title: 'Northwind — Implementation',
      opportunity_id: DEMO_IDS.opp2,
      contact_id: DEMO_IDS.contactJordan,
      company_id: DEMO_IDS.companyNorthwind,
      status: 'draft',
      issue_date: daysAgo(1).slice(0, 10),
      expiry_date: null,
      subtotal: 7000,
      tax_rate: 0,
      tax_amount: 0,
      discount: 500,
      total: 6500,
      notes: null,
      terms: null,
      created_by: MOCK_USER_ID,
      created_at: daysAgo(1),
      updated_at: daysAgo(1),
    },
  ]
}

type DemoQuoteListRow = Quote & {
  opportunity: { id: string; name: string } | null
  contact: { id: string; first_name: string; last_name: string | null; email: string | null } | null
  company: { id: string; name: string } | null
}

export function getDemoQuotes(orgId: string, page: number, pageSize: number) {
  if (!isDemoOrg(orgId)) return paginateArray<DemoQuoteListRow>([], page, pageSize)
  const rows: DemoQuoteListRow[] = demoQuotesRows().map((q) => {
    const opp = q.opportunity_id ? demoOpportunitiesRows().find((o) => o.id === q.opportunity_id) : null
    const contact = q.contact_id ? demoContactsRows().find((c) => c.id === q.contact_id) : null
    const company = q.company_id ? demoCompaniesRows().find((c) => c.id === q.company_id) : null
    return {
      ...q,
      opportunity: opp ? { id: opp.id, name: opp.name } : null,
      contact: contact
        ? {
            id: contact.id,
            first_name: contact.first_name,
            last_name: contact.last_name,
            email: contact.email,
          }
        : null,
      company: company ? { id: company.id, name: company.name } : null,
    }
  })
  return paginateArray(rows, page, pageSize)
}

export function getDemoQuoteById(orgId: string, id: string): QuoteWithItems | null {
  if (!isDemoOrg(orgId)) return null
  const q = demoQuotesRows().find((x) => x.id === id)
  if (!q) return null
  const opp = q.opportunity_id ? demoOpportunitiesRows().find((o) => o.id === q.opportunity_id) : null
  const contact = q.contact_id ? demoContactsRows().find((c) => c.id === q.contact_id) : null
  const company = q.company_id ? demoCompaniesRows().find((c) => c.id === q.company_id) : null
  return {
    ...q,
    items: demoQuoteItems(q.id),
    opportunity: opp ? { id: opp.id, name: opp.name } : null,
    contact: contact
      ? {
          id: contact.id,
          first_name: contact.first_name,
          last_name: contact.last_name,
          email: contact.email,
        }
      : null,
    company: company ? { id: company.id, name: company.name } : null,
  }
}

export function getDemoBillingCounts(orgId: string) {
  if (!isDemoOrg(orgId)) {
    return { leadCount: 0, userCount: 0, quoteCount: 0 }
  }
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const quotesThisMonth = demoQuotesRows().filter((q) => q.created_at >= monthStart).length
  return {
    leadCount: demoLeadsRows().length,
    userCount: 1,
    quoteCount: quotesThisMonth,
  }
}

/** For reports page charts when offline (optional `since` matches Supabase gte on created_at). */
export function getDemoReportsRaw(
  orgId: string,
  since?: Date
): {
  leads: { source: string | null; status: string; created_at: string }[]
  opportunities: {
    value: number | null
    probability: number | null
    stage_id: string
    close_date: string | null
    created_at: string
  }[]
  stages: {
    id: string
    name: string
    color: string | null
    is_closed_won: boolean | null
    is_closed_lost: boolean | null
  }[]
  activities: { type: string; created_by: string | null; created_at: string }[]
} {
  if (!isDemoOrg(orgId)) {
    return {
      leads: [],
      opportunities: [],
      stages: [],
      activities: [],
    }
  }
  const cutoff = since?.toISOString()
  let leads = demoLeadsRows().map((l) => ({
    source: l.source,
    status: l.status,
    created_at: l.created_at,
  }))
  if (cutoff) leads = leads.filter((l) => l.created_at >= cutoff)
  const opportunities = demoOpportunitiesRows().map((o) => ({
    value: o.value,
    probability: o.probability,
    stage_id: o.stage_id,
    close_date: o.close_date,
    created_at: o.created_at,
  }))
  const stages = demoStagesRows().map((s) => ({
    id: s.id,
    name: s.name,
    color: s.color,
    is_closed_won: s.is_closed_won,
    is_closed_lost: s.is_closed_lost,
  }))
  let activities = demoActivitiesRows().map((a) => ({
    type: a.type,
    created_by: a.created_by,
    created_at: a.created_at,
  }))
  if (cutoff) activities = activities.filter((a) => a.created_at >= cutoff)
  return { leads, opportunities, stages, activities }
}
