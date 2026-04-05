import { getRequestConfig } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { locales, type Locale } from './config'

export default getRequestConfig(async ({ locale }) => {
  if (!locales.includes(locale as Locale)) notFound()

  const [common, auth, dashboard, leads, contacts, companies, opportunities, tasks, activities, quotes, reports, billing, team, settings, marketing, legal, timeline, dataHygiene] =
    await Promise.all([
      import(`@/messages/${locale}/common.json`),
      import(`@/messages/${locale}/auth.json`),
      import(`@/messages/${locale}/dashboard.json`),
      import(`@/messages/${locale}/leads.json`),
      import(`@/messages/${locale}/contacts.json`),
      import(`@/messages/${locale}/companies.json`),
      import(`@/messages/${locale}/opportunities.json`),
      import(`@/messages/${locale}/tasks.json`),
      import(`@/messages/${locale}/activities.json`),
      import(`@/messages/${locale}/quotes.json`),
      import(`@/messages/${locale}/reports.json`),
      import(`@/messages/${locale}/billing.json`),
      import(`@/messages/${locale}/team.json`),
      import(`@/messages/${locale}/settings.json`),
      import(`@/messages/${locale}/marketing.json`),
      import(`@/messages/${locale}/legal.json`),
      import(`@/messages/${locale}/timeline.json`),
      import(`@/messages/${locale}/dataHygiene.json`),
    ])

  return {
    messages: {
      common: common.default,
      auth: auth.default,
      dashboard: dashboard.default,
      leads: leads.default,
      contacts: contacts.default,
      companies: companies.default,
      opportunities: opportunities.default,
      tasks: tasks.default,
      activities: activities.default,
      quotes: quotes.default,
      reports: reports.default,
      billing: billing.default,
      team: team.default,
      settings: settings.default,
      marketing: marketing.default,
      legal: legal.default,
      timeline: timeline.default,
      dataHygiene: dataHygiene.default,
    },
    timeZone: 'UTC',
    now: new Date(),
  }
})
