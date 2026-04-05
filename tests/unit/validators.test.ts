import { describe, it, expect } from 'vitest'
import { leadSchema, quoteSchema, loginSchema, signupSchema } from '@/lib/validators/schemas'
import { formatCurrency, formatPercent, scoreToLabel, slugify, getInitials, fullName, isOverdue } from '@/lib/utils'
import { hasPermission } from '@/lib/rbac/permissions'

// ── Schema Validation ────────────────────────────────────────────────
describe('leadSchema', () => {
  it('accepts valid lead', () => {
    const result = leadSchema.safeParse({ firstName: 'Jane', email: 'jane@test.com', score: 75, status: 'new', tags: [] })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = leadSchema.safeParse({ firstName: 'Jane', email: 'not-an-email', score: 75, status: 'new', tags: [] })
    expect(result.success).toBe(false)
  })

  it('rejects score out of range', () => {
    const result = leadSchema.safeParse({ firstName: 'Jane', score: 150, status: 'new', tags: [] })
    expect(result.success).toBe(false)
  })

  it('requires firstName', () => {
    const result = leadSchema.safeParse({ email: 'jane@test.com', score: 50, status: 'new', tags: [] })
    expect(result.success).toBe(false)
  })
})

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    const result = loginSchema.safeParse({ email: 'user@test.com', password: 'password' })
    expect(result.success).toBe(true)
  })

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({ email: 'user@test.com', password: '' })
    expect(result.success).toBe(false)
  })
})

describe('signupSchema', () => {
  it('accepts strong password', () => {
    const result = signupSchema.safeParse({
      firstName: 'Jane', lastName: 'Smith', email: 'jane@test.com',
      password: 'Password1', companyName: 'ACME'
    })
    expect(result.success).toBe(true)
  })

  it('rejects weak password', () => {
    const result = signupSchema.safeParse({
      firstName: 'Jane', lastName: 'Smith', email: 'jane@test.com',
      password: 'password', companyName: 'ACME'
    })
    expect(result.success).toBe(false)
  })
})

describe('quoteSchema', () => {
  it('requires at least one line item', () => {
    const result = quoteSchema.safeParse({
      title: 'Q1', status: 'draft', issueDate: '2024-01-01', taxRate: 0, discount: 0, items: []
    })
    expect(result.success).toBe(false)
  })

  it('accepts valid quote with items', () => {
    const result = quoteSchema.safeParse({
      title: 'Enterprise License', status: 'draft', issueDate: '2024-01-01', taxRate: 10, discount: 0,
      items: [{ description: 'License', quantity: 1, unitPrice: 5000, position: 0 }]
    })
    expect(result.success).toBe(true)
  })
})

// ── Utility Functions ────────────────────────────────────────────────
describe('formatCurrency', () => {
  it('formats USD correctly', () => {
    expect(formatCurrency(1500)).toBe('$1,500')
    expect(formatCurrency(1500.50)).toBe('$1,500.50')
    expect(formatCurrency(0)).toBe('$0')
  })
})

describe('formatPercent', () => {
  it('formats percentage correctly', () => {
    expect(formatPercent(75)).toBe('75%')
    expect(formatPercent(0)).toBe('0%')
    expect(formatPercent(100)).toBe('100%')
  })
})

describe('scoreToLabel', () => {
  it('returns hot for score >= 70', () => {
    expect(scoreToLabel(70)).toBe('hot')
    expect(scoreToLabel(95)).toBe('hot')
    expect(scoreToLabel(100)).toBe('hot')
  })

  it('returns warm for score 40-69', () => {
    expect(scoreToLabel(40)).toBe('warm')
    expect(scoreToLabel(55)).toBe('warm')
    expect(scoreToLabel(69)).toBe('warm')
  })

  it('returns cold for score < 40', () => {
    expect(scoreToLabel(0)).toBe('cold')
    expect(scoreToLabel(39)).toBe('cold')
  })
})

describe('slugify', () => {
  it('converts text to slug', () => {
    expect(slugify('Hello World')).toBe('hello-world')
    expect(slugify('My Company, Inc.')).toBe('my-company-inc')
    expect(slugify('  spaces  ')).toBe('spaces')
  })
})

describe('getInitials', () => {
  it('returns initials', () => {
    expect(getInitials('Jane', 'Smith')).toBe('JS')
    expect(getInitials('Alex', null)).toBe('A')
    expect(getInitials(null, null)).toBe('')
  })
})

describe('fullName', () => {
  it('combines names', () => {
    expect(fullName('Jane', 'Smith')).toBe('Jane Smith')
    expect(fullName('Alex', null)).toBe('Alex')
    expect(fullName(null, null)).toBe('')
  })
})

describe('isOverdue', () => {
  it('returns true for past due dates', () => {
    const past = new Date()
    past.setDate(past.getDate() - 1)
    expect(isOverdue(past.toISOString())).toBe(true)
  })

  it('returns false for future due dates', () => {
    const future = new Date()
    future.setDate(future.getDate() + 1)
    expect(isOverdue(future.toISOString())).toBe(false)
  })

  it('returns false for null', () => {
    expect(isOverdue(null)).toBe(false)
  })
})

// ── RBAC ────────────────────────────────────────────────────────────
describe('hasPermission', () => {
  it('org_admin has all permissions', () => {
    expect(hasPermission('org_admin', 'leads:delete')).toBe(true)
    expect(hasPermission('org_admin', 'billing:manage')).toBe(true)
    expect(hasPermission('org_admin', 'team:manage')).toBe(true)
    expect(hasPermission('org_admin', 'pipeline:configure')).toBe(true)
  })

  it('viewer only has read permissions', () => {
    expect(hasPermission('viewer', 'leads:read')).toBe(true)
    expect(hasPermission('viewer', 'leads:create')).toBe(false)
    expect(hasPermission('viewer', 'leads:delete')).toBe(false)
    expect(hasPermission('viewer', 'billing:manage')).toBe(false)
  })

  it('sales_rep cannot delete leads', () => {
    expect(hasPermission('sales_rep', 'leads:delete')).toBe(false)
  })

  it('sales_manager can delete leads', () => {
    expect(hasPermission('sales_manager', 'leads:delete')).toBe(true)
  })

  it('sales_rep cannot access billing management', () => {
    expect(hasPermission('sales_rep', 'billing:manage')).toBe(false)
  })
})
