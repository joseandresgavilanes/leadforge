import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import CompanyForm from '../company-form'

export default async function NewCompanyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations('companies')
  const tc = await getTranslations('common')

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href={`/${locale}/app/companies`}>
          <Button variant="ghost" size="sm">{tc('actions.back')}</Button>
        </Link>
        <h1 className="text-2xl font-heading font-bold">{t('createCompany')}</h1>
      </div>
      <CompanyForm locale={locale} />
    </div>
  )
}
