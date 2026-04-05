import { type NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { createAdminClient } from '@/lib/db/server'
import type Stripe from 'stripe'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) return NextResponse.json({ error: 'No signature' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }

  const supabase = await createAdminClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const orgId = session.metadata?.organization_id
      const subId = session.subscription as string

      if (orgId && subId) {
        const subscription = await stripe.subscriptions.retrieve(subId)
        const priceId = subscription.items.data[0]?.price.id

        // Map price ID to plan
        let plan: 'starter' | 'growth' | 'pro' = 'starter'
        if (priceId?.includes('growth')) plan = 'growth'
        else if (priceId?.includes('pro')) plan = 'pro'

        await supabase.from('organizations').update({
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: subId,
          subscription_status: 'active',
          plan,
          updated_at: new Date().toISOString(),
        }).eq('id', orgId)
      }
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const orgId = subscription.metadata?.organization_id

      if (orgId) {
        const status = subscription.status === 'active' ? 'active'
          : subscription.status === 'trialing' ? 'trialing'
          : subscription.status === 'past_due' ? 'past_due'
          : 'cancelled'

        await supabase.from('organizations').update({
          subscription_status: status,
          updated_at: new Date().toISOString(),
        }).eq('id', orgId)
      }
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const orgId = subscription.metadata?.organization_id

      if (orgId) {
        await supabase.from('organizations').update({
          subscription_status: 'cancelled',
          plan: 'starter',
          stripe_subscription_id: null,
          updated_at: new Date().toISOString(),
        }).eq('id', orgId)
      }
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string

      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single()

      if (org) {
        await supabase.from('organizations').update({
          subscription_status: 'past_due',
          updated_at: new Date().toISOString(),
        }).eq('id', org.id)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
