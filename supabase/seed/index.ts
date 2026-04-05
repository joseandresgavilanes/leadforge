/**
 * LeadForge CRM — Demo Seed Script
 * Run: tsx supabase/seed/index.ts
 *
 * Seeds:
 * - 1 demo organization
 * - 5 users (admin + 4 reps)
 * - 6 pipeline stages
 * - 20 companies
 * - 35 contacts
 * - 50 leads
 * - 18 opportunities
 * - 25 tasks
 * - 8 quotes
 * - Activities
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, serviceKey)

const ORG_ID = '00000000-0000-0000-0000-000000000001'

const USERS = [
  { id: '00000000-0000-0000-0000-000000000101', email: 'admin@demo.leadforge.io', firstName: 'Alex', lastName: 'Rivera', role: 'org_admin', title: 'VP of Sales' },
  { id: '00000000-0000-0000-0000-000000000102', email: 'manager@demo.leadforge.io', firstName: 'Jordan', lastName: 'Chen', role: 'sales_manager', title: 'Sales Manager' },
  { id: '00000000-0000-0000-0000-000000000103', email: 'rep1@demo.leadforge.io', firstName: 'Sam', lastName: 'Torres', role: 'sales_rep', title: 'Account Executive' },
  { id: '00000000-0000-0000-0000-000000000104', email: 'rep2@demo.leadforge.io', firstName: 'Morgan', lastName: 'Kim', role: 'sales_rep', title: 'Account Executive' },
  { id: '00000000-0000-0000-0000-000000000105', email: 'viewer@demo.leadforge.io', firstName: 'Casey', lastName: 'Park', role: 'viewer', title: 'Sales Analyst' },
]

const STAGES = [
  { id: '00000000-0000-0000-0000-000000000201', name: 'Prospecting', position: 0, probability: 10, color: '#6366f1', is_closed_won: false, is_closed_lost: false },
  { id: '00000000-0000-0000-0000-000000000202', name: 'Qualification', position: 1, probability: 25, color: '#0ea5e9', is_closed_won: false, is_closed_lost: false },
  { id: '00000000-0000-0000-0000-000000000203', name: 'Proposal', position: 2, probability: 50, color: '#f59e0b', is_closed_won: false, is_closed_lost: false },
  { id: '00000000-0000-0000-0000-000000000204', name: 'Negotiation', position: 3, probability: 75, color: '#8b5cf6', is_closed_won: false, is_closed_lost: false },
  { id: '00000000-0000-0000-0000-000000000205', name: 'Closed Won', position: 4, probability: 100, color: '#2E8B57', is_closed_won: true, is_closed_lost: false },
  { id: '00000000-0000-0000-0000-000000000206', name: 'Closed Lost', position: 5, probability: 0, color: '#C93C37', is_closed_won: false, is_closed_lost: true },
]

const COMPANIES_DATA = [
  { name: 'Acme Corporation', industry: 'Manufacturing', size: '201_500', city: 'Chicago', country: 'USA', annual_revenue: 45000000 },
  { name: 'TechFlow Solutions', industry: 'Software / SaaS', size: '51_200', city: 'Austin', country: 'USA', annual_revenue: 12000000 },
  { name: 'Global Dynamics', industry: 'Consulting', size: '11_50', city: 'New York', country: 'USA', annual_revenue: 8500000 },
  { name: 'Summit Digital', industry: 'Agency', size: '11_50', city: 'Miami', country: 'USA', annual_revenue: 3200000 },
  { name: 'NovaTech Industries', industry: 'Manufacturing', size: '500_plus', city: 'Detroit', country: 'USA', annual_revenue: 230000000 },
  { name: 'CloudBase Inc', industry: 'Software / SaaS', size: '11_50', city: 'San Francisco', country: 'USA', annual_revenue: 7800000 },
  { name: 'Vertex Consulting Group', industry: 'Consulting', size: '51_200', city: 'Boston', country: 'USA', annual_revenue: 22000000 },
  { name: 'Meridian Distributors', industry: 'Distribution', size: '51_200', city: 'Dallas', country: 'USA', annual_revenue: 18500000 },
  { name: 'BlueSky Analytics', industry: 'Software / SaaS', size: '1_10', city: 'Seattle', country: 'USA', annual_revenue: 1200000 },
  { name: 'Pinnacle Services', industry: 'Professional Services', size: '11_50', city: 'Atlanta', country: 'USA', annual_revenue: 5600000 },
  { name: 'DataSync Pro', industry: 'Software / SaaS', size: '1_10', city: 'Denver', country: 'USA', annual_revenue: 950000 },
  { name: 'Horizon Media Group', industry: 'Agency', size: '51_200', city: 'Los Angeles', country: 'USA', annual_revenue: 28000000 },
  { name: 'CoreBridge Systems', industry: 'Software / SaaS', size: '11_50', city: 'Portland', country: 'USA', annual_revenue: 4100000 },
  { name: 'Ascent Partners', industry: 'Consulting', size: '1_10', city: 'Minneapolis', country: 'USA', annual_revenue: 2300000 },
  { name: 'Ironclad Manufacturing', industry: 'Manufacturing', size: '201_500', city: 'Pittsburgh', country: 'USA', annual_revenue: 78000000 },
  { name: 'Prism Digital Agency', industry: 'Agency', size: '1_10', city: 'Nashville', country: 'USA', annual_revenue: 1800000 },
  { name: 'Forgepoint Capital', industry: 'Professional Services', size: '11_50', city: 'San Francisco', country: 'USA', annual_revenue: 15000000 },
  { name: 'WaveTech Solutions', industry: 'Software / SaaS', size: '11_50', city: 'Raleigh', country: 'USA', annual_revenue: 6700000 },
  { name: 'Crestline Distributors', industry: 'Distribution', size: '51_200', city: 'Phoenix', country: 'USA', annual_revenue: 34000000 },
  { name: 'Sterling Innovation Labs', industry: 'Software / SaaS', size: '11_50', city: 'Boulder', country: 'USA', annual_revenue: 9200000 },
]

const LEAD_SOURCES = ['website', 'referral', 'linkedin', 'cold_outreach', 'event', 'inbound', 'paid_ads']
const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'unqualified', 'converted'] as const
const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const
const ACTIVITY_TYPES = ['call', 'meeting', 'email', 'note', 'demo'] as const

function randomItem<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

function daysFromNow(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString()
}

async function seed() {
  console.log('🌱 Starting LeadForge seed...')

  // --- Organization ---
  console.log('Creating organization...')
  await supabase.from('organizations').upsert({
    id: ORG_ID,
    name: 'Demo Sales Corp',
    slug: 'demo-sales-corp',
    industry: 'Software / SaaS',
    timezone: 'America/New_York',
    currency: 'USD',
    plan: 'growth',
    subscription_status: 'active',
    trial_ends_at: daysFromNow(14),
    created_by: USERS[0].id,
  })

  // --- Profiles ---
  console.log('Creating profiles...')
  for (const user of USERS) {
    await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email,
      first_name: user.firstName,
      last_name: user.lastName,
      job_title: user.title,
    })
    await supabase.from('memberships').upsert({
      organization_id: ORG_ID,
      user_id: user.id,
      role: user.role,
      accepted_at: daysAgo(30),
    })
  }

  // --- Pipeline Stages ---
  console.log('Creating pipeline stages...')
  await supabase.from('opportunity_stages').upsert(
    STAGES.map((s) => ({ ...s, organization_id: ORG_ID }))
  )

  // --- Companies ---
  console.log('Creating companies...')
  const companyIds: string[] = []
  for (const co of COMPANIES_DATA) {
    const { data } = await supabase.from('companies').insert({
      organization_id: ORG_ID,
      name: co.name,
      industry: co.industry,
      size: co.size,
      city: co.city,
      country: co.country,
      annual_revenue: co.annual_revenue,
      owner_id: randomItem(USERS).id,
      created_by: USERS[0].id,
    }).select('id').single()
    if (data) companyIds.push(data.id)
  }

  // --- Contacts ---
  console.log('Creating contacts...')
  const CONTACT_NAMES = [
    ['Sarah', 'Johnson'], ['Michael', 'Davis'], ['Emily', 'Martinez'], ['James', 'Wilson'],
    ['Jennifer', 'Anderson'], ['Robert', 'Taylor'], ['Linda', 'Brown'], ['William', 'Jackson'],
    ['Barbara', 'White'], ['Richard', 'Harris'], ['Patricia', 'Thompson'], ['Charles', 'Garcia'],
    ['Susan', 'Martinez'], ['Christopher', 'Robinson'], ['Jessica', 'Clark'], ['Daniel', 'Lewis'],
    ['Karen', 'Lee'], ['Matthew', 'Walker'], ['Nancy', 'Hall'], ['Anthony', 'Allen'],
    ['Lisa', 'Young'], ['Mark', 'Hernandez'], ['Betty', 'King'], ['Donald', 'Wright'],
    ['Dorothy', 'Lopez'], ['Paul', 'Hill'], ['Sandra', 'Scott'], ['Steven', 'Green'],
    ['Ashley', 'Adams'], ['Kenneth', 'Baker'], ['Kimberly', 'Gonzalez'], ['Joshua', 'Nelson'],
    ['Donna', 'Carter'], ['George', 'Mitchell'], ['Carol', 'Perez'],
  ]
  const TITLES = ['CEO', 'CTO', 'VP Sales', 'Director of Operations', 'Head of Product', 'Account Manager', 'Procurement Manager', 'IT Director', 'CFO', 'Marketing Director']
  const contactIds: string[] = []

  for (let i = 0; i < 35; i++) {
    const [first, last] = CONTACT_NAMES[i]
    const companyId = companyIds[i % companyIds.length]
    const { data } = await supabase.from('contacts').insert({
      organization_id: ORG_ID,
      first_name: first,
      last_name: last,
      email: `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
      phone: `+1 ${randomInt(200, 999)}-${randomInt(100, 999)}-${randomInt(1000, 9999)}`,
      job_title: randomItem(TITLES),
      company_id: companyId,
      owner_id: randomItem(USERS).id,
      created_by: USERS[0].id,
      created_at: daysAgo(randomInt(10, 180)),
    }).select('id').single()
    if (data) contactIds.push(data.id)
  }

  // --- Leads ---
  console.log('Creating leads...')
  const LEAD_NAMES = [
    ['Alex', 'Foster'], ['Jordan', 'Reed'], ['Taylor', 'Brooks'], ['Morgan', 'Price'],
    ['Casey', 'Coleman'], ['Riley', 'Bennett'], ['Quinn', 'Murphy'], ['Drew', 'Cook'],
    ['Blake', 'Rogers'], ['Sage', 'Powell'], ['Avery', 'Richardson'], ['Reese', 'Cox'],
    ['Parker', 'Howard'], ['Hayden', 'Ward'], ['Cameron', 'Torres'], ['Logan', 'Peterson'],
    ['Peyton', 'Gray'], ['Dylan', 'Ramirez'], ['Skyler', 'James'], ['Hunter', 'Watson'],
    ['Rowan', 'Brooks'], ['Finley', 'Kelly'], ['River', 'Sanders'], ['Lennon', 'Price'],
    ['Emery', 'Bennett'], ['Corey', 'Wood'], ['Jesse', 'Barnes'], ['Brett', 'Ross'],
    ['Tanner', 'Henderson'], ['Spencer', 'Coleman'], ['Lane', 'Jenkins'], ['Austin', 'Perry'],
    ['Heath', 'Powell'], ['Caden', 'Long'], ['Reid', 'Patterson'], ['Dane', 'Hughes'],
    ['Wade', 'Flores'], ['Clark', 'Washington'], ['Holt', 'Butler'], ['Knox', 'Simmons'],
    ['Jax', 'Foster'], ['Cruz', 'Gonzales'], ['Beau', 'Bryant'], ['Rhett', 'Alexander'],
    ['Duke', 'Russell'], ['Dean', 'Griffin'], ['Cole', 'Diaz'], ['Chase', 'Hayes'],
    ['Grant', 'Myers'], ['Hayes', 'Ford'],
  ]
  const leadIds: string[] = []

  for (let i = 0; i < 50; i++) {
    const [first, last] = LEAD_NAMES[i]
    const status = i < 5 ? 'converted' : randomItem(['new', 'new', 'new', 'contacted', 'qualified', 'unqualified'] as const)
    const { data } = await supabase.from('leads').insert({
      organization_id: ORG_ID,
      first_name: first,
      last_name: last,
      email: `${first.toLowerCase()}.${last.toLowerCase()}@${randomItem(['gmail.com', 'outlook.com', 'company.io', 'business.com'])}`,
      phone: `+1 ${randomInt(200, 999)}-${randomInt(100, 999)}-${randomInt(1000, 9999)}`,
      company: COMPANIES_DATA[i % COMPANIES_DATA.length].name,
      job_title: randomItem(TITLES),
      source: randomItem(LEAD_SOURCES),
      status,
      score: randomInt(15, 95),
      owner_id: randomItem(USERS.slice(0, 4)).id,
      tags: [],
      created_by: USERS[0].id,
      created_at: daysAgo(randomInt(1, 90)),
    }).select('id').single()
    if (data) leadIds.push(data.id)
  }

  // --- Opportunities ---
  console.log('Creating opportunities...')
  const OPP_NAMES = [
    'Enterprise License — Acme Corp', 'Platform Upgrade — TechFlow', 'Annual Contract — Global Dynamics',
    'Professional Services — Summit Digital', 'SaaS Expansion — NovaTech', 'Cloud Migration — CloudBase',
    'Consulting Retainer — Vertex', 'Distribution Deal — Meridian', 'Analytics Suite — BlueSky',
    'Managed Services — Pinnacle', 'API Integration — DataSync', 'Media Buy — Horizon',
    'Infrastructure Deal — CoreBridge', 'Strategy Project — Ascent', 'Manufacturing ERP — Ironclad',
    'Creative Retainer — Prism', 'Financial Advisory — Forgepoint', 'Dev Tools License — WaveTech',
  ]
  const oppIds: string[] = []

  for (let i = 0; i < 18; i++) {
    const stageIdx = i < 3 ? 4 : i < 5 ? 5 : randomInt(0, 3)
    const stage = STAGES[stageIdx]
    const { data } = await supabase.from('opportunities').insert({
      organization_id: ORG_ID,
      name: OPP_NAMES[i],
      value: randomInt(5000, 150000),
      stage_id: stage.id,
      probability: stage.probability + randomInt(-10, 10),
      close_date: daysFromNow(randomInt(-30, 90)).split('T')[0],
      owner_id: randomItem(USERS.slice(0, 4)).id,
      contact_id: contactIds[i % contactIds.length] ?? null,
      company_id: companyIds[i % companyIds.length] ?? null,
      source: randomItem(LEAD_SOURCES),
      next_action: randomItem([
        'Schedule demo call', 'Send proposal', 'Follow up on contract review',
        'Confirm budget approval', 'Book technical evaluation', 'Send pricing details', null, null,
      ]),
      created_by: USERS[0].id,
      created_at: daysAgo(randomInt(5, 60)),
      updated_at: daysAgo(randomInt(0, 14)),
    }).select('id').single()
    if (data) oppIds.push(data.id)
  }

  // --- Tasks ---
  console.log('Creating tasks...')
  const TASK_TITLES = [
    'Follow up after demo', 'Send proposal to client', 'Schedule discovery call',
    'Prepare contract draft', 'Review competitor analysis', 'Update CRM with call notes',
    'Confirm meeting with stakeholders', 'Send product comparison sheet', 'Follow up on unpaid invoice',
    'Research prospect company', 'Prepare Q4 forecast', 'Update pipeline report',
    'Call back — left voicemail', 'Send case studies', 'Book QBR with top accounts',
    'Renew expiring contract', 'Review onboarding checklist', 'Check in with new client',
    'Prepare annual review deck', 'Qualify inbound lead', 'Send follow-up email',
    'Update deal notes', 'Schedule executive briefing', 'Test new proposal template', 'Archive closed deals',
  ]

  for (let i = 0; i < 25; i++) {
    const completed = i < 8
    const overdue = !completed && i < 12
    await supabase.from('tasks').insert({
      organization_id: ORG_ID,
      title: TASK_TITLES[i],
      priority: randomItem(PRIORITIES),
      due_date: overdue ? daysAgo(randomInt(1, 10)) : daysFromNow(randomInt(1, 14)),
      completed_at: completed ? daysAgo(randomInt(1, 5)) : null,
      owner_id: randomItem(USERS.slice(0, 4)).id,
      opportunity_id: oppIds[i % oppIds.length] ?? null,
      created_by: USERS[0].id,
      created_at: daysAgo(randomInt(1, 30)),
    })
  }

  // --- Activities ---
  console.log('Creating activities...')
  const ACT_SUBJECTS = [
    'Discovery call', 'Product demo', 'Proposal review', 'Contract negotiation call',
    'Sent intro email', 'Left voicemail', 'In-person meeting', 'Technical deep dive',
    'Pricing discussion', 'Stakeholder alignment call', 'Closed won celebration call',
    'Follow-up email sent', 'Team introduction call', 'Executive briefing',
  ]

  for (let i = 0; i < 30; i++) {
    await supabase.from('activities').insert({
      organization_id: ORG_ID,
      type: randomItem(ACTIVITY_TYPES),
      subject: randomItem(ACT_SUBJECTS),
      description: 'Discussed requirements and next steps. Client expressed strong interest.',
      duration_minutes: randomInt(15, 90),
      outcome: randomItem(['positive', 'neutral', 'positive', 'no_answer', 'left_voicemail']),
      activity_date: daysAgo(randomInt(0, 30)),
      opportunity_id: oppIds[i % oppIds.length] ?? null,
      contact_id: contactIds[i % contactIds.length] ?? null,
      created_by: randomItem(USERS.slice(0, 4)).id,
    })
  }

  // --- Quotes ---
  console.log('Creating quotes...')
  const QUOTE_DATA = [
    { title: 'Enterprise Software License', value: 48000 },
    { title: 'Annual Support & Maintenance', value: 12000 },
    { title: 'Professional Services Bundle', value: 35000 },
    { title: 'Cloud Migration Project', value: 67500 },
    { title: 'Marketing Analytics Platform', value: 24000 },
    { title: 'Custom Integration Work', value: 18500 },
    { title: 'Training & Onboarding Package', value: 8400 },
    { title: 'Managed Services Agreement', value: 52000 },
  ]
  const QUOTE_STATUSES = ['draft', 'sent', 'accepted', 'sent', 'draft', 'accepted', 'sent', 'expired'] as const

  for (let i = 0; i < 8; i++) {
    const { title, value } = QUOTE_DATA[i]
    const taxRate = 8.5
    const taxAmount = value * (taxRate / 100)
    const total = value + taxAmount

    const { data: quote } = await supabase.from('quotes').insert({
      organization_id: ORG_ID,
      quote_number: `Q-${String(i + 1).padStart(5, '0')}`,
      title,
      opportunity_id: oppIds[i % oppIds.length] ?? null,
      contact_id: contactIds[i % contactIds.length] ?? null,
      company_id: companyIds[i % companyIds.length] ?? null,
      status: QUOTE_STATUSES[i],
      issue_date: daysAgo(randomInt(5, 30)).split('T')[0],
      expiry_date: daysFromNow(randomInt(15, 45)).split('T')[0],
      subtotal: value,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      discount: 0,
      total,
      notes: 'Pricing valid for 30 days. Includes implementation and onboarding.',
      terms: 'Net 30. 50% deposit required to begin work.',
      created_by: USERS[0].id,
    }).select('id').single()

    if (quote) {
      await supabase.from('quote_items').insert([
        { quote_id: quote.id, description: `${title} — Annual License`, quantity: 1, unit_price: value * 0.7, amount: value * 0.7, position: 0 },
        { quote_id: quote.id, description: 'Implementation & Setup', quantity: 1, unit_price: value * 0.2, amount: value * 0.2, position: 1 },
        { quote_id: quote.id, description: 'Training (5 sessions)', quantity: 5, unit_price: (value * 0.1) / 5, amount: value * 0.1, position: 2 },
      ])
    }
  }

  console.log('✅ Seed complete!')
  console.log('')
  console.log('Demo credentials:')
  USERS.forEach((u) => console.log(`  ${u.role.padEnd(15)} ${u.email}  (password: Demo1234!)`))
}

seed().catch(console.error)
