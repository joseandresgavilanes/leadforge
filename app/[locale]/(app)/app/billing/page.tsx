import { getTranslations } from 'next-intl/server'
import { tryCreateClient } from '@/lib/db/server'
import { getDemoBillingCounts } from '@/lib/mock/demo-dataset'
import { requireAuth, getActiveOrganization } from '@/lib/auth/server'
import { PLAN_LIMITS } from '@/types'
import { formatDate } from '@/lib/dates'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/data-display'
import { Badge } from '@/components/ui/data-display'
import { CheckCircle, CreditCard } from 'lucide-react'
import BillingActions from './billing-actions'
import { UpgradePlanButton } from './upgrade-plan-button'

export default async function BillingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations('billing')
  const user = await requireAuth(locale)
  const orgData = await getActiveOrganization(user.id)
  if (!orgData) return null

  const org = orgData.organization
  const plan = org.plan ?? 'starter'
  const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS]

  const supabase = await tryCreateClient()

  let leadCount = 0
  let userCount = 0
  let quoteCount = 0
  if (supabase) {
    const [leadsR, usersR, quotesR] = await Promise.all([
      supabase.from('leads').select('*', { count: 'exact', head: true }).eq('organization_id', org.id),
      supabase
        .from('memberships')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', org.id)
        .not('accepted_at', 'is', null),
      supabase
        .from('quotes')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', org.id)
        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
    ])
    leadCount = leadsR.count ?? 0
    userCount = usersR.count ?? 0
    quoteCount = quotesR.count ?? 0
  } else {
    const d = getDemoBillingCounts(org.id)
    leadCount = d.leadCount
    userCount = d.userCount
    quoteCount = d.quoteCount
  }

  const priceIds = {
    starter: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID ?? '',
    growth: process.env.STRIPE_GROWTH_MONTHLY_PRICE_ID ?? '',
    pro: process.env.STRIPE_PRO_MONTHLY_PRICE_ID ?? '',
  }

  const planKeys = ['starter', 'growth', 'pro'] as const
  const plans = planKeys.map((key) => ({
    key,
    features: (t.raw(`planFeatures.${key}`) as string[]) ?? [],
    popular: key === 'growth',
  }))

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-heading font-bold">{t('title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('currentPlan')}: <span className="font-semibold capitalize text-foreground">{plan}</span></p>
      </div>

      {/* Subscription status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            {t('subscription.status')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold capitalize">{t(`plans.${plan}.name`)}</p>
              {org.subscription_status && (
                <Badge variant={org.subscription_status === 'active' ? 'success' : org.subscription_status === 'trialing' ? 'info' : 'destructive'} className="mt-1">
                  {t(`subscription.${org.subscription_status}`)}
                </Badge>
              )}
              {org.trial_ends_at && org.subscription_status === 'trialing' && (
                <p className="text-sm text-muted-foreground mt-1">
                  {t('subscription.trialEnds', { date: formatDate(org.trial_ends_at, locale) })}
                </p>
              )}
            </div>
            <BillingActions locale={locale} hasSubscription={!!org.stripe_subscription_id} />
          </div>
        </CardContent>
      </Card>

      {/* Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('usage.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <UsageBar label={t('usage.users')} used={userCount ?? 0} limit={limits.maxUsers} />
          <UsageBar label={t('usage.leads')} used={leadCount ?? 0} limit={limits.maxLeads} />
          <UsageBar label={t('usage.quotes')} used={quoteCount ?? 0} limit={limits.maxQuotesPerMonth} />
        </CardContent>
      </Card>

      {/* Plans */}
      <div>
        <h2 className="text-lg font-heading font-semibold mb-4">{t('actions.upgrade')}</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {plans.map((p) => (
            <Card key={p.key} className={`relative ${p.key === plan ? 'border-primary ring-1 ring-primary' : ''} ${p.popular ? 'border-brand-accent' : ''}`}>
              {p.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant="success">{t('plans.growth.badge')}</Badge>
                </div>
              )}
              {p.key === plan && (
                <div className="absolute -top-3 right-4">
                  <Badge variant="default">{t('currentPlan')}</Badge>
                </div>
              )}
              <CardHeader className="pb-3">
                <CardTitle className="text-base capitalize">{t(`plans.${p.key}.name`)}</CardTitle>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-heading font-bold">{t(`plans.${p.key}.price`)}</span>
                  <span className="text-sm text-muted-foreground">{t(`plans.${p.key}.period`)}</span>
                </div>
                <CardDescription>{t(`plans.${p.key}.description`)}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-brand-accent shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <UpgradePlanButton
                  planKey={p.key}
                  priceId={priceIds[p.key as keyof typeof priceIds]}
                  locale={locale}
                  currentPlan={plan}
                  popular={p.popular}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

function UsageBar({ label, used, limit }: { label: string; used: number; limit: number }) {
  const isUnlimited = limit >= 999999
  const pct = isUnlimited ? 0 : Math.min((used / limit) * 100, 100)
  const nearLimit = pct >= 80
  const atLimit = pct >= 100

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className={`font-mono text-xs ${atLimit ? 'text-destructive' : nearLimit ? 'text-brand-warning' : 'text-muted-foreground'}`}>
          {used} / {isUnlimited ? '∞' : limit.toLocaleString()}
        </span>
      </div>
      {!isUnlimited && (
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${atLimit ? 'bg-destructive' : nearLimit ? 'bg-brand-warning' : 'bg-primary'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  )
}
