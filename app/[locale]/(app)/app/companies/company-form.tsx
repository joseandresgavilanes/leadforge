'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { companySchema, type CompanyInput } from '@/lib/validators/schemas'
import { createCompany, updateCompany } from '@/features/contacts/actions'
import { Input, Label } from '@/components/ui/form-elements'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'

export default function CompanyForm({
  locale,
  company,
}: {
  locale: string
  company?: Record<string, unknown> & { id: string; name: string }
}) {
  const t = useTranslations('companies')
  const tc = useTranslations('common')
  const router = useRouter()
  const isEdit = Boolean(company)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CompanyInput>({
    resolver: zodResolver(companySchema),
    defaultValues: company
      ? {
          name: company.name,
          domain: (company.domain as string) ?? '',
          industry: (company.industry as string) ?? '',
          size: (company.size as string) ?? '',
          annualRevenue: (company.annual_revenue as number) ?? undefined,
          phone: (company.phone as string) ?? '',
          city: (company.city as string) ?? '',
          country: (company.country as string) ?? '',
          website: (company.website as string) ?? '',
          notes: (company.notes as string) ?? '',
        }
      : {},
  })

  async function onSubmit(data: CompanyInput) {
    if (isEdit && company) {
      const res = await updateCompany(company.id, data)
      if (!res.success) {
        toast({ title: res.error ?? tc('errors.generic'), variant: 'destructive' })
        return
      }
      toast({ title: tc('toast.updated', { entity: t('singular') }) })
      router.refresh()
      return
    }
    const res = await createCompany(data)
    if (!res.success) {
      toast({ title: res.error ?? tc('errors.generic'), variant: 'destructive' })
      return
    }
    if (!res.data) {
      toast({ title: tc('errors.generic'), variant: 'destructive' })
      return
    }
    toast({ title: tc('toast.created', { entity: t('singular') }) })
    router.push(`/${locale}/app/companies/${res.data.id}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-lg border bg-card p-6 max-w-xl">
      <div className="space-y-1.5">
        <Label htmlFor="name">{t('fields.name')}</Label>
        <Input id="name" {...register('name')} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="industry">{t('fields.industry')}</Label>
          <Input id="industry" {...register('industry')} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="website">{t('fields.website')}</Label>
          <Input id="website" {...register('website')} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="notes">{t('fields.notes')}</Label>
        <textarea id="notes" className="flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm" {...register('notes')} />
      </div>
      <Button type="submit" loading={isSubmitting}>{isEdit ? tc('actions.update') : tc('actions.create')}</Button>
    </form>
  )
}
