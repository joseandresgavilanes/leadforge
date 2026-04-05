import { getRequestConfig } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { defaultLocale, locales, type Locale } from './config'

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale

  if (locale && !locales.includes(locale as Locale)) {
    notFound()
  }
  if (!locale) {
    locale = defaultLocale
  }

  const loc = locale as Locale

  const [common, auth, dashboard, leads, contacts, companies, opportunities, tasks, activities, quotes, reports, billing, team, settings, marketing, legal, timeline, dataHygiene, workspace] =
    await Promise.all([
      import(`@/messages/${loc}/common.json`),
      import(`@/messages/${loc}/auth.json`),
      import(`@/messages/${loc}/dashboard.json`),
      import(`@/messages/${loc}/leads.json`),
      import(`@/messages/${loc}/contacts.json`),
      import(`@/messages/${loc}/companies.json`),
      import(`@/messages/${loc}/opportunities.json`),
      import(`@/messages/${loc}/tasks.json`),
      import(`@/messages/${loc}/activities.json`),
      import(`@/messages/${loc}/quotes.json`),
      import(`@/messages/${loc}/reports.json`),
      import(`@/messages/${loc}/billing.json`),
      import(`@/messages/${loc}/team.json`),
      import(`@/messages/${loc}/settings.json`),
      import(`@/messages/${loc}/marketing.json`),
      import(`@/messages/${loc}/legal.json`),
      import(`@/messages/${loc}/timeline.json`),
      import(`@/messages/${loc}/dataHygiene.json`),
      import(`@/messages/${loc}/workspace.json`),
    ])

  return {
    locale: loc,
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
      workspace: workspace.default,
    },
    timeZone: 'UTC',
    now: new Date(),
  }
})
