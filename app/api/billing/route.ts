import { type NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { tryCreateClient } from '@/lib/db/server'
import { createCheckoutSession, createOrRetrieveCustomer, createBillingPortalSession } from '@/lib/stripe/client'
import type { Organization } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const supabase = await tryCreateClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Billing requires Supabase env vars' }, { status: 503 })
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { action, priceId, locale } = await request.json()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL!

    const preferredOrgId = (await cookies()).get('lf_active_org')?.value

    const { data: memberships } = await supabase
      .from('memberships')
      .select('organization_id, organizations(*)')
      .eq('user_id', user.id)
      .not('accepted_at', 'is', null)
      .order('created_at', { ascending: true })

    if (!memberships?.length) return NextResponse.json({ error: 'No organization' }, { status: 400 })

    const membership =
      (preferredOrgId ? memberships.find((m) => m.organization_id === preferredOrgId) : null) ??
      memberships[0]

    const org = (membership as { organizations: Organization }).organizations

    if (action === 'checkout') {
      const customerId = await createOrRetrieveCustomer({
        email: user.email!,
        name: org.name,
        organizationId: org.id,
      })

      const session = await createCheckoutSession({
        organizationId: org.id,
        customerId,
        priceId,
        successUrl: `${appUrl}/${locale ?? 'en'}/app/billing?success=1`,
        cancelUrl: `${appUrl}/${locale ?? 'en'}/app/billing?cancelled=1`,
      })

      return NextResponse.json({ url: session.url })
    }

    if (action === 'portal') {
      if (!org.stripe_customer_id) {
        return NextResponse.json({ error: 'No billing account' }, { status: 400 })
      }
      const session = await createBillingPortalSession(
        org.stripe_customer_id,
        `${appUrl}/${locale ?? 'en'}/app/billing`
      )
      return NextResponse.json({ url: session.url })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err) {
    console.error('Billing route error:', err)
    return NextResponse.json({ error: 'Billing request failed' }, { status: 500 })
  }
}
