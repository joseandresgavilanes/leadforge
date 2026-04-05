import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getCompanies } from '@/features/contacts/actions'
import ContactForm from '../contact-form'

export default async function NewContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations('contacts')
  const tc = await getTranslations('common')
  const { data: companies } = await getCompanies(undefined, 1, 500)

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href={`/${locale}/app/contacts`}>
          <Button variant="ghost" size="sm">{tc('actions.back')}</Button>
        </Link>
        <h1 className="text-2xl font-heading font-bold">{t('createContact')}</h1>
      </div>
      <ContactForm locale={locale} companyOptions={companies.map((c: { id: string; name: string }) => ({ id: c.id, name: c.name }))} />
    </div>
  )
}
