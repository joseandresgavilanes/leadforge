import { z } from 'zod'

// --- Auth ---
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const signupSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email(),
  password: z.string()
    .min(8)
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  companyName: z.string().min(1).max(100),
})

export const resetPasswordSchema = z.object({
  email: z.string().email(),
})

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[0-9]/),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

// --- Organization ---
export const organizationSchema = z.object({
  name: z.string().min(1).max(100),
  domain: z.string().max(100).optional().nullable(),
  industry: z.string().max(50).optional().nullable(),
  timezone: z.string().default('UTC'),
  currency: z.string().default('USD'),
})

// --- Lead ---
export const leadSchema = z
  .object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().max(50).optional().nullable(),
  email: z.preprocess(
    (v) => (v === '' || v === undefined || v === null ? null : String(v).trim()),
    z.string().email().nullable().optional()
  ),
  phone: z.preprocess(
    (v) => (v === '' || v === undefined || v === null ? null : String(v).trim()),
    z.string().max(30).nullable().optional()
  ),
  company: z.string().max(100).optional().nullable(),
  jobTitle: z.string().max(100).optional().nullable(),
  source: z.string().max(50).optional().nullable(),
  status: z.enum(['new', 'contacted', 'qualified', 'unqualified', 'converted']).default('new'),
  score: z.number().min(0).max(100).default(50),
  ownerId: z.string().uuid().optional().nullable(),
  tags: z.array(z.string()).default([]),
  notes: z.string().max(5000).optional().nullable(),
  website: z.preprocess(
    (v) => (v === '' || v === undefined || v === null ? null : v),
    z.string().url().nullable().optional()
  ),
  industry: z.string().max(50).optional().nullable(),
  budget: z.number().min(0).optional().nullable(),
  })
  .refine((d) => !!(d.email && d.email.length > 0) || !!(d.phone && d.phone.length > 0), {
    message: 'emailOrPhone',
    path: ['email'],
  })

export const convertLeadSchema = z
  .object({
  leadId: z.string().uuid(),
  createContact: z.boolean().default(true),
  createCompany: z.boolean().default(false),
  createOpportunity: z.boolean().default(false),
  existingContactId: z.string().uuid().optional().nullable(),
  existingCompanyId: z.string().uuid().optional().nullable(),
  opportunityName: z.string().max(200).optional(),
  opportunityValue: z.number().min(0).optional(),
  stageId: z.string().uuid().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.createContact && !data.existingContactId) {
      ctx.addIssue({
        code: 'custom',
        message: 'existingContactRequired',
        path: ['existingContactId'],
      })
    }
    if (data.createContact && data.existingContactId) {
      ctx.addIssue({
        code: 'custom',
        message: 'contactChoiceConflict',
        path: ['existingContactId'],
      })
    }
    if (data.createCompany && data.existingCompanyId) {
      ctx.addIssue({
        code: 'custom',
        message: 'companyChoiceConflict',
        path: ['existingCompanyId'],
      })
    }
  })

// --- Contact ---
export const contactSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().max(50).optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  jobTitle: z.string().max(100).optional().nullable(),
  companyId: z.preprocess(
    (v) => (v === '' || v === undefined ? null : v),
    z.string().uuid().nullable().optional()
  ),
  ownerId: z.string().uuid().optional().nullable(),
  tags: z.array(z.string()).default([]),
  notes: z.string().max(5000).optional().nullable(),
  linkedinUrl: z.preprocess(
    (v) => (v === '' || v === undefined || v === null ? null : v),
    z.string().url().nullable().optional()
  ),
})

// --- Company ---
export const companySchema = z.object({
  name: z.string().min(1).max(100),
  domain: z.string().max(100).optional().nullable(),
  industry: z.string().max(50).optional().nullable(),
  size: z.string().max(30).optional().nullable(),
  annualRevenue: z.number().min(0).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  address: z.string().max(200).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  website: z.preprocess(
    (v) => (v === '' || v === undefined || v === null ? null : v),
    z.string().url().nullable().optional()
  ),
  ownerId: z.string().uuid().optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
})

// --- Opportunity ---
export const opportunitySchema = z.object({
  name: z.string().min(1).max(200),
  value: z.number().min(0).default(0),
  stageId: z.string().uuid(),
  probability: z.number().min(0).max(100).default(50),
  closeDate: z.string().optional().nullable(),
  ownerId: z.string().uuid().optional().nullable(),
  contactId: z.string().uuid().optional().nullable(),
  companyId: z.string().uuid().optional().nullable(),
  source: z.string().max(50).optional().nullable(),
  nextAction: z.string().max(500).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
})

