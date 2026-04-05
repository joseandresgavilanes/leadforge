import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { getContactById, getCompanies } from '@/features/contacts/actions'
import { Button } from '@/components/ui/button'
import ContactForm from '../contact-form'
import { AddContactNoteForm } from './add-note-form'
import { EntityTimeline } from '@/components/crm/entity-timeline'

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  const [contact, companies, t, tc] = await Promise.all([
    getContactById(id),
    getCompanies(undefined, 1, 500),
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

      <EntityTimeline entity="contact" entityId={id} locale={locale} />
    </div>
  )
}
