'use server'

import { revalidatePath } from 'next/cache'
import { tryCreateClient } from '@/lib/db/server'
import { OFFLINE_ACTION_ERROR } from '@/lib/mock/offline-messages'
import { getDemoQuoteById, getDemoQuotes } from '@/lib/mock/demo-dataset'
import { requireAuth, getActiveOrganization } from '@/lib/auth/server'
import { requirePermission } from '@/lib/rbac/permissions'
import { quoteSchema, type QuoteInput } from '@/lib/validators/schemas'
import { createAuditLog, AUDIT_ACTIONS } from '@/lib/audit/log'
import { trackEvent } from '@/lib/analytics/track'
import type { ActionResult, QuoteWithItems } from '@/types'

async function getContext() {
  const user = await requireAuth()
  const orgData = await getActiveOrganization(user.id)
  if (!orgData) throw new Error('No organization found')
  return { user, org: orgData.organization, membership: orgData.membership }
}

async function getNextQuoteNumber(orgId: string): Promise<string> {
  const supabase = await tryCreateClient()
  if (!supabase) return 'Q-00001'
  const { count } = await supabase
    .from('quotes')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)

  const seq = (count ?? 0) + 1
  return `Q-${String(seq).padStart(5, '0')}`
}

export async function getQuotes(page = 1, pageSize = 25) {
  const { org } = await getContext()
  const supabase = await tryCreateClient()
  if (!supabase) return getDemoQuotes(org.id, page, pageSize)

  const from = (page - 1) * pageSize
  const { data, count, error } = await supabase
    .from('quotes')
    .select(`
      *,
      opportunity:opportunities(id,name),
      contact:contacts(id,first_name,last_name,email),
      company:companies(id,name)
    `, { count: 'exact' })
    .eq('organization_id', org.id)
    .order('created_at', { ascending: false })
    .range(from, from + pageSize - 1)

  if (error) throw error

  return {
    data: data ?? [],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  }
}

export async function getQuoteById(id: string): Promise<QuoteWithItems | null> {
  const { org } = await getContext()
  const supabase = await tryCreateClient()
  if (!supabase) return getDemoQuoteById(org.id, id)

  const { data } = await supabase
    .from('quotes')
    .select(`
      *,
      items:quote_items(*),
      opportunity:opportunities(id,name),
      contact:contacts(id,first_name,last_name,email),
      company:companies(id,name)
    `)
    .eq('id', id)
    .eq('organization_id', org.id)
    .single()

  return data as unknown as QuoteWithItems | null
}

export async function createQuote(input: QuoteInput): Promise<ActionResult<{ id: string }>> {
  try {
    const { user, org, membership } = await getContext()
    requirePermission(membership.role, 'quotes:create')

    const validated = quoteSchema.parse(input)
    const supabase = await tryCreateClient()
    if (!supabase) return { success: false, error: OFFLINE_ACTION_ERROR }

    const quoteNumber = await getNextQuoteNumber(org.id)

    // Compute totals
    const subtotal = validated.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
    const discountAmount = validated.discount ?? 0
    const taxableAmount = subtotal - discountAmount
    const taxAmount = taxableAmount * ((validated.taxRate ?? 0) / 100)
    const total = taxableAmount + taxAmount

    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .insert({
        organization_id: org.id,
        quote_number: quoteNumber,
        title: validated.title,
        opportunity_id: validated.opportunityId ?? null,
        contact_id: validated.contactId ?? null,
        company_id: validated.companyId ?? null,
        status: validated.status,
        issue_date: validated.issueDate,
        expiry_date: validated.expiryDate ?? null,
        subtotal,
        tax_rate: validated.taxRate ?? 0,
        tax_amount: taxAmount,
        discount: discountAmount,
        total,
        notes: validated.notes ?? null,
        terms: validated.terms ?? null,
        created_by: user.id,
      })
      .select('id')
      .single()

    if (quoteError) return { success: false, error: quoteError.message }

    // Insert line items
    const items = validated.items.map((item, idx) => ({
      quote_id: quote.id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      amount: item.quantity * item.unitPrice,
      position: item.position ?? idx,
    }))

    const { error: itemsError } = await supabase.from('quote_items').insert(items)
    if (itemsError) return { success: false, error: itemsError.message }

    await createAuditLog({
      organizationId: org.id,
      actorId: user.id,
      action: AUDIT_ACTIONS.QUOTE_CREATED,
      entityType: 'quote',
      entityId: quote.id,
      metadata: { quoteNumber, total },
    })

    await trackEvent('quote_created', { organizationId: org.id, userId: user.id })

    revalidatePath('/[locale]/app/quotes', 'page')
    return { success: true, data: { id: quote.id } }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function updateQuoteStatus(
  id: string,
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired' | 'cancelled'
): Promise<ActionResult<void>> {
  try {
    const { user, org, membership } = await getContext()
    requirePermission(membership.role, 'quotes:update')

    const supabase = await tryCreateClient()
    if (!supabase) return { success: false, error: OFFLINE_ACTION_ERROR }

    const { error } = await supabase
      .from('quotes')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('organization_id', org.id)

    if (error) return { success: false, error: error.message }

    if (status === 'sent') {
      await createAuditLog({
        organizationId: org.id,
        actorId: user.id,
        action: AUDIT_ACTIONS.QUOTE_SENT,
        entityType: 'quote',
        entityId: id,
      })
    } else if (status === 'accepted') {
      await createAuditLog({
        organizationId: org.id,
        actorId: user.id,
        action: AUDIT_ACTIONS.QUOTE_ACCEPTED,
        entityType: 'quote',
        entityId: id,
      })
    } else if (status === 'viewed') {
      await createAuditLog({
        organizationId: org.id,
        actorId: user.id,
        action: AUDIT_ACTIONS.QUOTE_VIEWED,
        entityType: 'quote',
        entityId: id,
      })
    } else if (status === 'cancelled') {
      await createAuditLog({
        organizationId: org.id,
        actorId: user.id,
        action: AUDIT_ACTIONS.QUOTE_CANCELLED,
        entityType: 'quote',
        entityId: id,
      })
    }

    revalidatePath('/[locale]/app/quotes', 'page')
    revalidatePath(`/[locale]/app/quotes/${id}`, 'page')
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function deleteQuote(id: string): Promise<ActionResult<void>> {
  try {
    const { user, org, membership } = await getContext()
    requirePermission(membership.role, 'quotes:delete')

    const supabase = await tryCreateClient()
    if (!supabase) return { success: false, error: OFFLINE_ACTION_ERROR }

    await supabase.from('quote_items').delete().eq('quote_id', id)
    const { error } = await supabase
      .from('quotes')
      .delete()
      .eq('id', id)
      .eq('organization_id', org.id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/[locale]/app/quotes', 'page')
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
