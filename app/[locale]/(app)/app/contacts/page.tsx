import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { getContacts } from '@/features/contacts/actions'
import { Button } from '@/components/ui/button'
import { Plus, Search } from 'lucide-react'

export default async function ContactsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ search?: string; page?: string }>
}) {
  const { locale } = await params
  const sp = await searchParams
  const t = await getTranslations('contacts')
  const tc = await getTranslations('common')
  const page = parseInt(sp.page ?? '1', 10)
  const { data, total, totalPages } = await getContacts(sp.search, page)
  const base = `/${locale}/app`

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold">{t('title')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{total} {t('plural')}</p>
        </div>
        <Link href={`${base}/contacts/new`}>
          <Button><Plus className="h-4 w-4" />{t('createContact')}</Button>
        </Link>
      </div>
      <form method="get" className="flex gap-2 flex-wrap">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input name="search" defaultValue={sp.search} placeholder={`${tc('actions.search')}...`}
            className="h-9 pl-9 pr-3 text-sm border rounded-md bg-background w-56" />
        </div>
        <Button type="submit" variant="secondary" size="sm">{tc('actions.filter')}</Button>
      </form>
      <div className="rounded-lg border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('singular')}</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">{t('fields.email')}</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">{t('fields.company')}</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">{tc('actions.view')}</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-12 text-muted-foreground">{t('empty.title')}</td></tr>
            ) : (
              data.map((c) => (
                <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{c.first_name} {c.last_name}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{c.email ?? '—'}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">{c.company?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`${base}/contacts/${c.id}`}><Button variant="ghost" size="sm">{tc('actions.view')}</Button></Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="flex justify-between px-4 py-3 border-t text-sm text-muted-foreground">
            <span>{tc('table.page', { current: page, total: totalPages })}</span>
            <div className="flex gap-2">
              {page > 1 && <Link href={`${base}/contacts?page=${page - 1}${sp.search ? `&search=${sp.search}` : ''}`}><Button variant="outline" size="sm">{tc('actions.previous')}</Button></Link>}
              {page < totalPages && <Link href={`${base}/contacts?page=${page + 1}${sp.search ? `&search=${sp.search}` : ''}`}><Button variant="outline" size="sm">{tc('actions.next')}</Button></Link>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
