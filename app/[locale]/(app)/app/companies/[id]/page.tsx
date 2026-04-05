import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { getCompanyById, getContacts } from '@/features/contacts/actions'
import { Button } from '@/components/ui/button'
import CompanyForm from '../company-form'
import { EntityTimeline } from '@/components/crm/entity-timeline'

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  const [company, { data: contacts }, t, tc] = await Promise.all([
    getCompanyById(id),
    getContacts(undefined, 1, 50, id),
    getTranslations('companies'),
    getTranslations('common'),
  ])

  if (!company) notFound()

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href={`/${locale}/app/companies`}>
          <Button variant="ghost" size="sm">{tc('actions.back')}</Button>
        </Link>
        <h1 className="text-2xl font-heading font-bold">{company.name}</h1>
      </div>

      <CompanyForm locale={locale} company={company as any} />

      <div>
        <h2 className="font-heading font-semibold mb-3">{t('tabs.contacts')}</h2>
        <ul className="rounded-lg border divide-y">
          {contacts.length === 0 ? (
            <li className="p-4 text-sm text-muted-foreground">{tc('empty.noData')}</li>
          ) : (
            contacts.map((c: any) => (
              <li key={c.id} className="p-4 flex justify-between items-center">
                <span className="text-sm font-medium">{c.first_name} {c.last_name}</span>
                <Link href={`/${locale}/app/contacts/${c.id}`}>
                  <Button variant="ghost" size="sm">{tc('actions.view')}</Button>
                </Link>
              </li>
            ))
          )}
        </ul>
      </div>

      <EntityTimeline entity="company" entityId={id} locale={locale} />
    </div>
  )
}