export const moveOpportunityStageSchema = z.object({
  opportunityId: z.string().uuid(),
  stageId: z.string().uuid(),
  previousStageId: z.string().uuid(),
  lostReason: z.string().max(500).optional().nullable(),
  competitor: z.string().max(200).optional().nullable(),
  closeNotes: z.string().max(2000).optional().nullable(),
  regressionReason: z.string().max(500).optional().nullable(),
})

export type MoveOpportunityStageInput = z.infer<typeof moveOpportunityStageSchema>

// --- Activity ---
export const activitySchema = z.object({
  type: z.enum(['call', 'meeting', 'email', 'note', 'demo', 'task']),
  subject: z.string().min(1).max(200),
  description: z.string().max(5000).optional().nullable(),
  durationMinutes: z.number().min(1).max(480).optional().nullable(),
  outcome: z.string().max(50).optional().nullable(),
  activityDate: z.string(),
  leadId: z.string().uuid().optional().nullable(),
  contactId: z.string().uuid().optional().nullable(),
  companyId: z.string().uuid().optional().nullable(),
  opportunityId: z.string().uuid().optional().nullable(),
})

// --- Task ---
export const taskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  dueDate: z.string().optional().nullable(),
  ownerId: z.string().uuid().optional().nullable(),
  leadId: z.string().uuid().optional().nullable(),
  contactId: z.string().uuid().optional().nullable(),
  companyId: z.string().uuid().optional().nullable(),
  opportunityId: z.string().uuid().optional().nullable(),
})

// --- Quote ---
export const quoteItemSchema = z.object({
  description: z.string().min(1).max(500),
  quantity: z.number().min(0.01),
  unitPrice: z.number().min(0),
  position: z.number().int().min(0).optional(),
})

export const quoteSchema = z.object({
  title: z.string().min(1).max(200),
  opportunityId: z.string().uuid().optional().nullable(),
  contactId: z.string().uuid().optional().nullable(),
  companyId: z.string().uuid().optional().nullable(),
  status: z
    .enum(['draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired', 'cancelled'])
    .default('draft'),
  issueDate: z.string(),
  expiryDate: z.string().optional().nullable(),
  taxRate: z.number().min(0).max(100).default(0),
  discount: z.number().min(0).default(0),
  notes: z.string().max(2000).optional().nullable(),
  terms: z.string().max(2000).optional().nullable(),
  items: z.array(quoteItemSchema).min(1),
})

// --- Team ---
export const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['org_admin', 'sales_manager', 'sales_rep', 'viewer']),
})

export const changeMemberRoleSchema = z.object({
  memberId: z.string().uuid(),
  role: z.enum(['org_admin', 'sales_manager', 'sales_rep', 'viewer']),
})

// --- Pipeline Stage ---
export const pipelineStageSchema = z.object({
  name: z.string().min(1).max(50),
  probability: z.number().min(0).max(100),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  position: z.number().int().min(0),
})

// --- Note ---
export const noteSchema = z
  .object({
    content: z.string().min(1).max(5000),
    leadId: z.string().uuid().optional().nullable(),
    contactId: z.string().uuid().optional().nullable(),
    companyId: z.string().uuid().optional().nullable(),
    opportunityId: z.string().uuid().optional().nullable(),
  })
  .refine(
    (d) => [d.leadId, d.contactId, d.companyId, d.opportunityId].filter(Boolean).length === 1,
    { message: 'Exactly one record link is required' }
  )

// --- Demo Request ---
export const demoRequestSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email(),
  company: z.string().min(1).max(100),
  teamSize: z.string(),
})

// Type exports
export type LoginInput = z.infer<typeof loginSchema>
export type SignupInput = z.infer<typeof signupSchema>
export type LeadInput = z.infer<typeof leadSchema>
export type ContactInput = z.infer<typeof contactSchema>
export type CompanyInput = z.infer<typeof companySchema>
export type OpportunityInput = z.infer<typeof opportunitySchema>
export type ActivityInput = z.infer<typeof activitySchema>
export type TaskInput = z.infer<typeof taskSchema>
export type QuoteInput = z.infer<typeof quoteSchema>
export type QuoteItemInput = z.infer<typeof quoteItemSchema>
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>
export type DemoRequestInput = z.infer<typeof demoRequestSchema>
