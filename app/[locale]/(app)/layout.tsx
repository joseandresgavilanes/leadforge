import { redirect } from 'next/navigation'
import { requireAuth, getActiveOrganization, getUserOrganizations } from '@/lib/auth/server'
import AppLayoutClient from './layout-client'

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const user = await requireAuth(locale)
  const orgData = await getActiveOrganization(user.id)
  const allOrgs = await getUserOrganizations(user.id)

  if (!orgData) {
    redirect(`/${locale}/onboarding`)
  }

  return (
    <AppLayoutClient
      locale={locale}
      user={user.profile}
      organization={orgData.organization}
      organizations={allOrgs as any}
    >
      {children}
    </AppLayoutClient>
  )
}
