'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { contactSchema, type ContactInput } from '@/lib/validators/schemas'
import { createContact, updateContact } from '@/features/contacts/actions'
import { Input, Label } from '@/components/ui/form-elements'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import type { ContactWithCompany } from '@/types'

export default function ContactForm({
  locale,
  contact,
  companyOptions,
}: {
  locale: string
  contact?: ContactWithCompany
  companyOptions: { id: string; name: string }[]
}) {
  const t = useTranslations('contacts')
  const tc = useTranslations('common')
  const router = useRouter()
  const isEdit = Boolean(contact)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: contact
      ? {
          firstName: contact.first_name,
          lastName: contact.last_name ?? '',
          email: contact.email ?? '',
          phone: contact.phone ?? '',
          jobTitle: contact.job_title ?? '',
          companyId: contact.company_id ?? undefined,
          tags: contact.tags ?? [],
          notes: contact.notes ?? '',
          linkedinUrl: contact.linkedin_url ?? '',
        }
      : { tags: [] },
  })

  async function onSubmit(data: ContactInput) {
    if (isEdit && contact) {
      const res = await updateContact(contact.id, data)
      if (!res.success) {
        toast({ title: res.error ?? tc('errors.generic'), variant: 'destructive' })
        return
      }
      toast({ title: tc('toast.updated', { entity: t('singular') }) })
      router.refresh()
      return
    }
    const res = await createContact(data)
    if (!res.success) {
      toast({ title: res.error ?? tc('errors.generic'), variant: 'destructive' })
      return
    }
    if (!res.data) {
      toast({ title: tc('errors.generic'), variant: 'destructive' })
      return
    }
    toast({ title: tc('toast.created', { entity: t('singular') }) })
    router.push(`/${locale}/app/contacts/${res.data.id}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-lg border bg-card p-6 max-w-xl">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="firstName">{t('fields.firstName')}</Label>
          <Input id="firstName" {...register('firstName')} />
          {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lastName">{t('fields.lastName')}</Label>
          <Input id="lastName" {...register('lastName')} />
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">{t('fields.email')}</Label>
          <Input id="email" type="email" {...register('email')} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">{t('fields.phone')}</Label>
          <Input id="phone" {...register('phone')} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="jobTitle">{t('fields.jobTitle')}</Label>
        <Input id="jobTitle" {...register('jobTitle')} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="companyId">{t('fields.company')}</Label>
        <select id="companyId" className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" {...register('companyId')}>
          <option value="">—</option>
          {companyOptions.map((co) => (
            <option key={co.id} value={co.id}>{co.name}</option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="linkedinUrl">{t('fields.linkedIn')}</Label>
        <Input id="linkedinUrl" {...register('linkedinUrl')} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="notes">{t('fields.notes')}</Label>
        <textarea id="notes" className="flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm" {...register('notes')} />
      </div>
      <Button type="submit" loading={isSubmitting}>{isEdit ? tc('actions.update') : tc('actions.create')}</Button>
    </form>
  )
}
