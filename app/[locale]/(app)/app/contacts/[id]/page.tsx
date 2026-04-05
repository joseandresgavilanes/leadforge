import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { getContactById, getCompanies } from '@/features/contacts/actions'
import { getActivities } from '@/features/tasks/actions'
import { Button } from '@/components/ui/button'
import ContactForm from '../contact-form'
import { formatRelative } from '@/lib/utils'
import { AddContactNoteForm } from './add-note-form'

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  const [contact, companies, activities, t, tc] = await Promise.all([
    getContactById(id),
    getCompanies(undefined, 1, 500),
    getActivities({ contactId: id, limit: 25 }),
    getTranslations('contacts'),
    getTranslations('common'),
  ])

  if (!contact) notFound()

  const companyOpts = companies.data.map((c: { id: string; name: string }) => ({ id: c.id, name: c.name }))

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href={`/${locale}/app/contacts`}>
          <Button variant="ghost" size="sm">{tc('actions.back')}</Button>
        </Link>
        <h1 className="text-2xl font-heading font-bold">
          {contact.first_name} {contact.last_name}
        </h1>
      </div>

      <ContactForm locale={locale} contact={contact as any} companyOptions={companyOpts} />

      <AddContactNoteForm locale={locale} contactId={id} />

      <div>
        <h2 className="font-heading font-semibold mb-3">{t('tabs.activity')}</h2>
        <ul className="rounded-lg border divide-y bg-card">
          {(activities as any[]).length === 0 ? (
            <li className="p-4 text-sm text-muted-foreground">{tc('empty.noData')}</li>
          ) : (
            (activities as any[]).map((a) => (
              <li key={a.id} className="p-4 text-sm">
                <p className="font-medium">{a.subject}</p>
                <p className="text-xs text-muted-foreground capitalize">{a.type} · {formatRelative(a.activity_date, locale)}</p>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  )
}
